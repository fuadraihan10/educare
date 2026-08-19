import { describe, expect, it, beforeEach } from 'vitest'

import { clearAttempts, isRateLimited, loginRateLimitKey, recordAttempt } from '@/lib/rate-limit'

describe('rate-limit', () => {
  beforeEach(async () => {
    await clearAttempts('test-key')
    await clearAttempts('login:1.2.3.4:user@example.com')
  })

  it('allows attempts below the limit', async () => {
    for (let i = 0; i < 9; i++) await recordAttempt('test-key')
    expect(await isRateLimited('test-key')).toBe(false)
  })

  it('blocks at the tenth attempt', async () => {
    for (let i = 0; i < 10; i++) await recordAttempt('test-key')
    expect(await isRateLimited('test-key')).toBe(true)
  })

  it('clears attempts', async () => {
    for (let i = 0; i < 10; i++) await recordAttempt('test-key')
    expect(await isRateLimited('test-key')).toBe(true)
    await clearAttempts('test-key')
    expect(await isRateLimited('test-key')).toBe(false)
  })

  it('builds a normalized login key', () => {
    expect(loginRateLimitKey('1.2.3.4', 'USER@example.com')).toBe('login:1.2.3.4:user@example.com')
    expect(loginRateLimitKey(null, 'a@b.com')).toBe('login:unknown:a@b.com')
  })
})
