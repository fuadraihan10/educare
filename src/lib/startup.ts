import 'server-only'

import { registerShutdownHandlers } from '@/lib/shutdown'
import { startWorkerLoop } from '@/lib/queue'
import { getRedis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'

export function initApp(): void {
  registerShutdownHandlers()
  startQueueWorker()
  cleanupStaleTokens().catch((err) => logger.error({ err }, 'Token cleanup failed'))
  logger.info('Application initialized')
}

function startQueueWorker(): void {
  const redis = getRedis()
  if (redis) {
    startWorkerLoop()
    logger.info('Queue worker started')
  } else {
    logger.debug('Redis not available, queue worker not started')
  }
}

async function cleanupStaleTokens(): Promise<void> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  })
  if (result.count > 0) {
    logger.info({ deleted: result.count }, 'Cleaned up stale password reset tokens')
  }
}
