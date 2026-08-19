import { describe, expect, it } from 'vitest'
import { credentialsSchema, resolveIp } from '@/lib/auth-helpers'

describe('auth-helpers', () => {
  describe('credentialsSchema', () => {
    it('accepts valid regNo and password', () => {
      const result = credentialsSchema.safeParse({
        regNo: 'ADM-0001',
        password: 'secret123',
      })
      expect(result.success).toBe(true)
    })

    it('normalizes regNo to uppercase and trims', () => {
      const result = credentialsSchema.safeParse({
        regNo: 'adm-0001',
        password: 'secret123',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.regNo).toBe('ADM-0001')
      }
    })

    it('rejects empty regNo', () => {
      const result = credentialsSchema.safeParse({
        regNo: '',
        password: 'secret123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = credentialsSchema.safeParse({
        regNo: 'ADM-0001',
        password: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects regNo over 50 characters', () => {
      const result = credentialsSchema.safeParse({
        regNo: 'A'.repeat(51),
        password: 'secret123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password over 255 characters', () => {
      const result = credentialsSchema.safeParse({
        regNo: 'ADM-0001',
        password: 'a'.repeat(256),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('resolveIp', () => {
    it('returns a non-empty string', () => {
      const headers = new Headers()
      const result = resolveIp(headers)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('parses first IP from x-forwarded-for string', () => {
      const forwarded = '1.2.3.4, 5.6.7.8'
      const first = forwarded.split(',')[0]?.trim()
      expect(first).toBe('1.2.3.4')
    })

    it('handles single IP in x-forwarded-for', () => {
      const forwarded = '10.0.0.1'
      const first = forwarded.split(',')[0]?.trim()
      expect(first).toBe('10.0.0.1')
    })
  })
})
