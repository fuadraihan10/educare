'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'

export type ProfileFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required.').max(100),
  displayName: z.string().trim().max(50).optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email address.').max(255),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  bio: z.string().trim().max(500).optional().or(z.literal('')),
  designation: z.string().trim().max(100).optional().or(z.literal('')),
  department: z.string().trim().max(100).optional().or(z.literal('')),
})

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  const parsed = profileSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  await prisma.user.update({
    where: { id: actor.id },
    data: {
      name: v.name,
      displayName: v.displayName || null,
      email: v.email.toLowerCase(),
      phone: v.phone || null,
      bio: v.bio || null,
      designation: v.designation || null,
      department: v.department || null,
    },
  })

  await auditLog({ actorId: actor.id, action: 'UPDATE_PROFILE', entity: 'User', entityId: actor.id, details: { fields: Object.keys(v) } })
  revalidatePath('/profile')
  revalidatePath('/profile/edit')
  return { status: 'success', message: 'Profile updated successfully.' }
}

export type NotificationFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export async function updateNotifications(_prev: NotificationFormState, formData: FormData): Promise<NotificationFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  const get = (key: string) => formData.get(key) === 'on'

  await prisma.userPreference.upsert({
    where: { userId: actor.id },
    create: {
      userId: actor.id,
      inAppNotifications: get('inAppNotifications'),
      pushNotifications: get('pushNotifications'),
      notifStudentUpdates: get('notifStudentUpdates'),
      notifAttendanceAlerts: get('notifAttendanceAlerts'),
      notifFeeAlerts: get('notifFeeAlerts'),
      notifExamResults: get('notifExamResults'),
      notifAdmissions: get('notifAdmissions'),
      notifStaffUpdates: get('notifStaffUpdates'),
      notifSystem: get('notifSystem'),
      notifSecurity: true,
      notifReports: get('notifReports'),
    },
    update: {
      inAppNotifications: get('inAppNotifications'),
      pushNotifications: get('pushNotifications'),
      notifStudentUpdates: get('notifStudentUpdates'),
      notifAttendanceAlerts: get('notifAttendanceAlerts'),
      notifFeeAlerts: get('notifFeeAlerts'),
      notifExamResults: get('notifExamResults'),
      notifAdmissions: get('notifAdmissions'),
      notifStaffUpdates: get('notifStaffUpdates'),
      notifSystem: get('notifSystem'),
      notifSecurity: true,
      notifReports: get('notifReports'),
    },
  })

  await auditLog({ actorId: actor.id, action: 'UPDATE_NOTIFICATIONS', entity: 'UserPreference', entityId: actor.id })
  revalidatePath('/profile/notifications')
  return { status: 'success', message: 'Notification preferences saved.' }
}

export type AppearanceFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export async function updateAppearance(_prev: AppearanceFormState, formData: FormData): Promise<AppearanceFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  const get = (key: string, fallback: string) => (formData.get(key) as string) || fallback

  await prisma.userPreference.upsert({
    where: { userId: actor.id },
    create: {
      userId: actor.id,
      theme: get('theme', 'system'),
      sidebarBehavior: get('sidebarBehavior', 'expanded'),
      density: get('density', 'comfortable'),
      dateFormat: get('dateFormat', 'YYYY-MM-DD'),
      timeFormat: get('timeFormat', '24h'),
    },
    update: {
      theme: get('theme', 'system'),
      sidebarBehavior: get('sidebarBehavior', 'expanded'),
      density: get('density', 'comfortable'),
      dateFormat: get('dateFormat', 'YYYY-MM-DD'),
      timeFormat: get('timeFormat', '24h'),
    },
  })

  await auditLog({ actorId: actor.id, action: 'UPDATE_APPEARANCE', entity: 'UserPreference', entityId: actor.id })
  revalidatePath('/profile/appearance')
  return { status: 'success', message: 'Appearance settings saved.' }
}

export async function revokeSession(sessionId: string) {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  await prisma.userSession.deleteMany({ where: { id: sessionId, userId: actor.id, isCurrent: false } })
  await auditLog({ actorId: actor.id, action: 'REVOKE_SESSION', entity: 'UserSession', entityId: sessionId })
  revalidatePath('/profile/sessions')
  return { success: true }
}

export async function revokeAllSessions() {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  await prisma.userSession.deleteMany({ where: { userId: actor.id, isCurrent: false } })
  await auditLog({ actorId: actor.id, action: 'REVOKE_ALL_SESSIONS', entity: 'UserSession' })
  revalidatePath('/profile/sessions')
  return { success: true }
}

export async function logUserActivity(params: { userId: string; action: string; category?: string; details?: Record<string, unknown>; ipAddress?: string; device?: string; result?: string }) {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  // Non-admins can only log activity for themselves
  const userId = (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN') ? params.userId : actor.id

  await prisma.userActivityLog.create({
    data: {
      userId,
      action: params.action,
      category: params.category ?? 'general',
      details: params.details ? (params.details as unknown as Prisma.InputJsonValue) : undefined,
      ipAddress: params.ipAddress ?? null,
      device: params.device ?? null,
      result: params.result ?? 'success',
    },
  }).catch(() => {})
}

export async function getProfileData() {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')

  const [preferences, sessions, activities, student, teacher] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId: user.id } }),
    prisma.userSession.findMany({ where: { userId: user.id }, orderBy: { lastActiveAt: 'desc' }, take: 20 }),
    prisma.userActivityLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    user.role === 'STUDENT' ? prisma.student.findUnique({ where: { userId: user.id }, select: { firstName: true, lastName: true, admissionNo: true, rollNo: true, dob: true, gender: true, phone: true, address: true, class: { select: { name: true, section: true } } } }) : null,
    user.role === 'TEACHER' ? prisma.teacher.findUnique({ where: { userId: user.id }, select: { employeeId: true, name: true, designation: true, phone: true, specialization: true, qualification: true, joinDate: true, gender: true } }) : null,
  ])

  return { user, preferences, sessions, activities, student, teacher }
}

export async function revokeCurrentSession(sessionId: string) {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  try {
    await prisma.userSession.deleteMany({ where: { userId: actor.id, tokenHash: sessionId } })
  } catch {
    // ignore — best effort
  }
}

export async function logLogout() {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  auditLog({ actorId: actor.id, action: 'LOGOUT', entity: 'User', entityId: actor.id })
}
