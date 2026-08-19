import { randomUUID } from 'crypto'
import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
    },
  }),
  base: isDev ? undefined : { service: 'sms' },
  redact: {
    paths: ['password', 'passwordHash', 'token', 'secret', 'authorization', 'cookie', '*.email', '*.phone', '*.guardianPhone', '*.guardianEmail'],
    censor: '[REDACTED]',
  },
})

export type Logger = typeof logger

export function createRequestLogger(requestId: string, extra?: Record<string, unknown>) {
  return logger.child({ requestId, ...extra })
}

export function generateRequestId(): string {
  return randomUUID()
}
