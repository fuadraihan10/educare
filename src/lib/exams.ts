import 'server-only'

import { prisma } from '@/lib/db'

export type AssessmentListItem = {
  id: string
  name: string
  type: string
  maxMarks: unknown
  weight: unknown
  date: Date | null
  isPublished: boolean
  class: { id: string; name: string; section: string; code: string }
  subject: { id: string; name: string; code: string }
  term: { id: string; name: string }
  teacher: { name: string; employeeId: string }
  _count: { marks: number }
}

export async function listAssessments(input: {
  q?: string
  page?: number
  pageSize?: number
  classId?: string
  subjectId?: string
  termId?: string
}): Promise<{ assessments: AssessmentListItem[]; total: number }> {
  const q = input.q?.trim()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const where: Record<string, unknown> = {}
  if (input.classId) where.classId = input.classId
  if (input.subjectId) where.subjectId = input.subjectId
  if (input.termId) where.termId = input.termId
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { class: { name: { contains: q, mode: 'insensitive' } } },
      { subject: { name: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [assessments, total] = await prisma.$transaction([
    prisma.assessment.findMany({
      where,
      select: {
        id: true, name: true, type: true, maxMarks: true, weight: true, date: true, isPublished: true,
        class: { select: { id: true, name: true, section: true, code: true } },
        subject: { select: { id: true, name: true, code: true } },
        term: { select: { id: true, name: true } },
        teacher: { select: { name: true, employeeId: true } },
        _count: { select: { marks: true } },
      },
      orderBy: [{ date: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.assessment.count({ where }),
  ])

  return { assessments, total }
}

export async function getAssessment(id: string) {
  return prisma.assessment.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, section: true, code: true } },
      subject: { select: { id: true, name: true, code: true } },
      term: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, employeeId: true } },
      marks: {
        include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, rollNo: true } } },
        orderBy: { student: { rollNo: 'asc' } },
      },
    },
  })
}

export async function getGradeScale() {
  return prisma.gradeScale.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } })
}

export async function getStudentGrades(studentId: string) {
  return prisma.mark.findMany({
    where: { studentId, assessment: { isPublished: true } },
    include: {
      assessment: {
        select: { id: true, name: true, type: true, maxMarks: true, weight: true, date: true, subject: { select: { name: true, code: true } }, term: { select: { name: true } } },
      },
    },
    orderBy: { assessment: { date: 'desc' } },
  })
}

export async function listTerms() {
  return prisma.term.findMany({
    where: { academicYear: { isActive: true } },
    select: { id: true, name: true, isActive: true },
    orderBy: { startDate: 'asc' },
  })
}
