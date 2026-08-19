import 'server-only'

import { randomUUID } from 'crypto'
import { getRedis } from '@/lib/redis'
import { logger } from '@/lib/logger'

export type JobType = 'email' | 'csv-import' | 'report-generation' | 'pdf-generation' | 'export' | 'cleanup'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface Job<T = unknown> {
  id: string
  type: JobType
  payload: T
  status: JobStatus
  attempt: number
  maxAttempts: number
  createdAt: string
  updatedAt: string
  error?: string
  result?: unknown
}

interface EnqueueOptions {
  maxAttempts?: number
  delay?: number
}

type WorkerHandler<T = unknown> = (payload: T) => Promise<unknown>

const workers = new Map<JobType, WorkerHandler>()

const QUEUE_PREFIX = 'sms:queue'
const STATUS_PREFIX = 'sms:job'

function statusKey(id: string): string {
  return `${STATUS_PREFIX}:${id}`
}

function queueKey(type: JobType): string {
  return `${QUEUE_PREFIX}:${type}`
}

const memoryJobs = new Map<string, Job>()
const memoryQueues = new Map<string, string[]>()
const MEMORY_JOBS_MAX = 500

function evictCompletedMemoryJobs(): void {
  if (memoryJobs.size <= MEMORY_JOBS_MAX) return
  const entries = Array.from(memoryJobs.entries())
  const sorted = entries.sort((a, b) => a[1].updatedAt.localeCompare(b[1].updatedAt))
  const toRemove = sorted.slice(0, sorted.length - MEMORY_JOBS_MAX)
  for (const [id] of toRemove) {
    memoryJobs.delete(id)
  }
}

export async function enqueueJob<T = unknown>(
  type: JobType,
  payload: T,
  options?: EnqueueOptions,
): Promise<string> {
  const id = randomUUID()
  const job: Job<T> = {
    id,
    type,
    payload,
    status: 'pending',
    attempt: 0,
    maxAttempts: options?.maxAttempts ?? 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  logger.info({ jobId: id, type }, 'Enqueueing job')

  const redis = getRedis()
  if (redis) {
    try {
      const serialized = JSON.stringify(job)
      await redis.set(statusKey(id), serialized)
      await redis.lpush(queueKey(type), id)
      return id
    } catch (err) {
      logger.warn({ err, jobId: id }, 'Redis enqueue failed, falling back to memory')
    }
  }

  memoryJobs.set(id, job as Job)
  const q = memoryQueues.get(type) ?? []
  q.push(id)
  memoryQueues.set(type, q)
  evictCompletedMemoryJobs()

  return id
}

export async function getJobStatus(id: string): Promise<Job | null> {
  const redis = getRedis()
  if (redis) {
    try {
      const raw = await redis.get(statusKey(id))
      if (!raw) return null
      return JSON.parse(raw) as Job
    } catch (err) {
      logger.debug({ err, jobId: id }, 'Redis getJobStatus failed')
    }
  }

  return memoryJobs.get(id) ?? null
}

async function updateJobStatus(job: Job): Promise<void> {
  job.updatedAt = new Date().toISOString()

  const redis = getRedis()
  if (redis) {
    try {
      await redis.set(statusKey(job.id), JSON.stringify(job))
      return
    } catch {
      // fall through to memory
    }
  }

  memoryJobs.set(job.id, job)
}

async function popJob(type: JobType): Promise<string | null> {
  const redis = getRedis()
  if (redis) {
    try {
      return await redis.rpop(queueKey(type))
    } catch {
      // fall through to memory
    }
  }

  const q = memoryQueues.get(type) ?? []
  return q.shift() ?? null
}

function backoffMs(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000)
}

export function registerWorker<T = unknown>(type: JobType, handler: WorkerHandler<T>): void {
  workers.set(type, handler as WorkerHandler)
  logger.info({ type }, 'Worker registered')
}

async function processNext(type: JobType): Promise<boolean> {
  const jobId = await popJob(type)
  if (!jobId) return false

  const job = await getJobStatus(jobId)

  if (!job) return false

  const handler = workers.get(type)
  if (!handler) {
    job.status = 'failed'
    job.error = 'No worker registered for this job type'
    await updateJobStatus(job)
    return true
  }

  job.status = 'processing'
  job.attempt += 1
  await updateJobStatus(job)

  try {
    const result = await handler(job.payload)
    job.status = 'completed'
    job.result = result
    await updateJobStatus(job)
    logger.info({ jobId: job.id, type, attempt: job.attempt }, 'Job completed')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logger.error({ jobId: job.id, type, attempt: job.attempt, err: errorMessage }, 'Job failed')

    if (job.attempt < job.maxAttempts) {
      job.status = 'pending'
      job.error = errorMessage
      await updateJobStatus(job)
      const delay = backoffMs(job.attempt)
      logger.info({ jobId: job.id, delay }, 'Retrying job')
      setTimeout(() => {
        enqueueJob(type, job.payload, { maxAttempts: job.maxAttempts })
      }, delay)
    } else {
      job.status = 'failed'
      job.error = errorMessage
      await updateJobStatus(job)
    }
  }

  return true
}

export async function processJobs(type?: JobType): Promise<void> {
  const types: JobType[] = type ? [type] : (['email', 'csv-import', 'report-generation', 'pdf-generation', 'export', 'cleanup'] as JobType[])

  for (const t of types) {
    if (!workers.has(t)) continue
    await processNext(t)
  }
}

let workerInterval: ReturnType<typeof setInterval> | null = null

export function startWorkerLoop(intervalMs: number = 5000): void {
  if (workerInterval) return
  workerInterval = setInterval(() => {
    processJobs().catch((err) => {
      logger.error({ err }, 'Worker loop processJobs error')
    })
  }, intervalMs)
  logger.info({ intervalMs }, 'Queue worker loop started')
}

export function stopWorkerLoop(): void {
  if (workerInterval) {
    clearInterval(workerInterval)
    workerInterval = null
    logger.info('Queue worker loop stopped')
  }
}

export async function getQueueLength(type: JobType): Promise<number> {
  const redis = getRedis()
  if (redis) {
    try {
      return await redis.llen(queueKey(type))
    } catch {
      // fall through
    }
  }

  return (memoryQueues.get(type) ?? []).length
}
