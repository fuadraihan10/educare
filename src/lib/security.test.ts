import { describe, expect, it } from 'vitest'
import { validatePasswordStrength } from '@/lib/password'
import { credentialsSchema } from '@/lib/auth-helpers'
import { randomUUID } from 'crypto'

describe('security', () => {
  describe('password validation', () => {
    it('rejects common passwords', () => {
      const result = validatePasswordStrength('Password1')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password is too common')
    })

    it('rejects another common password', () => {
      const result = validatePasswordStrength('Passw0rd')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password is too common')
    })

    it('enforces minimum length', () => {
      const result = validatePasswordStrength('Ab1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('enforces uppercase requirement', () => {
      const result = validatePasswordStrength('lowercase1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('enforces lowercase requirement', () => {
      const result = validatePasswordStrength('UPPERCASE1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('enforces number requirement', () => {
      const result = validatePasswordStrength('NoNumbers!!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })
  })

  describe('email validation', () => {
    it('rejects invalid email format', () => {
      const result = credentialsSchema.safeParse({
        email: 'not-an-email',
        password: 'Secret1!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects email without domain', () => {
      const result = credentialsSchema.safeParse({
        email: 'user@',
        password: 'Secret1!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects email without local part', () => {
      const result = credentialsSchema.safeParse({
        email: '@example.com',
        password: 'Secret1!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects email with spaces', () => {
      const result = credentialsSchema.safeParse({
        email: 'user @example.com',
        password: 'Secret1!',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('token generation', () => {
    it('produces different values (basic randomness check)', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 50; i++) {
        tokens.add(randomUUID())
      }
      expect(tokens.size).toBe(50)
    })
  })
})
