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
  maxMarks: z.string().min(1, 'Max marks is required.').refine((v) => Number(v) > 0, 'Must be greater than 0'),
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

function computeGrade(marksObtained: number, maxMarks: number, scale: { label: string; minPercent: { toString(): string }; maxPercent: { toString(): string } }[]): string {
  const pct = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0
  for (const g of scale) {
    if (pct >= Number(g.minPercent) && pct <= Number(g.maxPercent)) return g.label
  }
  return 'F'
}

export async function createAssessment(_prev: AssessmentFormState, formData: FormData): Promise<AssessmentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  const teacherAssignment = await prisma.teacherAssignment.findFirst({
    where: { classId: v.classId, subjectId: v.subjectId, academicYear: { isActive: true } },
    select: { teacherId: true },
  })
  if (!teacherAssignment) return { status: 'error', message: 'No teacher is assigned to this class/subject combination.' }

  try {
    const created = await prisma.assessment.create({
      data: {
        name: v.name,
        classId: v.classId,
        subjectId: v.subjectId,
        termId: v.termId,
        teacherId: teacherAssignment.teacherId,
        type: v.type,
        maxMarks: Number(v.maxMarks),
        weight: v.weight ? Number(v.weight) : 1,
        date: v.date ? new Date(`${v.date}T00:00:00.000Z`) : null,
      },
      select: { id: true },
    })
    await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'Assessment', entityId: created.id, details: { name: v.name } })
    revalidatePath('/admin/exams')
    redirect(`/admin/exams/${created.id}`)
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function deleteAssessment(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const a = await prisma.assessment.findUnique({ where: { id }, select: { id: true, name: true, _count: { select: { marks: true } } } })
  if (!a) return
  if (a._count.marks > 0) return
  await prisma.assessment.delete({ where: { id } })
  await auditLog({ actorId: actor.id, action: 'DELETE', entity: 'Assessment', entityId: id, details: { name: a.name } })
  revalidatePath('/admin/exams')
}

export async function publishAssessment(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  await prisma.assessment.update({ where: { id }, data: { isPublished: true, publishedAt: new Date() } })
  await auditLog({ actorId: actor.id, action: 'PUBLISH', entity: 'Assessment', entityId: id })
  revalidatePath('/admin/exams')
  revalidatePath(`/admin/exams/${id}`)
  revalidatePath('/student/grades')
  revalidatePath('/parent/grades')
}

export async function unpublishAssessment(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  await prisma.assessment.update({ where: { id }, data: { isPublished: false, publishedAt: null } })
  await auditLog({ actorId: actor.id, action: 'UNPUBLISH', entity: 'Assessment', entityId: id })
  revalidatePath('/admin/exams')
  revalidatePath(`/admin/exams/${id}`)
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
        const marks = Math.min(Number(entry.marksObtained), Number(assessment.maxMarks))
        const grade = computeGrade(marks, Number(assessment.maxMarks), gradeScale)
        await tx.mark.upsert({
          where: { assessmentId_studentId: { assessmentId, studentId: entry.studentId } },
          create: { assessmentId, studentId: entry.studentId, marksObtained: marks, grade, createdById: actor.id },
          update: { marksObtained: marks, grade, updatedById: actor.id },
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
