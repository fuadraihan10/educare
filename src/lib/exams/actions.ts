'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'
import { getGradeScale } from '@/lib/exams'

export type AssessmentFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const assessmentSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  classId: z.string().min(1, 'Class is required.'),
  subjectId: z.string().min(1, 'Subject is required.'),
  termId: z.string().min(1, 'Term is required.'),
  type: z.enum(['QUIZ', 'CLASSWORK', 'HOMEWORK', 'MIDTERM', 'FINAL', 'OTHER']),
  maxMarks: z.string().min(1, 'Max marks is required.').refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, 'Must be a whole number greater than 0'),
  weight: z.string().optional(),
  date: z.string().optional(),
})

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

function computeGrade(marksObtained: number, maxMarks: number, scale: { label: string; minPercent: { toString(): string }; maxPercent: { toString(): string }; points: { toString(): string } }[]): { label: string; points: number } {
  const pct = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0
  for (const g of scale) {
    if (pct >= Number(g.minPercent) && pct <= Number(g.maxPercent)) return { label: g.label, points: Number(g.points) }
  }
  return { label: 'F', points: 0 }
}

export async function createAssessment(_prev: AssessmentFormState, formData: FormData): Promise<AssessmentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  let teacherId: string | null = null
  if (actor.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!teacher) return { status: 'error', message: 'Teacher profile not found.' }
    const assignment = await prisma.teacherAssignment.findFirst({
      where: { classId: v.classId, subjectId: v.subjectId, teacherId: teacher.id, academicYear: { isActive: true } },
    })
    if (!assignment) return { status: 'error', message: 'You are not assigned to teach this class/subject combination.' }
    teacherId = teacher.id
  } else {
    const teacherAssignment = await prisma.teacherAssignment.findFirst({
      where: { classId: v.classId, subjectId: v.subjectId, academicYear: { isActive: true } },
      select: { teacherId: true },
    })
    if (!teacherAssignment) return { status: 'error', message: 'No teacher is assigned to this class/subject combination.' }
    teacherId = teacherAssignment.teacherId
  }

  try {
    const created = await prisma.assessment.create({
      data: {
        name: v.name,
        classId: v.classId,
        subjectId: v.subjectId,
        termId: v.termId,
        teacherId: teacherId!,
        type: v.type,
        maxMarks: Number(v.maxMarks),
        weight: v.weight ? Number(v.weight) : 1,
        date: v.date ? new Date(`${v.date}T00:00:00.000Z`) : null,
      },
      select: { id: true },
    })
    await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'Assessment', entityId: created.id, details: { name: v.name } })
    revalidatePath('/admin/exams')
    revalidatePath('/teacher/exams')
    redirect(actor.role === 'TEACHER' ? '/teacher/exams' : `/admin/exams/${created.id}`)
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function updateAssessment(id: string, _prev: AssessmentFormState, formData: FormData): Promise<AssessmentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  const existing = await prisma.assessment.findUnique({ where: { id }, select: { id: true, teacherId: true } })
  if (!existing) return { status: 'error', message: 'Assessment not found.' }

  if (actor.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!teacher || teacher.id !== existing.teacherId) return { status: 'error', message: 'You are not authorized to edit this assessment.' }
    const assignment = await prisma.teacherAssignment.findFirst({
      where: { classId: v.classId, subjectId: v.subjectId, teacherId: teacher.id, academicYear: { isActive: true } },
    })
    if (!assignment) return { status: 'error', message: 'You are not assigned to teach this class/subject combination.' }
  }

  try {
    await prisma.assessment.update({
      where: { id },
      data: {
        name: v.name,
        classId: v.classId,
        subjectId: v.subjectId,
        termId: v.termId,
        type: v.type,
        maxMarks: Number(v.maxMarks),
        weight: v.weight ? Number(v.weight) : 1,
        date: v.date ? new Date(`${v.date}T00:00:00.000Z`) : null,
      },
    })
    await auditLog({ actorId: actor.id, action: 'UPDATE', entity: 'Assessment', entityId: id, details: { name: v.name } })
    revalidatePath('/admin/exams')
    revalidatePath('/teacher/exams')
    revalidatePath(`/teacher/exams/${id}/edit`)
    revalidatePath(`/admin/exams/${id}`)
    redirect(actor.role === 'TEACHER' ? `/teacher/exams` : `/admin/exams/${id}`)
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function deleteAssessment(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  const a = await prisma.assessment.findUnique({ where: { id }, select: { id: true, name: true, teacherId: true, _count: { select: { marks: true } } } })
  if (!a) return
  if (actor.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!teacher || teacher.id !== a.teacherId) return
  }
  if (a._count.marks > 0) return
  await prisma.assessment.delete({ where: { id } })
  await auditLog({ actorId: actor.id, action: 'DELETE', entity: 'Assessment', entityId: id, details: { name: a.name } })
  revalidatePath('/admin/exams')
  revalidatePath('/teacher/exams')
}

export async function publishAssessment(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  const a = await prisma.assessment.findUnique({ where: { id }, select: { id: true, teacherId: true } })
  if (actor.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!teacher || !a || teacher.id !== a.teacherId) return
  }
  await prisma.assessment.update({ where: { id }, data: { isPublished: true, publishedAt: new Date() } })
  await auditLog({ actorId: actor.id, action: 'PUBLISH', entity: 'Assessment', entityId: id })
  revalidatePath('/admin/exams')
  revalidatePath('/teacher/exams')
  revalidatePath(`/admin/exams/${id}`)
  revalidatePath(`/teacher/exams/${id}`)
  revalidatePath('/student/grades')
  revalidatePath('/parent/grades')
}

export async function unpublishAssessment(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  const a = await prisma.assessment.findUnique({ where: { id }, select: { id: true, teacherId: true } })
  if (actor.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!teacher || !a || teacher.id !== a.teacherId) return
  }
  await prisma.assessment.update({ where: { id }, data: { isPublished: false, publishedAt: null } })
  await auditLog({ actorId: actor.id, action: 'UNPUBLISH', entity: 'Assessment', entityId: id })
  revalidatePath('/admin/exams')
  revalidatePath('/teacher/exams')
  revalidatePath(`/admin/exams/${id}`)
  revalidatePath(`/teacher/exams/${id}`)
  revalidatePath('/student/grades')
  revalidatePath('/parent/grades')
}

export type MarksFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export async function enterMarks(assessmentId: string, _prev: MarksFormState, formData: FormData): Promise<MarksFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  const entriesRaw = formData.get('entries') as string | null
  if (!entriesRaw) return { status: 'error', message: 'No marks data.' }

  let entries: { studentId: string; marksObtained: number }[]
  try { entries = JSON.parse(entriesRaw) } catch { return { status: 'error', message: 'Invalid marks data.' } }

  for (const e of entries) {
    if (!Number.isInteger(e.marksObtained) || e.marksObtained < 0) {
      return { status: 'error', message: 'Marks must be whole, non-negative numbers.' }
    }
  }

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, select: { id: true, classId: true, maxMarks: true, teacherId: true } })
  if (!assessment) return { status: 'error', message: 'Assessment not found.' }

  if (actor.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!teacher || teacher.id !== assessment.teacherId) {
      return { status: 'error', message: 'You are not authorized to enter marks for this assessment.' }
    }
  }

  const enrolled = await prisma.enrollment.findMany({ where: { classId: assessment.classId, status: 'ACTIVE' }, select: { studentId: true } })
  const enrolledIds = new Set(enrolled.map((e) => e.studentId))
  for (const entry of entries) {
    if (!enrolledIds.has(entry.studentId)) {
      return { status: 'error', message: `Student ${entry.studentId} is not enrolled in this class.` }
    }
  }

  const gradeScale = await getGradeScale()

  try {
    await prisma.$transaction(async (tx) => {
      await Promise.all(entries.map(async (entry) => {
        const marks = Math.min(Math.max(Math.round(entry.marksObtained), 0), Number(assessment.maxMarks))
        const { label, points } = computeGrade(marks, Number(assessment.maxMarks), gradeScale)
        await tx.mark.upsert({
          where: { assessmentId_studentId: { assessmentId, studentId: entry.studentId } },
          create: { assessmentId, studentId: entry.studentId, marksObtained: marks, grade: label, gradePoint: points, createdById: actor.id },
          update: { marksObtained: marks, grade: label, gradePoint: points, updatedById: actor.id },
        })
      }))
    })
    await auditLog({ actorId: actor.id, action: 'ENTER_MARKS', entity: 'Assessment', entityId: assessmentId, details: { count: entries.length } })
    revalidatePath(`/admin/exams/${assessmentId}`)
    revalidatePath(`/admin/exams/${assessmentId}/marks`)
    revalidatePath('/student/grades')
    revalidatePath('/parent/grades')
    return { status: 'success', message: `Marks saved for ${entries.length} students.` }
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}
