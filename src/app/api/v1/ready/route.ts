import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getRedis } from '@/lib/redis'

export async function GET() {
  const checks: Record<string, string> = {}
  let healthy = true

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ])
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
    healthy = false
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
      healthy = false
    }
  } else {
    checks.redis = 'unavailable'
  }

  return NextResponse.json(
    {
      status: healthy ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: healthy ? 200 : 503 }
  )
}
