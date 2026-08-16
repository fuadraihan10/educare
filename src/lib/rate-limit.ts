import 'server-only'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10

type Entry = { count: number; resetAt: number }

const attempts = new Map<string, Entry>()

export function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry) return false
  if (now > entry.resetAt) {
    attempts.delete(key)
    return false
  }
  return entry.count >= MAX_ATTEMPTS
}

export function recordAttempt(key: string): void {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  entry.count += 1
}

export function clearAttempts(key: string): void {
  attempts.delete(key)
}

export function loginRateLimitKey(ip: string | null | undefined, email: string): string {
  return `login:${ip ?? 'unknown'}:${email.toLowerCase()}`
}
