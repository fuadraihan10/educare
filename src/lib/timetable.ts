import 'server-only'

import { prisma } from '@/lib/db'

export type TimetableEntryItem = {
  id: string
  dayOfWeek: string
  period: number
  startTime: string
  endTime: string
  room: string | null
  subject: { id: string; name: string; code: string }
  teacher: { id: string; name: string; employeeId: string }
  class: { id: string; name: string; section: string; code: string }
  term: { id: string; name: string }
}

export async function listTimetableByClass(input: { classId: string; termId?: string }): Promise<TimetableEntryItem[]> {
  const where: Record<string, unknown> = { classId: input.classId }
  if (input.termId) where.termId = input.termId
  else {
    const activeTerm = await prisma.term.findFirst({ where: { isActive: true }, select: { id: true } })
    if (activeTerm) where.termId = activeTerm.id
  }

  return prisma.timetableEntry.findMany({
    where,
    select: {
      id: true, dayOfWeek: true, period: true, startTime: true, endTime: true, room: true,
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true, employeeId: true } },
      class: { select: { id: true, name: true, section: true, code: true } },
      term: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
  })
}

export async function listTimetableByTeacher(teacherId: string): Promise<TimetableEntryItem[]> {
  const activeTerm = await prisma.term.findFirst({ where: { isActive: true }, select: { id: true } })
  return prisma.timetableEntry.findMany({
    where: { teacherId, termId: activeTerm?.id },
    select: {
      id: true, dayOfWeek: true, period: true, startTime: true, endTime: true, room: true,
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true, employeeId: true } },
      class: { select: { id: true, name: true, section: true, code: true } },
      term: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
  })
}
