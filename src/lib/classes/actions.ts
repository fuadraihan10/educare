'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@/generated/prisma/client'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'
import { deriveCode } from '@/lib/classes'

export type ClassFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const classBase = z.object({
  name: z.string().trim().min(1, 'Class name is required.'),
  section: z.string().trim().min(1, 'Section is required.'),
  code: z.string().trim().min(1, 'Code is required.'),
  room: z.string().trim().optional(),
  academicYearId: z.string().min(1, 'Academic year is required.'),
  classTeacherId: z.string().optional(),
})

const createSchema = classBase
const updateSchema = classBase

type ClassValues = z.infer<typeof classBase>

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

function classData(values: ClassValues) {
  return {
    name: values.name,
    section: values.section,
    code: values.code,
    room: values.room || null,
    academicYearId: values.academicYearId,
    classTeacherId: values.classTeacherId || null,
  }
}

export async function createClass(_prev: ClassFormState, formData: FormData): Promise<ClassFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = createSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  }
  const values = parsed.data

  try {
    const created = await prisma.class.create({
      data: classData(values),
      select: { id: true, code: true },
    })

    await auditLog({
      actorId: actor.id,
      action: 'CREATE',
      entity: 'Class',
      entityId: created.id,
      details: { code: created.code, name: values.name, section: values.section },
    })
    revalidatePath('/admin/classes')
    redirect(`/admin/classes/${created.id}`)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { status: 'error', message: 'A class with that name/section already exists in this year, or the code is taken.' }
    }
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: e instanceof Error ? e.message : 'Something went wrong.' }
  }
}

export async function updateClass(id: string, _prev: ClassFormState, formData: FormData): Promise<ClassFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const existing = await prisma.class.findUnique({ where: { id }, select: { id: true, code: true, name: true } })
  if (!existing) return { status: 'error', message: 'Class not found.' }

  const parsed = updateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  }
  const values = parsed.data

  try {
    await prisma.class.update({ where: { id }, data: classData(values) })

    await auditLog({
      actorId: actor.id,
      action: 'UPDATE',
      entity: 'Class',
      entityId: id,
      details: { code: existing.code, name: values.name, section: values.section },
    })
    revalidatePath('/admin/classes')
    revalidatePath(`/admin/classes/${id}`)
    redirect(`/admin/classes/${id}`)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { status: 'error', message: 'A class with that name/section already exists in this year, or the code is taken.' }
    }
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: e instanceof Error ? e.message : 'Something went wrong.' }
  }
}

export async function deleteClass(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const cls = await prisma.class.findUnique({
    where: { id },
    select: { id: true, code: true, name: true, _count: { select: { students: true, enrollments: true } } },
  })
  if (!cls) return

  if (cls._count.students > 0 || cls._count.enrollments > 0) {
    return
  }

  await prisma.class.delete({ where: { id } })
  await auditLog({
    actorId: actor.id,
    action: 'DELETE',
    entity: 'Class',
    entityId: id,
    details: { code: cls.code, name: cls.name },
  })
  revalidatePath('/admin/classes')
}
