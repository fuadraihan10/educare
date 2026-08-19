'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@/generated/prisma/client'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'

export type TimetableFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const timetableSchema = z.object({
  classId: z.string().min(1, 'Class is required.'),
  subjectId: z.string().min(1, 'Subject is required.'),
  teacherId: z.string().min(1, 'Teacher is required.'),
  termId: z.string().min(1, 'Term is required.'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  period: z.string().min(1, 'Period is required.').refine((v) => Number(v) > 0, 'Must be positive'),
  startTime: z.string().min(1, 'Start time is required.'),
  endTime: z.string().min(1, 'End time is required.'),
  room: z.string().trim().optional(),
})

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export async function createTimetableEntry(_prev: TimetableFormState, formData: FormData): Promise<TimetableFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = timetableSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  try {
    const conflict = await prisma.timetableEntry.findFirst({
      where: {
        termId: v.termId,
        dayOfWeek: v.dayOfWeek,
        period: Number(v.period),
        classId: v.classId,
      },
      select: { id: true },
    })

    if (conflict) {
      return { status: 'error', message: 'A timetable entry already exists for this class/day/period.' }
    }

    const teacherConflict = await prisma.timetableEntry.findFirst({
      where: {
        teacherId: v.teacherId,
        termId: v.termId,
        dayOfWeek: v.dayOfWeek,
        period: Number(v.period),
      },
      select: { id: true },
    })

    if (teacherConflict) {
      return { status: 'error', message: 'This teacher already has an entry for this period.' }
    }

    const timeConflict = await prisma.timetableEntry.findFirst({
      where: {
        termId: v.termId,
        dayOfWeek: v.dayOfWeek,
        startTime: { lt: v.endTime },
        endTime: { gt: v.startTime },
        OR: [
          { classId: v.classId },
          { teacherId: v.teacherId },
        ],
      },
      select: { id: true },
    })

    if (timeConflict) {
      return { status: 'error', message: 'There is a time overlap with another timetable entry.' }
    }

    const created = await prisma.timetableEntry.create({
      data: {
        classId: v.classId, subjectId: v.subjectId, teacherId: v.teacherId, termId: v.termId,
        dayOfWeek: v.dayOfWeek, period: Number(v.period), startTime: v.startTime, endTime: v.endTime,
        room: v.room || null,
      },
      select: { id: true },
    })
    await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'TimetableEntry', entityId: created.id, details: { classId: v.classId, dayOfWeek: v.dayOfWeek, period: Number(v.period) } })
    revalidatePath('/admin/timetable')
    redirect('/admin/timetable')
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { status: 'error', message: 'A timetable entry already exists for this class/day/period.' }
    }
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  await prisma.timetableEntry.delete({ where: { id } })
  await auditLog({ actorId: actor.id, action: 'DELETE', entity: 'TimetableEntry', entityId: id })
  revalidatePath('/admin/timetable')
}
