import { describe, expect, it, beforeEach } from 'vitest'

import { clearAttempts, isRateLimited, loginRateLimitKey, recordAttempt } from '@/lib/rate-limit'

describe('rate-limit', () => {
  beforeEach(() => {
    clearAttempts('test-key')
    clearAttempts('login:1.2.3.4:user@example.com')
  })

  it('allows attempts below the limit', () => {
    for (let i = 0; i < 9; i++) recordAttempt('test-key')
    expect(isRateLimited('test-key')).toBe(false)
  })

  it('blocks at the tenth attempt', () => {
    for (let i = 0; i < 10; i++) recordAttempt('test-key')
    expect(isRateLimited('test-key')).toBe(true)
  })

  it('clears attempts', () => {
    for (let i = 0; i < 10; i++) recordAttempt('test-key')
    expect(isRateLimited('test-key')).toBe(true)
    clearAttempts('test-key')
    expect(isRateLimited('test-key')).toBe(false)
  })

  it('builds a normalized login key', () => {
    expect(loginRateLimitKey('1.2.3.4', 'USER@example.com')).toBe('login:1.2.3.4:user@example.com')
    expect(loginRateLimitKey(null, 'a@b.com')).toBe('login:unknown:a@b.com')
  })
})
