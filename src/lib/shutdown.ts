import 'server-only'

import { logger } from '@/lib/logger'
import { disconnect } from '@/lib/db'
import { quitRedis } from '@/lib/redis'
import { stopWorkerLoop } from '@/lib/queue'

let shuttingDown = false

export function registerShutdownHandlers(): void {
  const handler = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true

    logger.info({ signal }, 'Shutdown signal received')

    const forceExitTimer = setTimeout(() => {
      logger.error('Shutdown timed out, forcing exit')
      process.exit(1)
    }, 10000)
    forceExitTimer.unref()

    try {
      stopWorkerLoop()
      await disconnect()
      await quitRedis()
      logger.info('Graceful shutdown complete')
    } catch (err) {
      logger.error({ err }, 'Error during shutdown')
    }

    clearTimeout(forceExitTimer)
    process.exit(0)
  }

  process.on('SIGTERM', () => handler('SIGTERM'))
  process.on('SIGINT', () => handler('SIGINT'))
  process.on('beforeExit', () => handler('beforeExit'))
}
