import 'server-only'

import { prisma } from '@/lib/db'
import { formatDate, fullName } from '@/lib/format'
import type { Gender, User } from '@/generated/prisma/client'

export type StudentWithClass = {
  id: string
  admissionNo: string
  firstName: string
  middleName: string | null
  lastName: string
  dob: Date
  gender: Gender
  bloodGroup: string | null
  admissionDate: Date
  status: string
  rollNo: number | null
  class: { name: string; section: string } | null
}

const listSelect = {
  id: true,
  admissionNo: true,
  firstName: true,
  middleName: true,
  lastName: true,
  dob: true,
  gender: true,
  bloodGroup: true,
  admissionDate: true,
  status: true,
  rollNo: true,
  class: { select: { name: true, section: true } },
} as const

export { formatDate, fullName }

// Parses "ADM-2026-0042" and returns the integer sequence (0042 -> 42).
function seqOf(admissionNo: string): number {
  const i = Number(admissionNo.slice(admissionNo.lastIndexOf('-') + 1))
  return Number.isInteger(i) ? i : 0
}

// Generates the next admission number for a year, e.g. ADM-2026-0051.
// Callers must wrap their create in a P2002 retry loop: this only computes
// the candidate from what is currently in the table.
export async function nextAdmissionNo(year: number): Promise<string> {
  const prefix = `ADM-${year}-`
  const last = await prisma.student.findFirst({
    where: { admissionNo: { startsWith: prefix } },
    orderBy: { admissionNo: 'desc' },
    select: { admissionNo: true },
  })
  const seq = (last ? seqOf(last.admissionNo) : 0) + 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}

// The current academic year, or null if none is active.
export async function currentAcademicYear() {
  return prisma.academicYear.findFirst({ where: { isActive: true } })
}

// Whether the signed-in user may view a given student's data/files.
export async function canViewStudent(user: User, studentId: string): Promise<boolean> {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true
  if (user.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!teacher) return false
    const assignment = await prisma.teacherAssignment.findFirst({
      where: { teacherId: teacher.id, class: { students: { some: { id: studentId } } } },
      select: { id: true },
    })
    return assignment !== null
  }
  if (user.role === 'STUDENT') {
    const s = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } })
    return s?.id === studentId
  }
  if (user.role === 'PARENT') {
    const link = await prisma.studentGuardian.findUnique({
      where: { studentId_parentUserId: { studentId, parentUserId: user.id } },
      select: { id: true },
    })
    return link !== null
  }
  return false
}

export async function listStudents(input: {
  q?: string
  page?: number
  pageSize?: number
  status?: string
  gender?: string
  classId?: string
}): Promise<{ students: StudentWithClass[]; total: number }> {
  const q = input.q?.trim()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const conditions: Record<string, unknown>[] = []

  if (q) {
    conditions.push({
      OR: [
        { firstName: { contains: q, mode: 'insensitive' as const } },
        { lastName: { contains: q, mode: 'insensitive' as const } },
        { admissionNo: { contains: q, mode: 'insensitive' as const } },
      ],
    })
  }
  if (input.status) {
    conditions.push({ status: input.status })
  }
  if (input.gender) {
    conditions.push({ gender: input.gender })
  }
  if (input.classId) {
    conditions.push({ classId: input.classId })
  }

  const where = conditions.length > 0
    ? conditions.length === 1
      ? conditions[0]
      : { AND: conditions }
    : undefined

  const [students, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      select: listSelect,
      orderBy: [{ admissionNo: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ])

  return { students, total }
}

export async function getStudent(id: string) {
  return prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, regNo: true, status: true } },
      class: { select: { id: true, name: true, section: true } },
      files: {
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { name: true } } },
      },
      enrollments: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          class: { select: { name: true, section: true } },
          academicYear: { select: { name: true } },
        },
      },
    },
  })
}
