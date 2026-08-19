import { describe, expect, it, beforeEach } from 'vitest'
import { apiRateLimit, loginRateLimitKey, clearAttempts } from '@/lib/rate-limit'

describe('rate-limit-advanced', () => {
  beforeEach(() => {
    clearAttempts('api:test-adv')
    clearAttempts('api:test-adv-2')
  })

  it('apiRateLimit returns false below limit', async () => {
    const result = await apiRateLimit('test-adv', 5, 60)
    expect(result).toBe(false)
  })

  it('apiRateLimit returns true at/above limit', async () => {
    for (let i = 0; i < 5; i++) {
      await apiRateLimit('test-adv', 4, 60)
    }
    const result = await apiRateLimit('test-adv', 4, 60)
    expect(result).toBe(true)
  })

  it('different keys are independent', async () => {
    for (let i = 0; i < 5; i++) {
      await apiRateLimit('test-adv', 4, 60)
    }
    expect(await apiRateLimit('test-adv', 4, 60)).toBe(true)
    expect(await apiRateLimit('test-adv-2', 4, 60)).toBe(false)
  })

  it('loginRateLimitKey normalizes emails', () => {
    expect(loginRateLimitKey('1.2.3.4', 'USER@Example.COM')).toBe('login:1.2.3.4:user@example.com')
    expect(loginRateLimitKey('1.2.3.4', 'test@test.com')).toBe('login:1.2.3.4:test@test.com')
  })

  it('loginRateLimitKey handles null IP', () => {
    expect(loginRateLimitKey(null, 'user@test.com')).toBe('login:unknown:user@test.com')
  })
})
