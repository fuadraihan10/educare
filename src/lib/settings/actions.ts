'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'

export type SchoolFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const schoolSchema = z.object({
  name: z.string().trim().min(1, 'School name is required.'),
  shortName: z.string().trim().min(1, 'Short name is required.').max(20),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email.').optional().or(z.literal('')),
  timezone: z.string().trim().min(1, 'Timezone is required.'),
})

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export async function updateSchool(_prev: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = schoolSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  const school = await prisma.school.findFirst({ select: { id: true } })
  if (!school) return { status: 'error', message: 'No school profile found.' }

  await prisma.school.update({
    where: { id: school.id },
    data: {
      name: v.name,
      shortName: v.shortName,
      address: v.address || null,
      city: v.city || null,
      phone: v.phone || null,
      email: v.email || null,
      timezone: v.timezone,
    },
  })
  await auditLog({ actorId: actor.id, action: 'UPDATE_SCHOOL', entity: 'School', entityId: school.id })
  revalidatePath('/admin/settings')
  return { status: 'success', message: 'School profile updated.' }
}

export type AcademicYearFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const academicYearSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.'),
})

export async function createAcademicYear(_prev: AcademicYearFormState, formData: FormData): Promise<AcademicYearFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = academicYearSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  if (v.startDate >= v.endDate) return { status: 'error', message: 'Start date must be before end date.' }

  const school = await prisma.school.findFirst({ select: { id: true } })
  if (!school) return { status: 'error', message: 'No school profile found.' }

  await prisma.academicYear.create({
    data: {
      name: v.name,
      schoolId: school.id,
      startDate: new Date(`${v.startDate}T00:00:00.000Z`),
      endDate: new Date(`${v.endDate}T00:00:00.000Z`),
      isActive: false,
    },
  })
  await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'AcademicYear', details: { name: v.name } })
  revalidatePath('/admin/settings')
  return { status: 'success', message: 'Academic year created.' }
}

export async function activateAcademicYear(yearId: string) {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const school = await prisma.school.findFirst({ select: { id: true } })
  if (!school) return

  await prisma.$transaction(async (tx) => {
    await tx.academicYear.updateMany({ where: { schoolId: school.id, isActive: true }, data: { isActive: false } })
    await tx.academicYear.update({ where: { id: yearId }, data: { isActive: true } })
    await tx.school.update({ where: { id: school.id }, data: { currentAcademicYearId: yearId } })
  })
  await auditLog({ actorId: actor.id, action: 'ACTIVATE_YEAR', entity: 'AcademicYear', entityId: yearId })
  revalidatePath('/admin/settings')
}

export type TermFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const termSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year is required.'),
  name: z.string().trim().min(1, 'Term name is required.'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.'),
})

export async function createTerm(_prev: TermFormState, formData: FormData): Promise<TermFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = termSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  if (v.startDate >= v.endDate) return { status: 'error', message: 'Start date must be before end date.' }

  await prisma.term.create({
    data: {
      academicYearId: v.academicYearId,
      name: v.name,
      startDate: new Date(`${v.startDate}T00:00:00.000Z`),
      endDate: new Date(`${v.endDate}T00:00:00.000Z`),
    },
  })
  await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'Term', details: { name: v.name } })
  revalidatePath('/admin/settings')
  return { status: 'success', message: 'Term created.' }
}

export type GradeScaleFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const gradeScaleSchema = z.object({
  label: z.string().trim().min(1, 'Label is required.').max(10),
  minPercent: z.string().refine((v) => !isNaN(Number(v)), 'Must be a number.'),
  maxPercent: z.string().refine((v) => !isNaN(Number(v)), 'Must be a number.'),
  points: z.string().refine((v) => !isNaN(Number(v)), 'Must be a number.'),
  order: z.string().refine((v) => !isNaN(Number(v)) && Number.isInteger(Number(v)), 'Must be an integer.'),
})

export async function createGradeScale(_prev: GradeScaleFormState, formData: FormData): Promise<GradeScaleFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = gradeScaleSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data
  if (Number(v.minPercent) > Number(v.maxPercent)) {
    return { status: 'error', message: 'Minimum percentage cannot exceed maximum.' }
  }

  await prisma.gradeScale.create({
    data: {
      label: v.label,
      minPercent: Number(v.minPercent),
      maxPercent: Number(v.maxPercent),
      points: Number(v.points),
      order: Number(v.order),
    },
  })
  await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'GradeScale', details: { label: v.label } })
  revalidatePath('/admin/settings')
  return { status: 'success', message: 'Grade scale entry created.' }
}

export async function deleteGradeScale(id: string) {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  await prisma.gradeScale.delete({ where: { id } })
  await auditLog({ actorId: actor.id, action: 'DELETE', entity: 'GradeScale', entityId: id })
  revalidatePath('/admin/settings')
}
