'use server'

import { hash } from 'bcryptjs'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'
import { validatePasswordStrength, generateTempPassword } from '@/lib/password'

export type ResetPasswordState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  newPassword?: string
}

export async function resetUserPassword(userId: string, _prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, role: true, regNo: true } })
  if (!user) return { status: 'error', message: 'User not found.' }
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return { status: 'error', message: 'Cannot reset admin passwords from here.' }
  }

  const customPassword = formData.get('password') as string | null
  let newPassword: string

  if (customPassword && customPassword.trim().length > 0) {
    const validation = validatePasswordStrength(customPassword.trim())
    if (!validation.valid) return { status: 'error', message: validation.errors[0] }
    newPassword = customPassword.trim()
  } else {
    newPassword = generateTempPassword()
  }

  const passwordHash = await hash(newPassword, 12)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, forcePasswordChange: true },
  })

  await auditLog({ actorId: actor.id, action: 'RESET_PASSWORD', entity: 'User', entityId: userId, details: { name: user.name, regNo: user.regNo } })

  return { status: 'success', message: `Password reset for ${user.name} (${user.regNo}).`, newPassword }
}
