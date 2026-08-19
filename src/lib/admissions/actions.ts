'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Prisma } from '@/generated/prisma/client'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'
import { nextAdmissionNo } from '@/lib/students'
import { deliverNotification, deliverNotificationToRole } from '@/lib/notifications'

export type AdmissionFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const admissionSchema = z.object({
  applicantName: z.string().trim().min(1, 'Applicant name is required.'),
  dob: z.string().trim().min(1, 'Date of birth is required.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().trim().min(1, 'Phone is required.'),
  email: z.string().trim().email('Invalid email address.').max(255).optional(),
  address: z.string().trim().optional(),
  guardianName: z.string().trim().min(1, 'Guardian name is required.'),
  guardianRelation: z.string().trim().min(1, 'Guardian relation is required.'),
  guardianPhone: z.string().trim().min(1, 'Guardian phone is required.'),
  guardianEmail: z.string().trim().email('Invalid email address.').max(255).optional(),
  appliedClassId: z.string().min(1, 'Class is required.'),
  academicYearId: z.string().min(1, 'Academic year is required.'),
})

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

function toDate(v: string): Date {
  return new Date(`${v}T00:00:00.000Z`)
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
}

async function generateStudentRegNo(yearNumber: number, tx: Prisma.TransactionClient): Promise<string> {
  const prefix = `STU-${yearNumber}-`
  const last = await tx.user.findFirst({
    where: { regNo: { startsWith: prefix } },
    orderBy: { regNo: 'desc' },
    select: { regNo: true },
  })
  const seq = last ? (Number(last.regNo.slice(last.regNo.lastIndexOf('-') + 1)) || 0) + 1 : 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}

export async function submitApplication(_prev: AdmissionFormState, formData: FormData): Promise<AdmissionFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'PARENT')
  const parsed = admissionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  }
  const values = parsed.data

  try {
    const created = await prisma.admissionApplication.create({
      data: {
        applicantName: values.applicantName,
        dob: toDate(values.dob),
        gender: values.gender,
        phone: values.phone,
        email: values.email || null,
        address: values.address || null,
        guardianName: values.guardianName,
        guardianRelation: values.guardianRelation,
        guardianPhone: values.guardianPhone,
        guardianEmail: values.guardianEmail || null,
        appliedClassId: values.appliedClassId,
        academicYearId: values.academicYearId,
      },
      select: { id: true },
    })
    await auditLog({ actorId: actor.id, action: 'SUBMIT', entity: 'AdmissionApplication', entityId: created.id, details: { applicantName: values.applicantName } })
    revalidatePath('/admin/admissions')
    redirect(`/admin/admissions/${created.id}`)
  } catch (e) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

function assignClassRollNo(tx: Prisma.TransactionClient, classId: string) {
  return tx.student.aggregate({ where: { classId }, _max: { rollNo: true } }).then((agg) => (agg._max.rollNo ?? 0) + 1)
}

export type AdmissionApprovalState = { status: string; message?: string; tempPassword?: string }

export async function approveApplication(id: string, _prev: AdmissionApprovalState, _formData: FormData): Promise<AdmissionApprovalState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const app = await prisma.admissionApplication.findUnique({ where: { id }, select: { id: true, status: true, applicantName: true, dob: true, gender: true, phone: true, email: true, address: true, guardianName: true, guardianRelation: true, guardianPhone: true, guardianEmail: true, appliedClassId: true, academicYearId: true } })
  if (!app) return { status: 'error', message: 'Application not found.' }
  if (app.status !== 'PENDING') return { status: 'error', message: 'This application has already been reviewed.' }

  const yearName = (await prisma.academicYear.findUnique({ where: { id: app.academicYearId }, select: { name: true } }))?.name
  const yearNumber = yearName ? Number(yearName.split('-')[0]) : new Date().getUTCFullYear()

  const { hash } = await import('bcryptjs')
  const { generateTempPassword } = await import('@/lib/password')
  const tempPassword = generateTempPassword()
  const passwordHash = await hash(tempPassword, 12)
  let studentId: string | null = null

  for (let attempt = 0; attempt < 5; attempt++) {
    const admissionNo = await nextAdmissionNo(yearNumber)
    try {
      studentId = await prisma.$transaction(async (tx) => {
        const student = await tx.student.create({
          data: {
            admissionNo,
            firstName: app.applicantName.split(' ')[0],
            lastName: app.applicantName.split(' ').slice(1).join(' ') || app.applicantName.split(' ')[0],
            dob: app.dob,
            gender: app.gender as 'MALE' | 'FEMALE' | 'OTHER',
            phone: app.phone,
            email: app.email,
            address: app.address,
            guardianName: app.guardianName,
            guardianRelation: app.guardianRelation,
            guardianPhone: app.guardianPhone,
            guardianEmail: app.guardianEmail,
            status: 'ACTIVE',
          },
          select: { id: true },
        })

        const rollNo = await assignClassRollNo(tx, app.appliedClassId)
        await tx.student.update({ where: { id: student.id }, data: { classId: app.appliedClassId, rollNo } })

        await tx.enrollment.create({
          data: { studentId: student.id, classId: app.appliedClassId, academicYearId: app.academicYearId, status: 'ACTIVE' },
        })

        // Auto-create user account
        const regNo = await generateStudentRegNo(yearNumber, tx)
        const user = await tx.user.create({
          data: {
            regNo,
            email: app.email || `${regNo.toLowerCase()}@educare.edu.bd`,
            passwordHash,
            name: app.applicantName,
            role: 'STUDENT',
            forcePasswordChange: true,
          },
          select: { id: true },
        })
        await tx.student.update({ where: { id: student.id }, data: { userId: user.id } })

        await tx.admissionApplication.update({
          where: { id },
          data: { status: 'APPROVED', reviewedById: actor.id, reviewedAt: new Date(), studentId: student.id },
        })

        return student.id
      })
      break
    } catch (e) {
      if (isUniqueViolation(e)) continue
      if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
      return { status: 'error', message: 'Something went wrong. Please try again.' }
    }
  }
  if (!studentId) return { status: 'error', message: 'Could not allocate a unique admission number. Please retry.' }

  await auditLog({ actorId: actor.id, action: 'APPROVE', entity: 'AdmissionApplication', entityId: id, details: { applicantName: app.applicantName, studentId } })

  const user = await prisma.user.findFirst({ where: { student: { id: studentId } }, select: { id: true, regNo: true } })
  if (user) {
    await deliverNotification({
      userId: user.id,
      title: 'Admission Approved',
      body: `Congratulations! Your admission application for ${app.applicantName} has been approved. Your registration number is ${user.regNo}. Please log in and change your temporary password.`,
      type: 'success',
      category: 'admissions',
      entity: 'AdmissionApplication',
      entityId: id,
      link: '/profile/security',
    })
  }
  await deliverNotificationToRole('ADMIN', {
    title: 'Admission Approved',
    body: `Admission application for "${app.applicantName}" has been approved and a student account created.`,
    type: 'success',
    category: 'admissions',
    entity: 'AdmissionApplication',
    entityId: id,
    link: `/admin/admissions/${id}`,
  })

  revalidatePath('/admin/admissions')
  revalidatePath('/admin/admissions/' + id)
  return { status: 'success', message: `Student enrolled. Reg No: ${user?.regNo ?? '—'}`, tempPassword }
}

export async function rejectApplication(id: string, _prev: { status: string; message?: string }, formData: FormData): Promise<{ status: string; message?: string }> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const app = await prisma.admissionApplication.findUnique({ where: { id }, select: { id: true, status: true, applicantName: true } })
  if (!app) return { status: 'error', message: 'Application not found.' }
  if (app.status !== 'PENDING') return { status: 'error', message: 'This application has already been reviewed.' }

  const remarksParsed = z.string().max(5000).optional().safeParse(formData.get('remarks'))
  if (!remarksParsed.success) return { status: 'error', message: 'Remarks must be 5000 characters or fewer.' }
  const remarks = remarksParsed.data ?? null

  await prisma.admissionApplication.update({
    where: { id },
    data: { status: 'REJECTED', reviewedById: actor.id, reviewedAt: new Date(), remarks: remarks || null },
  })

  await auditLog({ actorId: actor.id, action: 'REJECT', entity: 'AdmissionApplication', entityId: id, details: { applicantName: app.applicantName, remarks } })
  await deliverNotificationToRole('ADMIN', {
    title: 'Admission Rejected',
    body: `Admission application for "${app.applicantName}" has been rejected.${remarks ? ` Reason: ${remarks}` : ''}`,
    type: 'warning',
    category: 'admissions',
    entity: 'AdmissionApplication',
    entityId: id,
    link: `/admin/admissions/${id}`,
  })
  revalidatePath('/admin/admissions')
  revalidatePath('/admin/admissions/' + id)
  redirect(`/admin/admissions/${id}`)
}
