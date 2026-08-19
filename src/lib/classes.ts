import 'server-only'

import { prisma } from '@/lib/db'

export type ClassListItem = {
  id: string
  name: string
  section: string
  code: string
  room: string | null
  classTeacher: { name: string; employeeId: string } | null
  academicYear: { name: string }
  _count: { students: number }
}

// Derives a code from name + section, e.g. "Class 9" + "A" -> "C9-A".
export function deriveCode(name: string, section: string): string {
  const match = name.match(/(\d+)/)
  const num = match ? match[1] : name.slice(0, 3).toUpperCase()
  return `C${num}-${section}`
}

export async function listClasses(input: {
  q?: string
  page?: number
  pageSize?: number
  academicYearId?: string
}): Promise<{ classes: ClassListItem[]; total: number }> {
  const q = input.q?.trim()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const where: Record<string, unknown> = {}
  if (input.academicYearId) where.academicYearId = input.academicYearId
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { section: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
      { room: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [classes, total] = await prisma.$transaction([
    prisma.class.findMany({
      where,
      select: {
        id: true,
        name: true,
        section: true,
        code: true,
        room: true,
        classTeacher: { select: { name: true, employeeId: true } },
        academicYear: { select: { name: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.class.count({ where }),
  ])

  return { classes, total }
}

export type ClassDetail = {
  id: string
  name: string
  section: string
  code: string
  room: string | null
  classTeacherId: string | null
  academicYearId: string
  createdAt: Date
  updatedAt: Date
  classTeacher: { id: string; name: string; employeeId: string; designation: string | null } | null
  academicYear: { id: string; name: string; isActive: boolean }
  _count: { students: number; enrollments: number; assignments: number }
  enrollments: {
    id: string
    student: { id: string; firstName: string; lastName: string; admissionNo: string; rollNo: number | null }
  }[]
  assignments: {
    id: string
    teacher: { name: string; employeeId: string }
    subject: { name: string; code: string }
  }[]
}

export async function getClass(id: string): Promise<ClassDetail | null> {
  return prisma.class.findUnique({
    where: { id },
    include: {
      classTeacher: {
        select: { id: true, name: true, employeeId: true, designation: true },
      },
      academicYear: { select: { id: true, name: true, isActive: true } },
      _count: { select: { students: true, enrollments: true, assignments: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        take: 5,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, rollNo: true } },
        },
        orderBy: { student: { rollNo: 'asc' } },
      },
      assignments: {
        take: 10,
        include: {
          teacher: { select: { name: true, employeeId: true } },
          subject: { select: { name: true, code: true } },
        },
      },
    },
  }) as Promise<ClassDetail | null>
}

export async function listAcademicYears() {
  return prisma.academicYear.findMany({
    select: { id: true, name: true, isActive: true },
    orderBy: { startDate: 'desc' },
  })
}

export type ClassStudent = {
  id: string
  firstName: string
  lastName: string
  admissionNo: string
  rollNo: number | null
  userId: string | null
  user: { regNo: string; email: string } | null
}

export async function getStudentsByClass(classId: string, opts?: { page?: number; pageSize?: number }): Promise<{ students: ClassStudent[]; total: number; cls: { name: string; section: string; code: string } | null }> {
  const page = Math.max(1, opts?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, opts?.pageSize ?? 50))

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { name: true, section: true, code: true },
  })
  if (!cls) return { students: [], total: 0, cls: null }

  const where = { classId, enrollments: { some: { status: 'ACTIVE' as const } } }

  const [students, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, admissionNo: true, rollNo: true, userId: true,
        user: { select: { regNo: true, email: true } },
      },
      orderBy: { rollNo: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ])

  return { students: students as ClassStudent[], total, cls }
}
