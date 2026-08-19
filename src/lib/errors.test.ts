import { describe, expect, it } from 'vitest'
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  successResponse,
  errorResponse,
  fromError,
} from '@/lib/errors'

describe('AppError', () => {
  it('creates an error with code, message, and statusCode', () => {
    const err = new AppError('NOT_FOUND', 'not found', 404)
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('not found')
    expect(err.statusCode).toBe(404)
    expect(err.name).toBe('AppError')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(AppError)
  })

  it('defaults statusCode to 500', () => {
    const err = new AppError('INTERNAL_ERROR', 'oops')
    expect(err.statusCode).toBe(500)
  })

  it('stores details', () => {
    const details = { field: 'email' }
    const err = new AppError('VALIDATION_ERROR', 'bad', 400, details)
    expect(err.details).toEqual(details)
  })
})

describe('NotFoundError', () => {
  it('formats message with resource and id', () => {
    const err = new NotFoundError('Student', 'abc-123')
    expect(err.code).toBe('NOT_FOUND')
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe('Student with id abc-123 not found')
  })

  it('formats message with resource only', () => {
    const err = new NotFoundError('Class')
    expect(err.message).toBe('Class not found')
  })
})

describe('UnauthorizedError', () => {
  it('uses default message', () => {
    const err = new UnauthorizedError()
    expect(err.code).toBe('UNAUTHORIZED')
    expect(err.statusCode).toBe(401)
    expect(err.message).toBe('Authentication required')
  })

  it('accepts custom message', () => {
    const err = new UnauthorizedError('Token expired')
    expect(err.message).toBe('Token expired')
  })
})

describe('ForbiddenError', () => {
  it('uses default message', () => {
    const err = new ForbiddenError()
    expect(err.code).toBe('FORBIDDEN')
    expect(err.statusCode).toBe(403)
    expect(err.message).toBe('Insufficient permissions')
  })

  it('accepts custom message', () => {
    const err = new ForbiddenError('Admin only')
    expect(err.message).toBe('Admin only')
  })
})

describe('ValidationError', () => {
  it('stores message and details', () => {
    const details = { email: 'invalid' }
    const err = new ValidationError('Invalid input', details)
    expect(err.code).toBe('VALIDATION_ERROR')
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe('Invalid input')
    expect(err.details).toEqual(details)
  })
})

describe('ConflictError', () => {
  it('stores message', () => {
    const err = new ConflictError('Email already exists')
    expect(err.code).toBe('CONFLICT')
    expect(err.statusCode).toBe(409)
    expect(err.message).toBe('Email already exists')
  })
})

describe('successResponse', () => {
  it('wraps data in success envelope', () => {
    const data = { id: '1', name: 'Test' }
    const result = successResponse(data)
    expect(result).toEqual({ success: true, data })
  })
})

describe('errorResponse', () => {
  it('creates error envelope', () => {
    const result = errorResponse('NOT_FOUND', 'missing')
    expect(result).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'missing' },
    })
  })

  it('includes details when provided', () => {
    const result = errorResponse('VALIDATION_ERROR', 'bad', { field: 'x' })
    expect(result).toEqual({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'bad', details: { field: 'x' } },
    })
  })
})

describe('fromError', () => {
  it('converts AppError to error response', () => {
    const err = new NotFoundError('Student', '1')
    const result = fromError(err)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND')
    }
  })

  it('converts unknown error to internal error response', () => {
    const result = fromError(new Error('boom'))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('INTERNAL_ERROR')
      expect(result.error.message).toBe('An unexpected error occurred')
    }
  })

  it('handles non-Error values', () => {
    const result = fromError('string error')
    expect(result.success).toBe(false)
  })
})
