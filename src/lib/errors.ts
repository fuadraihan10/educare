export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', id ? `${resource} with id ${id} not found` : `${resource} not found`, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
  }
}

export type ApiResponse<T = unknown> = {
  success: true
  data: T
} | {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: Record<string, unknown>
  }
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function errorResponse(code: ErrorCode, message: string, details?: Record<string, unknown>): ApiResponse {
  return { success: false, error: { code, message, details } }
}

export function fromError(error: unknown): ApiResponse {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.details)
  }
  return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
}
