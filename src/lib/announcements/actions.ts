'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'
import { deliverNotificationToAll, deliverNotificationToRole } from '@/lib/notifications'

export type AnnouncementFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const announcementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  body: z.string().trim().min(1, 'Body is required.').max(5000),
  audience: z.enum(['ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  classId: z.string().optional(),
})

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export async function createAnnouncement(_prev: AnnouncementFormState, formData: FormData): Promise<AnnouncementFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  if (['STUDENT', 'PARENT'].includes(v.audience) && !v.classId) {
    return { status: 'error', message: 'Class is required when targeting students or parents.', errors: { classId: 'Required for this audience' } }
  }

  let classId: string | null = null
  if (v.classId && v.classId !== '__all__') {
    const cls = await prisma.class.findUnique({ where: { id: v.classId }, select: { id: true } })
    if (!cls) return { status: 'error', message: 'Class not found.', errors: { classId: 'Not found' } }
    classId = cls.id
  }

  const created = await prisma.announcement.create({
    data: {
      title: v.title,
      body: v.body,
      audience: v.audience,
      classId,
      createdById: actor.id,
    },
    select: { id: true },
  })

  await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'Announcement', entityId: created.id, details: { title: v.title, audience: v.audience } })

  const audienceRole = v.audience === 'ALL' ? undefined : v.audience as 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
  if (audienceRole) {
    await deliverNotificationToRole(audienceRole, {
      title: v.title,
      body: v.body.length > 120 ? v.body.slice(0, 120) + '...' : v.body,
      type: 'info',
      category: 'announcements',
      entity: 'Announcement',
      entityId: created.id,
      link: '/admin/announcements',
    }, classId ?? undefined)
  } else {
    await deliverNotificationToAll({
      title: v.title,
      body: v.body.length > 120 ? v.body.slice(0, 120) + '...' : v.body,
      type: 'info',
      category: 'announcements',
      entity: 'Announcement',
      entityId: created.id,
      link: '/admin/announcements',
    })
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/teacher/announcements')
  revalidatePath('/student/announcements')
  revalidatePath('/parent/announcements')
  redirect(actor.role === 'TEACHER' ? '/teacher/announcements' : '/admin/announcements')
}

export async function deleteAnnouncement(id: string) {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  try {
    await prisma.announcement.delete({ where: { id } })
  } catch {
    return
  }
  await auditLog({ actorId: actor.id, action: 'DELETE', entity: 'Announcement', entityId: id })
  revalidatePath('/admin/announcements')
  revalidatePath('/teacher/announcements')
  revalidatePath('/student/announcements')
  revalidatePath('/parent/announcements')
}
