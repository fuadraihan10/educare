import 'server-only'

import { randomUUID } from 'crypto'
import Redis from 'ioredis'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

const NAMESPACES = 'sms'

let client: Redis | null = null
let connecting = false

export function getRedis(): Redis | null {
  if (client) return client
  if (connecting) return null

  if (!env.REDIS_URL) {
    logger.debug('REDIS_URL not set, Redis disabled')
    return null
  }

  connecting = true

  try {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.error('Redis reconnection failed after 5 attempts')
          return null
        }
        return Math.min(times * 200, 2000)
      },
      lazyConnect: true,
      connectTimeout: 5000,
    })

    client.on('error', (err) => {
      logger.error({ err: err.message }, 'Redis connection error')
    })

    client.on('connect', () => {
      logger.info('Redis connected')
    })

    client.on('close', () => {
      logger.warn('Redis connection closed')
      client = null
      connecting = false
    })

    client.connect().catch(() => {
      logger.warn('Redis initial connection failed, operating without cache')
      client = null
      connecting = false
    })

    return client
  } catch {
    connecting = false
    return null
  }
}

function nsKey(namespace: string, key: string): string {
  return `${NAMESPACES}:${namespace}:${key}`
}

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const raw = await redis.get(nsKey('cache', key))
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch (err) {
    logger.debug({ err }, 'Redis getCache failed')
    return null
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const serialized = JSON.stringify(value)
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(nsKey('cache', key), serialized, 'EX', ttlSeconds)
    } else {
      await redis.set(nsKey('cache', key), serialized)
    }
  } catch (err) {
    logger.debug({ err }, 'Redis setCache failed')
  }
}

export async function delCache(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(nsKey('cache', key))
  } catch (err) {
    logger.debug({ err }, 'Redis delCache failed')
  }
}

export async function delCachePattern(pattern: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const fullPattern = nsKey('cache', pattern)
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== '0')
  } catch (err) {
    logger.debug({ err }, 'Redis delCachePattern failed')
  }
}

export async function acquireLock(key: string, ttlMs: number = 10000): Promise<string | null> {
  const redis = getRedis()
  if (!redis) return randomUUID()
  const lockKey = nsKey('lock', key)
  const ownerToken = randomUUID()
  try {
    const result = await redis.set(lockKey, ownerToken, 'PX', ttlMs, 'NX')
    return result === 'OK' ? ownerToken : null
  } catch (err) {
    logger.debug({ err }, 'Redis acquireLock failed')
    return null
  }
}

export async function releaseLock(key: string, ownerToken: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const lockKey = nsKey('lock', key)
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `
    await redis.eval(script, 1, lockKey, ownerToken)
  } catch (err) {
    logger.debug({ err }, 'Redis releaseLock failed')
  }
}

export async function quitRedis(): Promise<void> {
  if (client) {
    const c = client
    client = null
    connecting = false
    await c.quit()
  }
}
