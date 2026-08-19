'use server'

import { z } from 'zod'
import { hash } from 'bcryptjs'

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { auth } from '@/lib/auth'
import { validatePasswordStrength } from '@/lib/password'

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: 'You must be signed in.' }
  }

  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(1),
  })

  const parsed = schema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { success: false, message: 'New password must be at least 8 characters.' }
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data

  if (newPassword !== confirmPassword) {
    return { success: false, message: 'Passwords do not match.' }
  }

  const strength = validatePasswordStrength(newPassword)
  if (!strength.valid) {
    return { success: false, message: strength.errors[0] }
  }

  const { compare } = await import('bcryptjs')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return { success: false, message: 'User not found.' }
  }

  const valid = await compare(currentPassword, user.passwordHash)
  if (!valid) {
    return { success: false, message: 'Current password is incorrect.' }
  }

  const newHash = await hash(newPassword, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  logger.info({ userId: user.id }, 'Password changed successfully')

  return { success: true, message: 'Password updated successfully.' }
}
