import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PERMISSIONS, hasPermission } from '@/lib/rbac'
import { apiRateLimit } from '@/lib/rate-limit'
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  successResponse,
  errorResponse,
  fromError,
} from '@/lib/errors'
import { auditLog } from '@/lib/audit'

const patchSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  middleName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().trim().max(10).optional(),
  religion: z.string().trim().max(50).optional(),
  nationality: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().email('Invalid email.').max(255).optional().or(z.literal('')),
  guardianName: z.string().trim().min(1).max(100).optional(),
  guardianRelation: z.string().trim().min(1).max(50).optional(),
  guardianPhone: z.string().trim().min(1).max(20).optional(),
  guardianEmail: z.string().email('Invalid email.').max(255).optional().or(z.literal('')),
  classId: z.string().optional(),
  rollNo: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'WITHDRAWN']).optional(),
}).strict()

const detailSelect = {
  id: true,
  admissionNo: true,
  firstName: true,
  middleName: true,
  lastName: true,
  dob: true,
  gender: true,
  bloodGroup: true,
  religion: true,
  nationality: true,
  address: true,
  city: true,
  phone: true,
  email: true,
  guardianName: true,
  guardianRelation: true,
  guardianPhone: true,
  guardianEmail: true,
  photoUrl: true,
  admissionDate: true,
  status: true,
  rollNo: true,
  classId: true,
  createdAt: true,
  updatedAt: true,
  class: { select: { id: true, name: true, section: true } },
} as const

async function authorizeStudentAccess(sessionUser: { id: string; role: string }, studentId: string) {
  if (sessionUser.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId: sessionUser.id }, select: { id: true } })
    if (!teacher) throw new ForbiddenError('Teacher profile not found.')
    const assignment = await prisma.teacherAssignment.findFirst({
      where: { teacherId: teacher.id, academicYear: { isActive: true } },
      select: { classId: true },
    })
    if (!assignment) throw new ForbiddenError('You are not assigned to any class.')
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { classId: true } })
    if (!student || student.classId !== assignment.classId) throw new ForbiddenError('You can only view students in your assigned class.')
  }
  if (sessionUser.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: sessionUser.id }, select: { id: true } })
    if (!student || student.id !== studentId) throw new ForbiddenError('You can only view your own profile.')
  }
  if (sessionUser.role === 'PARENT') {
    const link = await prisma.studentGuardian.findUnique({
      where: { studentId_parentUserId: { studentId, parentUserId: sessionUser.id } },
      select: { id: true },
    })
    if (!link) throw new ForbiddenError('You can only view your linked children.')
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!hasPermission(session.user.role, PERMISSIONS.STUDENTS.READ)) throw new ForbiddenError()

    if (await apiRateLimit(`students:${session.user.id}`, 100, 60)) {
      return NextResponse.json(errorResponse('RATE_LIMITED', 'Too many requests'), { status: 429 })
    }

    const { id } = await params
    const student = await prisma.student.findUnique({ where: { id }, select: detailSelect })
    if (!student) throw new NotFoundError('Student', id)

    await authorizeStudentAccess(session.user, id)

    return NextResponse.json(successResponse(student))
  } catch (error) {
    const res = fromError(error)
    return NextResponse.json(res, { status: error instanceof AppError ? error.statusCode : 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!hasPermission(session.user.role, PERMISSIONS.STUDENTS.UPDATE)) throw new ForbiddenError()

    if (await apiRateLimit(`students-patch:${session.user.id}`, 30, 60)) {
      return NextResponse.json(errorResponse('RATE_LIMITED', 'Too many requests'), { status: 429 })
    }

    const { id } = await params
    const existing = await prisma.student.findUnique({ where: { id }, select: { id: true } })
    if (!existing) throw new NotFoundError('Student', id)

    await authorizeStudentAccess(session.user, id)

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(errorResponse('VALIDATION_ERROR', parsed.error.issues.map(i => i.message).join(', ')), { status: 400 })
    }
    const data = parsed.data

    if (data.classId) {
      const cls = await prisma.class.findUnique({ where: { id: data.classId }, select: { id: true } })
      if (!cls) {
        return NextResponse.json(errorResponse('VALIDATION_ERROR', 'Class not found.'), { status: 400 })
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(errorResponse('VALIDATION_ERROR', 'No fields to update.'), { status: 400 })
    }

    const updated = await prisma.student.update({ where: { id }, data, select: detailSelect })

    await auditLog({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: 'UPDATE',
      entity: 'Student',
      entityId: id,
      details: { fields: Object.keys(data) },
    })

    return NextResponse.json(successResponse(updated))
  } catch (error) {
    const res = fromError(error)
    return NextResponse.json(res, { status: error instanceof AppError ? error.statusCode : 500 })
  }
}
