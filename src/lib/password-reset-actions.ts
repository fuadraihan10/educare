'use server'

import { createHash, randomInt } from 'crypto'
import { hash, compare } from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { auth } from '@/lib/auth'
import { validatePasswordStrength } from '@/lib/password'

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function generate6DigitPin(): string {
  return String(randomInt(100000, 999999))
}

const PIN_EXPIRY_HOURS = 24

// ─── Request a password reset (forgot password — not logged in) ────────────

export async function requestPasswordResetByPin(formData: FormData) {
  const regNoSchema = z.string().trim().min(1).max(50).transform((v) => v.toUpperCase().trim())
  const parsed = regNoSchema.safeParse(formData.get('regNo'))
  if (!parsed.success) {
    return { success: true, message: 'If an account with that registration number exists, your request has been sent to the administrator.' }
  }
  const regNo = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { regNo } })
    if (!user || user.status !== 'ACTIVE') {
      return { success: true, message: 'If an account with that registration number exists, your request has been sent to the administrator.' }
    }

    const recentPending = await prisma.passwordResetRequest.count({
      where: { userId: user.id, type: 'FORGOT', status: 'PENDING' },
    })
    if (recentPending > 0) {
      return { success: true, message: 'You already have a pending request. Please wait for the administrator to process it.' }
    }

    await prisma.passwordResetRequest.create({
      data: { userId: user.id, type: 'FORGOT' },
    })

    logger.info({ userId: user.id }, 'Password reset request (forgot) created')
  } catch (err) {
    logger.error({ err }, 'Password reset request failed')
  }

  return { success: true, message: 'If an account with that registration number exists, your request has been sent to the administrator.' }
}

// ─── Request a password change (logged in user) ────────────────────────────

export async function requestPasswordChangeByPin() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'You must be signed in.' }
  }

  const recentPending = await prisma.passwordResetRequest.count({
    where: { userId: session.user.id, type: 'CHANGE', status: 'PENDING' },
  })
  if (recentPending > 0) {
    return { success: true, message: 'You already have a pending request. Please wait for the administrator to generate a PIN.' }
  }

  await prisma.passwordResetRequest.create({
    data: { userId: session.user.id, type: 'CHANGE' },
  })

  logger.info({ userId: session.user.id }, 'Password change request created')
  return { success: true, message: 'Your request has been sent to the administrator. They will generate a verification PIN for you.' }
}

// ─── Admin: list pending requests ──────────────────────────────────────────

export async function listPasswordResetRequests() {
  const session = await auth()
  if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return { requests: [] }
  }

  const requests = await prisma.passwordResetRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      user: { select: { id: true, name: true, regNo: true, role: true, email: true } },
      processedBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return { requests }
}

// ─── Admin: generate a 6-digit PIN for a request ──────────────────────────

export async function generateResetPin(requestId: string) {
  const session = await auth()
  if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return { success: false, message: 'Unauthorized.' }
  }

  const request = await prisma.passwordResetRequest.findUnique({ where: { id: requestId } })
  if (!request || request.status !== 'PENDING') {
    return { success: false, message: 'Request not found or already processed.' }
  }

  const pin = generate6DigitPin()
  const pinHash = sha256(pin)
  const expiresAt = new Date(Date.now() + PIN_EXPIRY_HOURS * 60 * 60 * 1000)

  await prisma.passwordResetRequest.update({
    where: { id: requestId },
    data: {
      pinHash,
      pinPlain: pin,
      expiresAt,
      status: 'APPROVED',
      processedAt: new Date(),
      processedById: session.user.id,
    },
  })

  logger.info({ requestId, userId: request.userId, processedBy: session.user.id }, 'Reset PIN generated')

  return { success: true, message: 'PIN generated successfully.', pin, expiresAt }
}

// ─── Admin: reject a request ───────────────────────────────────────────────

export async function rejectResetRequest(requestId: string) {
  const session = await auth()
  if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return { success: false, message: 'Unauthorized.' }
  }

  const request = await prisma.passwordResetRequest.findUnique({ where: { id: requestId } })
  if (!request || request.status !== 'PENDING') {
    return { success: false, message: 'Request not found or already processed.' }
  }

  await prisma.passwordResetRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      processedAt: new Date(),
      processedById: session.user.id,
    },
  })

  return { success: true, message: 'Request rejected.' }
}

// ─── User: verify PIN and reset password ───────────────────────────────────

export async function verifyPinAndResetPassword(pin: string, newPassword: string) {
  if (!pin || typeof pin !== 'string' || pin.length !== 6) {
    return { success: false, message: 'Please enter a valid 6-digit PIN.' }
  }

  const passwordSchema = z.string().min(8).max(128)
  const parsed = passwordSchema.safeParse(newPassword)
  if (!parsed.success) {
    return { success: false, message: 'Password must be at least 8 characters.' }
  }

  const strength = validatePasswordStrength(parsed.data)
  if (!strength.valid) {
    return { success: false, message: strength.errors[0] }
  }

  const pinHash = sha256(pin)

  const request = await prisma.passwordResetRequest.findFirst({
    where: { pinHash, status: 'APPROVED' },
  })

  if (!request) {
    return { success: false, message: 'Invalid PIN. Please check the PIN and try again.' }
  }

  if (!request.expiresAt || request.expiresAt < new Date()) {
    return { success: false, message: 'This PIN has expired. Please request a new one from the administrator.' }
  }

  const newHash = await hash(newPassword, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: request.userId },
      data: { passwordHash: newHash, forcePasswordChange: false },
    }),
    prisma.passwordResetRequest.update({
      where: { id: request.id },
      data: { pinHash: null, pinPlain: null },
    }),
  ])

  logger.info({ userId: request.userId, requestId: request.id }, 'Password reset via PIN')

  return { success: true, message: 'Password updated successfully. You can now sign in.' }
}

// ─── User: verify PIN and then change password ─────────────────────────────

export async function verifyPinAndChangePassword(pin: string, currentPassword: string, newPassword: string, confirmPassword: string) {
  if (!pin || typeof pin !== 'string' || pin.length !== 6) {
    return { success: false, message: 'Please enter a valid 6-digit PIN.' }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'You must be signed in.' }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' }
  }

  const strength = validatePasswordStrength(newPassword)
  if (!strength.valid) {
    return { success: false, message: strength.errors[0] }
  }

  const pinHash = sha256(pin)

  const request = await prisma.passwordResetRequest.findFirst({
    where: { pinHash, status: 'APPROVED', type: 'CHANGE', userId: session.user.id },
  })

  if (!request) {
    return { success: false, message: 'Invalid PIN. Please check the PIN and try again.' }
  }

  if (!request.expiresAt || request.expiresAt < new Date()) {
    return { success: false, message: 'This PIN has expired. Please request a new one.' }
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return { success: false, message: 'User not found.' }
  }

  const { compare } = await import('bcryptjs')
  const validCurrent = await compare(currentPassword, user.passwordHash)
  if (!validCurrent) {
    return { success: false, message: 'Current password is incorrect.' }
  }

  const newHash = await hash(newPassword, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, forcePasswordChange: false },
    }),
    prisma.passwordResetRequest.update({
      where: { id: request.id },
      data: { pinHash: null, pinPlain: null },
    }),
  ])

  logger.info({ userId: user.id, requestId: request.id }, 'Password changed via PIN verification')

  return { success: true, message: 'Password updated successfully. Please sign in again.' }
}
