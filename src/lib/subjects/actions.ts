'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@/generated/prisma/client'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'

export type SubjectFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  code: z.string().trim().min(1, 'Code is required.'),
  description: z.string().trim().optional(),
})

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export async function createSubject(_prev: SubjectFormState, formData: FormData): Promise<SubjectFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = subjectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  }
  const values = parsed.data

  try {
    const created = await prisma.subject.create({
      data: { name: values.name, code: values.code, description: values.description || null },
      select: { id: true },
    })
    await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'Subject', entityId: created.id, details: { name: values.name, code: values.code } })
    revalidatePath('/admin/subjects')
    redirect(`/admin/subjects/${created.id}`)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { status: 'error', message: 'A subject with that code already exists.' }
    }
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function updateSubject(id: string, _prev: SubjectFormState, formData: FormData): Promise<SubjectFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const existing = await prisma.subject.findUnique({ where: { id }, select: { id: true, name: true } })
  if (!existing) return { status: 'error', message: 'Subject not found.' }

  const parsed = subjectSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  }
  const values = parsed.data

  try {
    await prisma.subject.update({ where: { id }, data: { name: values.name, code: values.code, description: values.description || null } })
    await auditLog({ actorId: actor.id, action: 'UPDATE', entity: 'Subject', entityId: id, details: { name: values.name, code: values.code } })
    revalidatePath('/admin/subjects')
    revalidatePath(`/admin/subjects/${id}`)
    redirect(`/admin/subjects/${id}`)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { status: 'error', message: 'A subject with that code already exists.' }
    }
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function deleteSubject(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const subject = await prisma.subject.findUnique({ where: { id }, select: { id: true, name: true, _count: { select: { assignments: true } } } })
  if (!subject) return
  if (subject._count.assignments > 0) return
  await prisma.subject.delete({ where: { id } })
  await auditLog({ actorId: actor.id, action: 'DELETE', entity: 'Subject', entityId: id, details: { name: subject.name } })
  revalidatePath('/admin/subjects')
  redirect('/admin/subjects')
}

export type AssignmentFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const assignmentSchema = z.object({
  classId: z.string().min(1, 'Class is required.'),
  subjectId: z.string().min(1, 'Subject is required.'),
  teacherId: z.string().min(1, 'Teacher is required.'),
  academicYearId: z.string().min(1, 'Academic year is required.'),
})

export async function createAssignment(_prev: AssignmentFormState, formData: FormData): Promise<AssignmentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  }
  const values = parsed.data

  try {
    const created = await prisma.teacherAssignment.create({ data: values, select: { id: true } })
    await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'TeacherAssignment', entityId: created.id, details: values })
    revalidatePath('/admin/subjects')
    revalidatePath('/admin/subjects/assignments')
    redirect('/admin/subjects/assignments')
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { status: 'error', message: 'This teacher is already assigned to that subject for this class.' }
    }
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function deleteAssignment(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const assignment = await prisma.teacherAssignment.findUnique({ where: { id }, select: { id: true } })
  if (!assignment) return
  await prisma.teacherAssignment.delete({ where: { id } })
  await auditLog({ actorId: actor.id, action: 'DELETE', entity: 'TeacherAssignment', entityId: id, details: {} })
  revalidatePath('/admin/subjects')
  revalidatePath('/admin/subjects/assignments')
}
