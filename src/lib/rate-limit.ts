import 'server-only'

import { logger } from '@/lib/logger'

let cachedRedis: import('ioredis').Redis | null = null
let resolved = false

function getRedisLazy(): import('ioredis').Redis | null {
  if (resolved) return cachedRedis
  resolved = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/redis') as typeof import('@/lib/redis')
    cachedRedis = mod.getRedis()
  } catch {
    cachedRedis = null
  }
  return cachedRedis
}

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10

type Entry = { count: number; resetAt: number }

const attempts = new Map<string, Entry>()

export function loginRateLimitKey(ip: string | null | undefined, identifier: string): string {
  return `login:${ip ?? 'unknown'}:${identifier.toLowerCase()}`
}

export async function isRateLimited(key: string): Promise<boolean> {
  const redis = getRedisLazy()
  if (redis) {
    try {
      const redisKey = `sms:ratelimit:${key}`
      const count = await redis.get(redisKey)
      return count !== null && parseInt(count, 10) >= MAX_ATTEMPTS
    } catch {
      logger.warn('Redis rate limit check failed, failing open')
      return process.env.NODE_ENV === 'production'
    }
  }
  return inMemoryIsRateLimited(key)
}

export async function recordAttempt(key: string): Promise<void> {
  const redis = getRedisLazy()
  if (redis) {
    try {
      const redisKey = `sms:ratelimit:${key}`
      const now = Date.now()
      const windowStart = now - WINDOW_MS
      const pipe = redis.pipeline()
      pipe.zremrangebyscore(redisKey, 0, windowStart)
      pipe.zadd(redisKey, now.toString(), `${now}-${Math.random()}`)
      pipe.zcard(redisKey)
      pipe.pexpire(redisKey, WINDOW_MS)
      await pipe.exec()
      return
    } catch {
      // fall through to in-memory
    }
  }
  inMemoryRecordAttempt(key)
}

export async function clearAttempts(key: string): Promise<void> {
  const redis = getRedisLazy()
  if (redis) {
    try {
      await redis.del(`sms:ratelimit:${key}`)
      return
    } catch {
      // fall through
    }
  }
  inMemoryClearAttempts(key)
}

async function redisApiCheck(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const redis = getRedisLazy()
  if (!redis) return false

  try {
    const redisKey = `sms:ratelimit:api:${key}`
    const now = Date.now()
    const windowStart = now - windowSeconds * 1000

    const pipe = redis.pipeline()
    pipe.zremrangebyscore(redisKey, 0, windowStart)
    pipe.zadd(redisKey, now.toString(), `${now}-${Math.random()}`)
    pipe.zcard(redisKey)
    pipe.pexpire(redisKey, windowSeconds * 1000)

    const results = await pipe.exec()
    if (!results) return false

    const count = results[2]?.[1] as number | undefined
    return (count ?? 0) > maxRequests
  } catch {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Redis API rate limit check failed, failing closed')
      return true
    }
    return false
  }
}

export async function apiRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const redis = getRedisLazy()
  if (redis) {
    return redisApiCheck(key, maxRequests, windowSeconds)
  }
  // In production without Redis, fail-closed
  if (process.env.NODE_ENV === 'production') {
    logger.warn('No Redis for API rate limiting in production — blocking request')
    return true
  }
  return inMemoryApiRateLimit(key, maxRequests, windowSeconds)
}

// ---- In-memory fallbacks (development only) ----

function inMemoryIsRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry) return false
  if (now > entry.resetAt) {
    attempts.delete(key)
    return false
  }
  return entry.count >= MAX_ATTEMPTS
}

function inMemoryRecordAttempt(key: string): void {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  entry.count += 1
}

function inMemoryClearAttempts(key: string): void {
  attempts.delete(key)
}

function inMemoryApiRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const entry = attempts.get(`api:${key}`)

  if (!entry || now > entry.resetAt) {
    attempts.set(`api:${key}`, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count += 1
  return entry.count > maxRequests
}
