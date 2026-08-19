import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getRedis } from '@/lib/redis'

export async function GET() {
  const checks: Record<string, string> = {}
  const start = Date.now()

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ])
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  const redis = getRedis()
  if (redis) {
    try {
      await Promise.race([
        redis.ping(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ])
      checks.redis = 'ok'
    } catch {
      checks.redis = 'error'
    }
  } else {
    checks.redis = 'unavailable'
  }

  const healthy = checks.database === 'ok'
  const duration = Date.now() - start

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${duration}ms`,
    },
    { status: healthy ? 200 : 503 }
  )
}
