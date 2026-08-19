import 'server-only'

import { prisma } from '@/lib/db'

export type SubjectListItem = {
  id: string
  name: string
  code: string
  description: string | null
  _count: { assignments: number; assessments: number }
}

export async function listSubjects(input: {
  q?: string
  page?: number
  pageSize?: number
}): Promise<{ subjects: SubjectListItem[]; total: number }> {
  const q = input.q?.trim()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { code: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  const [subjects, total] = await prisma.$transaction([
    prisma.subject.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        _count: { select: { assignments: true, assessments: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.subject.count({ where }),
  ])

  return { subjects, total }
}

export async function getSubject(id: string) {
  return prisma.subject.findUnique({
    where: { id },
    include: {
      assignments: {
        orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' } }],
        include: {
          class: { select: { id: true, name: true, section: true, code: true } },
          teacher: { select: { id: true, name: true, employeeId: true } },
          academicYear: { select: { id: true, name: true } },
        },
      },
    },
  })
}

export type AssignmentListItem = {
  id: string
  class: { id: string; name: string; section: string; code: string }
  subject: { id: string; name: string; code: string }
  teacher: { id: string; name: string; employeeId: string }
  academicYear: { id: string; name: string }
}

export async function listAssignments(input: {
  q?: string
  page?: number
  pageSize?: number
  academicYearId?: string
}): Promise<{ assignments: AssignmentListItem[]; total: number }> {
  const q = input.q?.trim()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const where: Record<string, unknown> = {}
  if (input.academicYearId) where.academicYearId = input.academicYearId
  if (q) {
    where.OR = [
      { class: { name: { contains: q, mode: 'insensitive' } } },
      { class: { section: { contains: q, mode: 'insensitive' } } },
      { subject: { name: { contains: q, mode: 'insensitive' } } },
      { subject: { code: { contains: q, mode: 'insensitive' } } },
      { teacher: { name: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [assignments, total] = await prisma.$transaction([
    prisma.teacherAssignment.findMany({
      where,
      select: {
        id: true,
        class: { select: { id: true, name: true, section: true, code: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, name: true, employeeId: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { subject: { name: 'asc' } }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.teacherAssignment.count({ where }),
  ])

  return { assignments, total }
}
