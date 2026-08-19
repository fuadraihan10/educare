'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'

export type AttendanceFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

const markSchema = z.object({
  classId: z.string().min(1, 'Class is required.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.'),
  entries: z.string().min(1, 'No attendance entries provided.'),
})

function toDate(v: string): Date {
  return new Date(`${v}T00:00:00.000Z`)
}

export async function markAttendance(_prev: AttendanceFormState, formData: FormData): Promise<AttendanceFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  const parsed = markSchema.safeParse({
    classId: formData.get('classId'),
    date: formData.get('date'),
    entries: formData.get('entries'),
  })
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the form: ' + parsed.error.issues.map((i) => i.message).join(', ') }
  }

  if (actor.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!teacher) return { status: 'error', message: 'Teacher profile not found.' }
    const assignment = await prisma.teacherAssignment.findFirst({
      where: { teacherId: teacher.id, classId: parsed.data.classId, academicYear: { isActive: true } },
      select: { id: true },
    })
    if (!assignment) return { status: 'error', message: 'You are not assigned to this class.' }
  }

  let entries: { studentId: string; status: string; note?: string }[]
  try {
    entries = JSON.parse(parsed.data.entries)
  } catch {
    return { status: 'error', message: 'Invalid attendance data.' }
  }

  const date = toDate(parsed.data.date)
  const classId = parsed.data.classId

  const enrolled = await prisma.enrollment.findMany({ where: { classId, status: 'ACTIVE' }, select: { studentId: true } })
  const enrolledIds = new Set(enrolled.map((e) => e.studentId))
  for (const entry of entries) {
    if (!enrolledIds.has(entry.studentId)) {
      return { status: 'error', message: `Student ${entry.studentId} is not enrolled in this class.` }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await Promise.all(entries.map(async (entry) => {
        await tx.attendance.upsert({
          where: { studentId_classId_date: { studentId: entry.studentId, classId, date } },
          create: {
            studentId: entry.studentId,
            classId,
            date,
            status: entry.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE',
            note: entry.note || null,
            markedById: actor.id,
          },
          update: {
            status: entry.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE',
            note: entry.note || null,
            markedById: actor.id,
          },
        })
      }))
    })

    await auditLog({ actorId: actor.id, action: 'MARK', entity: 'Attendance', details: { classId, date: parsed.data.date, count: entries.length } })
    revalidatePath('/admin/attendance')
    revalidatePath('/teacher/attendance')
    return { status: 'success', message: `Attendance saved for ${entries.length} students.` }
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}
