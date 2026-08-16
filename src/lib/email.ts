import 'server-only'

import nodemailer from 'nodemailer'

type Transport = ReturnType<typeof nodemailer.createTransport> | undefined

let devTransport: Transport

function getTransport() {
  if (process.env.EMAIL_TRANSPORT === 'smtp' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
    })
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

// Sends a transactional email. In dev (default) the message is logged to the
// console instead of being delivered, so no SMTP credentials are required.
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM ?? 'SMS <no-reply@example.com>'
  const transport = getTransport()
  try {
    const info = await transport.sendMail({ from, to, subject, html })
    if (process.env.EMAIL_TRANSPORT !== 'smtp') {
      console.log(`[email][console transport] to=${to} subject="${subject}"`)
    } else {
      console.log(`[email][smtp] messageId=${info.messageId} to=${to} subject="${subject}"`)
    }
  } catch (err) {
    // Never fail a mutation because email delivery failed; log and continue.
    console.error('[email] delivery failed', err instanceof Error ? err.message : err)
  }
}
