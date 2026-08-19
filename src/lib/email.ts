import 'server-only'

import nodemailer from 'nodemailer'
import { logger } from '@/lib/logger'

type Transport = ReturnType<typeof nodemailer.createTransport> | undefined

let devTransport: Transport
let smtpTransport: Transport

function getTransport() {
  if (process.env.EMAIL_TRANSPORT === 'smtp' && process.env.SMTP_HOST) {
    if (!smtpTransport) {
      const port = Number(process.env.SMTP_PORT ?? 587)
      const secure = port === 465
      smtpTransport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        requireTLS: !secure,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASSWORD
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        tls: {
          minVersion: 'TLSv1.2',
        },
      })
      logger.info({ host: process.env.SMTP_HOST, port, secure }, '[email] SMTP transport created')
    }
    return smtpTransport
  }
  if (!devTransport) {
    devTransport = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    })
  }
  return devTransport
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM ?? 'SMS <no-reply@example.com>'
  const transport = getTransport()
  const info = await transport.sendMail({ from, to, subject, html })
  if (process.env.EMAIL_TRANSPORT !== 'smtp') {
    logger.info({ to, subject }, '[email][console transport]')
  } else {
    logger.info({ messageId: info.messageId, to, subject }, '[email][smtp] sent')
  }
}
