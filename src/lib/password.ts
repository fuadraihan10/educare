import { randomBytes } from 'crypto'

const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'password1', 'password123',
])

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (password.length > 128) {
    errors.push('Password must be at most 128 characters long')
  }

  if (/[a-z]/.test(password) === false) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (/[A-Z]/.test(password) === false) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (/[0-9]/.test(password) === false) {
    errors.push('Password must contain at least one number')
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Password is too common')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const specials = '!@#$%'

  const pick = (chars: string, n: number) => {
    const buf = randomBytes(n)
    return Array.from(buf, (b) => chars[b % chars.length]).join('')
  }

  const required = [
    pick(upper, 1),
    pick(lower, 1),
    pick(digits, 1),
    pick(specials, 1),
  ]
  const rest = pick(upper + lower + digits + specials, 8)

  const combined = (required.join('') + rest)
    .split('')
    .map((c, i) => ({ c, sort: randomBytes(1)[0]! + i }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ c }) => c)
    .join('')

  return combined
}
