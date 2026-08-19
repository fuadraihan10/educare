'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { Prisma } from '@/generated/prisma/client'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'
import { nextEmployeeId } from '@/lib/staff'
import { validatePasswordStrength } from '@/lib/password'
import { deliverNotificationToRole } from '@/lib/notifications'

export type StaffFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const optionalString = z.string().trim().optional()
const dateString = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: 'Enter a valid date.' })

const staffBase = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => /^\S+@\S+\.\S+$/.test(v), { message: 'Enter a valid email address.' }),
  phone: optionalString,
  gender: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  ),
  dob: dateString,
  qualification: optionalString,
  designation: optionalString,
  specialization: optionalString,
  joinDate: dateString,
})

const createSchema = staffBase.extend({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

const updateSchema = staffBase.extend({
  password: z.string().optional(),
})

type StaffValues = z.infer<typeof staffBase>

function toDate(v: string | undefined): Date | null {
  return v ? new Date(`${v}T00:00:00.000Z`) : null
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

function message(_e: unknown): string {
  return 'Something went wrong.'
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
}

// True when a P2002 error targets a specific column (Postgres exposes the
// constraint/field name via meta.target).
function isUniqueOn(e: unknown, field: string): boolean {
  if (!isUniqueViolation(e)) return false
  const target = (e as Prisma.PrismaClientKnownRequestError).meta?.target
  if (typeof target === 'string') return target.includes(field)
  if (Array.isArray(target)) return target.some((t) => String(t).includes(field))
  return false
}

function teacherData(values: StaffValues) {
  return {
    name: values.name,
    email: values.email,
    phone: values.phone || null,
    gender: values.gender,
    dob: toDate(values.dob),
    qualification: values.qualification || null,
    designation: values.designation || null,
    specialization: values.specialization || null,
    joinDate: toDate(values.joinDate) ?? new Date(),
  }
}

export async function createStaff(_prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = createSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  }
  const { password, ...values } = parsed.data
  const strength = validatePasswordStrength(password)
  if (!strength.valid) {
    return { status: 'error', message: strength.errors[0] }
  }
  const passwordHash = await hash(password, 12)

  try {
    let created: { id: string; employeeId: string } | null = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const employeeId = await nextEmployeeId()
      try {
        created = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: values.email,
              regNo: employeeId,
              passwordHash,
              name: values.name,
              role: 'TEACHER',
              schoolId: actor.schoolId,
            },
          })
          const teacher = await tx.teacher.create({
            data: { ...teacherData(values), employeeId, userId: user.id },
          })
          return { id: teacher.id, employeeId }
        })
        break
      } catch (e) {
        if (isUniqueOn(e, 'employeeId')) continue
        if (isUniqueOn(e, 'regNo')) {
          continue
        }
        if (isUniqueOn(e, 'email')) {
          return { status: 'error', message: 'That email is already used by another account.' }
        }
        throw e
      }
    }
    if (!created) throw new Error('Could not allocate a unique employee ID. Please retry.')

    await auditLog({
      actorId: actor.id,
      action: 'CREATE',
      entity: 'Teacher',
      entityId: created.id,
      details: { employeeId: created.employeeId, name: values.name },
    })
    await deliverNotificationToRole('ADMIN', {
      title: 'New Staff Added',
      body: `"${values.name}" has been added as staff with employee ID ${created.employeeId}.`,
      type: 'success',
      category: 'staff',
      entity: 'Teacher',
      entityId: created.id,
      link: `/admin/staff/${created.id}`,
    })
    revalidatePath('/admin/staff')
    redirect(`/admin/staff/${created.id}`)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return { status: 'error', message: message(e) }
    }
    throw e
  }
}

export async function updateStaff(id: string, _prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const existing = await prisma.teacher.findUnique({ where: { id }, include: { user: true } })
  if (!existing) return { status: 'error', message: 'Teacher not found.' }

  const parsed = updateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  }
  const { password, ...values } = parsed.data

  if (password) {
    const strength = validatePasswordStrength(password)
    if (!strength.valid) {
      return { status: 'error', message: strength.errors[0] }
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.teacher.update({ where: { id }, data: teacherData(values) })
      if (existing.user) {
        await tx.user.update({
          where: { id: existing.user.id },
          data: {
            email: values.email,
            name: values.name,
            ...(password ? { passwordHash: await hash(password, 12) } : {}),
          },
        })
      }
    })

    await auditLog({
      actorId: actor.id,
      action: 'UPDATE',
      entity: 'Teacher',
      entityId: id,
      details: { employeeId: existing.employeeId, name: values.name, changedFields: ['profile'] },
    })
    revalidatePath('/admin/staff')
    revalidatePath(`/admin/staff/${id}`)
    redirect(`/admin/staff/${id}`)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') return { status: 'error', message: 'That email is already used by another account.' }
      return { status: 'error', message: message(e) }
    }
    throw e
  }
}

async function setStaffStatus(id: string, status: 'ACTIVE' | 'INACTIVE', action: string) {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    select: { id: true, employeeId: true, name: true, userId: true },
  })
  if (!teacher) return

  await prisma.$transaction(async (tx) => {
    await tx.teacher.update({ where: { id }, data: { status } })
    if (teacher.userId) {
      await tx.user.update({ where: { id: teacher.userId }, data: { status } })
    }
  })
  await auditLog({
    actorId: actor.id,
    action,
    entity: 'Teacher',
    entityId: id,
    details: { employeeId: teacher.employeeId, name: teacher.name, status },
  })
  revalidatePath('/admin/staff')
  revalidatePath(`/admin/staff/${id}`)
}

export async function deactivateStaff(id: string): Promise<void> {
  await setStaffStatus(id, 'INACTIVE', 'DEACTIVATE')
}

export async function reactivateStaff(id: string): Promise<void> {
  await setStaffStatus(id, 'ACTIVE', 'REACTIVATE')
}
