'use server'

import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { Prisma } from '@/generated/prisma/client'
import type { FileCategory } from '@/generated/prisma/client'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'
import { saveFile, deleteFile, StorageError, MAX_FILE_SIZE, MAX_IMAGE_SIZE } from '@/lib/storage'
import { currentAcademicYear, nextAdmissionNo, formatDate } from '@/lib/students'
import { generateTempPassword } from '@/lib/password'

export type StudentFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
  regNo?: string
  studentId?: string
}

const optionalString = z.string().trim().optional()
const optionalEmail = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || /^\S+@\S+\.\S+$/.test(v), { message: 'Enter a valid email address.' })

const studentSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  middleName: optionalString,
  lastName: z.string().trim().min(1, 'Last name is required.'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: optionalString,
  religion: optionalString,
  nationality: optionalString,
  address: optionalString,
  city: optionalString,
  phone: optionalString,
  email: optionalEmail,
  guardianName: z.string().trim().min(1, 'Guardian name is required.'),
  guardianRelation: z.string().trim().min(1, 'Guardian relation is required.'),
  guardianPhone: z.string().trim().min(1, 'Guardian phone is required.'),
  guardianEmail: optionalEmail,
  classId: optionalString,
  rollNo: z.coerce.number().int().min(0).optional().nullable(),
})

type StudentValues = z.infer<typeof studentSchema>

function toDate(v: string): Date {
  return new Date(`${v}T00:00:00.000Z`)
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
}

function message(_e: unknown): string {
  return 'Something went wrong.'
}

async function assignClass(tx: Prisma.TransactionClient, classId: string | undefined, studentId: string, rollNoOverride?: number | null) {
  if (!classId) return {}
  const cls = await tx.class.findUnique({ where: { id: classId }, select: { academicYearId: true } })
  if (!cls) throw new Error('Selected class does not exist.')
  const rollNo = rollNoOverride != null
    ? rollNoOverride
    : ((await tx.student.aggregate({ where: { classId }, _max: { rollNo: true } }))._max.rollNo ?? 0) + 1
  await tx.enrollment.create({
    data: { studentId, classId, academicYearId: cls.academicYearId, status: 'ACTIVE' },
  })
  return { classId, rollNo }
}

async function readPhoto(formData: FormData) {
  const photo = formData.get('photo')
  if (!(photo instanceof File) || photo.size === 0) return null
  if (photo.size > MAX_IMAGE_SIZE) throw new StorageError('Photo exceeds maximum size of 5MB.')
  const saved = await saveFile({
    data: Buffer.from(await photo.arrayBuffer()),
    mimeType: photo.type,
    originalName: photo.name,
    category: 'PHOTO' as FileCategory,
  })
  return saved
}

async function createStudentWithAdmission(yearNumber: number, values: StudentValues, actorId: string, photo: Awaited<ReturnType<typeof readPhoto>>) {
  const base = {
    firstName: values.firstName,
    middleName: values.middleName || null,
    lastName: values.lastName,
    dob: toDate(values.dob),
    gender: values.gender,
    bloodGroup: values.bloodGroup || null,
    religion: values.religion || null,
    nationality: values.nationality || null,
    address: values.address || null,
    city: values.city || null,
    phone: values.phone || null,
    email: values.email || null,
    guardianName: values.guardianName,
    guardianRelation: values.guardianRelation,
    guardianPhone: values.guardianPhone,
    guardianEmail: values.guardianEmail || null,
    photoUrl: photo?.storageKey ?? null,
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await hash(tempPassword, 12)

  for (let attempt = 0; attempt < 5; attempt++) {
    const admissionNo = await nextAdmissionNo(yearNumber)
    try {
      return await prisma.$transaction(async (tx) => {
        const student = await tx.student.create({ data: { ...base, admissionNo } })
        if (photo) {
          await tx.studentFile.create({
            data: {
              studentId: student.id,
              category: 'PHOTO',
              filename: photo.filename,
              originalName: 'student-photo',
              mimeType: photo.mimeType,
              size: photo.size,
              storageKey: photo.storageKey,
              uploadedById: actorId,
            },
          })
        }
        const placement = await assignClass(tx, values.classId, student.id, values.rollNo)
        if (placement.classId) {
          await tx.student.update({
            where: { id: student.id },
            data: { classId: placement.classId, rollNo: placement.rollNo },
          })
        }

        // Auto-create user account
        const prefix = `STU-${yearNumber}-`
        const last = await tx.user.findFirst({
          where: { regNo: { startsWith: prefix } },
          orderBy: { regNo: 'desc' },
          select: { regNo: true },
        })
        const seq = last ? (Number(last.regNo.slice(last.regNo.lastIndexOf('-') + 1)) || 0) + 1 : 1
        const regNo = `${prefix}${String(seq).padStart(4, '0')}`

        const user = await tx.user.create({
          data: {
            regNo,
            email: values.email || `${regNo.toLowerCase()}@educare.edu.bd`,
            passwordHash,
            name: `${values.firstName} ${values.lastName}`,
            role: 'STUDENT',
            forcePasswordChange: true,
          },
          select: { id: true },
        })
        await tx.student.update({ where: { id: student.id }, data: { userId: user.id } })

        return { id: student.id, admissionNo, regNo }
      })
    } catch (e) {
      if (isUniqueViolation(e)) continue
      throw e
    }
  }
  throw new Error('Could not allocate a unique admission number. Please retry.')
}

export async function createStudent(_prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = studentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }

  const year = await currentAcademicYear()
  const yearNumber = year ? Number(year.name.split('-')[0]) : new Date().getUTCFullYear()

  let photo: Awaited<ReturnType<typeof readPhoto>> = null
  try {
    photo = await readPhoto(formData)
    const { id, admissionNo, regNo } = await createStudentWithAdmission(yearNumber, parsed.data, actor.id, photo)
    await auditLog({
      actorId: actor.id,
      action: 'CREATE',
      entity: 'Student',
      entityId: id,
      details: { admissionNo, regNo, firstName: parsed.data.firstName, lastName: parsed.data.lastName },
    })
    revalidatePath('/admin/students')
    revalidatePath('/admin/students/' + id)
    return { status: 'success', message: `Student created. Reg No: ${regNo}`, regNo, studentId: id }
  } catch (e) {
    if (photo) await deleteFile(photo.storageKey).catch(() => {})
    if (e instanceof StorageError) {
      return { status: 'error', message: e.message }
    }
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function updateStudent(id: string, _prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const existing = await prisma.student.findUnique({ where: { id } })
  if (!existing) return { status: 'error', message: 'Student not found.' }

  const parsed = studentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }

  const values = parsed.data
  let photo: Awaited<ReturnType<typeof readPhoto>> = null
  let oldPhotoStorageKey: string | null = null

  try {
    photo = await readPhoto(formData)
    if (photo && existing.photoUrl) oldPhotoStorageKey = existing.photoUrl

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: {
          firstName: values.firstName,
          middleName: values.middleName || null,
          lastName: values.lastName,
          dob: toDate(values.dob),
          gender: values.gender,
          bloodGroup: values.bloodGroup || null,
          religion: values.religion || null,
          nationality: values.nationality || null,
          address: values.address || null,
          city: values.city || null,
          phone: values.phone || null,
          email: values.email || null,
          guardianName: values.guardianName,
          guardianRelation: values.guardianRelation,
          guardianPhone: values.guardianPhone,
          guardianEmail: values.guardianEmail || null,
          photoUrl: photo?.storageKey ?? existing.photoUrl,
        },
      })
      if (photo) {
        await tx.studentFile.create({
          data: {
            studentId: id,
            category: 'PHOTO',
            filename: photo.filename,
            originalName: 'student-photo',
            mimeType: photo.mimeType,
            size: photo.size,
            storageKey: photo.storageKey,
            uploadedById: actor.id,
          },
        })
      }
      const changed = values.classId !== (existing.classId ?? '')
      const rollNoChanged = values.rollNo != null && values.rollNo !== existing.rollNo
      if (changed || rollNoChanged) {
        const cls = values.classId
          ? await tx.class.findUnique({ where: { id: values.classId }, select: { id: true, academicYearId: true } })
          : null
        if (!cls && values.classId) throw new Error('Selected class does not exist.')
        const rollNo = values.rollNo != null
          ? values.rollNo
          : cls
            ? ((await tx.student.aggregate({ where: { classId: cls.id }, _max: { rollNo: true } }))._max.rollNo ?? 0) + 1
            : null

        // Deactivate old enrollment for the active academic year
        if (changed) {
          const activeYear = await tx.academicYear.findFirst({ where: { isActive: true }, select: { id: true } })
          if (activeYear) {
            await tx.enrollment.updateMany({
              where: { studentId: id, academicYearId: activeYear.id, status: 'ACTIVE' },
              data: { status: 'COMPLETED' },
            })
          }
        }

        await tx.student.update({ where: { id }, data: { classId: values.classId || null, rollNo } })
        if (cls && changed) {
          await tx.enrollment.upsert({
            where: { studentId_academicYearId_classId: { studentId: id, academicYearId: cls.academicYearId, classId: cls.id } },
            create: { studentId: id, classId: cls.id, academicYearId: cls.academicYearId, status: 'ACTIVE' },
            update: { status: 'ACTIVE' },
          })
        }
      }
    })

    await auditLog({
      actorId: actor.id,
      action: 'UPDATE',
      entity: 'Student',
      entityId: id,
      details: { admissionNo: existing.admissionNo, changedFields: ['profile'], dob: formatDate(existing.dob) },
    })
    revalidatePath('/admin/students')
    revalidatePath(`/admin/students/${id}`)
    if (oldPhotoStorageKey) await deleteFile(oldPhotoStorageKey).catch(() => {})
    redirect(`/admin/students/${id}`)
  } catch (e) {
    if (photo) await deleteFile(photo.storageKey).catch(() => {})
    if (e instanceof StorageError) {
      return { status: 'error', message: e.message }
    }
    if (isRedirectError(e)) throw e
    return { status: 'error', message: 'Something went wrong. Please try again.' }
  }
}

export async function deactivateStudent(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const student = await prisma.student.findUnique({ where: { id }, select: { admissionNo: true } })
  if (!student) return

  await prisma.student.update({ where: { id }, data: { status: 'WITHDRAWN' } })
  await auditLog({
    actorId: actor.id,
    action: 'DEACTIVATE',
    entity: 'Student',
    entityId: id,
    details: { admissionNo: student.admissionNo },
  })
  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${id}`)
}

export async function uploadStudentFile(studentId: string, _prev: StudentFormState, formData: FormData): Promise<StudentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } })
  if (!student) return { status: 'error', message: 'Student not found.' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', message: 'Choose a file to upload.' }
  }
  const categoryRaw = String(formData.get('category') ?? 'DOCUMENT')
  if (!['PHOTO', 'DOCUMENT', 'ID_CARD', 'OTHER'].includes(categoryRaw)) {
    return { status: 'error', message: 'Invalid file category.' }
  }

  if (file.size > MAX_FILE_SIZE) return { status: 'error', message: 'File exceeds maximum size of 10MB.' }

  try {
    const saved = await saveFile({
      data: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      originalName: file.name,
      category: categoryRaw as FileCategory,
    })
    await prisma.studentFile.create({
      data: {
        studentId,
        category: categoryRaw as FileCategory,
        filename: saved.filename,
        originalName: file.name,
        mimeType: saved.mimeType,
        size: saved.size,
        storageKey: saved.storageKey,
        uploadedById: actor.id,
      },
    })
    await auditLog({
      actorId: actor.id,
      action: 'UPLOAD',
      entity: 'StudentFile',
      entityId: saved.storageKey,
      details: { studentId, category: categoryRaw, originalName: file.name, size: saved.size },
    })
    revalidatePath(`/admin/students/${studentId}`)
    return { status: 'success', message: 'File uploaded.' }
  } catch (e) {
    if (e instanceof StorageError) return { status: 'error', message: e.message }
    return { status: 'error', message: 'File upload failed. Please try again.' }
  }
}

export async function deleteStudent(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const student = await prisma.student.findUnique({
    where: { id },
    select: { id: true, admissionNo: true, userId: true, photoUrl: true, files: { select: { storageKey: true } } },
  })
  if (!student) return

  await prisma.$transaction(async (tx) => {
    await tx.enrollment.deleteMany({ where: { studentId: id } })
    await tx.studentGuardian.deleteMany({ where: { studentId: id } })
    await tx.attendance.deleteMany({ where: { studentId: id } })
    await tx.mark.deleteMany({ where: { studentId: id } })
    await tx.invoiceItem.deleteMany({ where: { invoice: { studentId: id } } })
    await tx.payment.deleteMany({ where: { invoice: { studentId: id } } })
    await tx.invoice.deleteMany({ where: { studentId: id } })
    await tx.admissionApplication.updateMany({ where: { studentId: id }, data: { studentId: null } })
    await tx.studentFile.deleteMany({ where: { studentId: id } })
    await tx.student.delete({ where: { id } })
    if (student.userId) {
      await tx.user.delete({ where: { id: student.userId } })
    }
  })

  for (const file of student.files) {
    await deleteFile(file.storageKey).catch(() => {})
  }
  if (student.photoUrl) {
    await deleteFile(student.photoUrl).catch(() => {})
  }

  await auditLog({
    actorId: actor.id,
    action: 'DELETE',
    entity: 'Student',
    entityId: id,
    details: { admissionNo: student.admissionNo },
  })
  revalidatePath('/admin/students')
}

export async function deleteStudentFile(fileId: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const file = await prisma.studentFile.findUnique({ where: { id: fileId } })
  if (!file) return

  await prisma.$transaction(async (tx) => {
    await tx.studentFile.delete({ where: { id: fileId } })
    if (file.category === 'PHOTO') {
      const student = await tx.student.findUnique({ where: { id: file.studentId }, select: { photoUrl: true } })
      if (student?.photoUrl === file.storageKey) {
        await tx.student.update({ where: { id: file.studentId }, data: { photoUrl: null } })
      }
    }
  })
  await deleteFile(file.storageKey).catch(() => {})
  await auditLog({
    actorId: actor.id,
    action: 'DELETE_FILE',
    entity: 'StudentFile',
    entityId: file.id,
    details: { studentId: file.studentId, category: file.category, storageKey: file.storageKey },
  })
  revalidatePath(`/admin/students/${file.studentId}`)
}
