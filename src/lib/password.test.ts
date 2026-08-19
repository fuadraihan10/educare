import { describe, expect, it } from 'vitest'
import { validatePasswordStrength, generateTempPassword } from '@/lib/password'

describe('validatePasswordStrength', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const result = validatePasswordStrength('Ab1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must be at least 8 characters long')
  })

  it('rejects passwords without lowercase letters', () => {
    const result = validatePasswordStrength('ABCDEF12!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one lowercase letter')
  })

  it('rejects passwords without uppercase letters', () => {
    const result = validatePasswordStrength('abcdef12!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one uppercase letter')
  })

  it('rejects passwords without numbers', () => {
    const result = validatePasswordStrength('Abcdefgh!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must contain at least one number')
  })

  it('rejects common passwords', () => {
    const result = validatePasswordStrength('Password1')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password is too common')
  })

  it('accepts strong passwords', () => {
    const result = validatePasswordStrength('Xk9#mP2$vLqR')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns multiple errors for very weak passwords', () => {
    const result = validatePasswordStrength('123')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('generateTempPassword', () => {
  it('generates a 12-character password', () => {
    const pw = generateTempPassword()
    expect(pw).toHaveLength(12)
  })

  it('includes uppercase, lowercase, digit, and special character', () => {
    const pw = generateTempPassword()
    expect(pw).toMatch(/[A-Z]/)
    expect(pw).toMatch(/[a-z]/)
    expect(pw).toMatch(/[0-9]/)
    expect(pw).toMatch(/[!@#$%]/)
  })

  it('passes its own strength validation', () => {
    const pw = generateTempPassword()
    const result = validatePasswordStrength(pw)
    expect(result.valid).toBe(true)
  })

  it('generates different passwords on successive calls', () => {
    const passwords = new Set(Array.from({ length: 20 }, () => generateTempPassword()))
    expect(passwords.size).toBeGreaterThan(1)
  })
})
