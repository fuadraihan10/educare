import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PERMISSIONS, hasPermission } from '@/lib/rbac'
import { Prisma } from '@/generated/prisma/client'
import { getSkipTake, paginationSchema } from '@/lib/pagination'
import { apiRateLimit } from '@/lib/rate-limit'
import {
  AppError,
  ForbiddenError,
  UnauthorizedError,
  successResponse,
  errorResponse,
  fromError,
} from '@/lib/errors'
import { auditLog } from '@/lib/audit'
import { nextAdmissionNo } from '@/lib/students'

const createStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().max(10).optional(),
  religion: z.string().max(50).optional(),
  nationality: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  guardianName: z.string().min(1).max(200),
  guardianRelation: z.string().min(1).max(50),
  guardianPhone: z.string().min(1).max(20),
  guardianEmail: z.string().email().max(255).optional(),
  classId: z.string().optional(),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

const listSelect = {
  id: true,
  admissionNo: true,
  firstName: true,
  middleName: true,
  lastName: true,
  dob: true,
  gender: true,
  bloodGroup: true,
  admissionDate: true,
  status: true,
  rollNo: true,
  class: { select: { id: true, name: true, section: true } },
} as const

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!hasPermission(session.user.role, PERMISSIONS.STUDENTS.READ)) throw new ForbiddenError()

    if (await apiRateLimit(`students-list:${session.user.id}`, 100, 60)) {
      return NextResponse.json(errorResponse('RATE_LIMITED', 'Too many requests'), { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const params = paginationSchema.parse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })

    const q = params.search || undefined

    // Row-level filtering: students and parents can only see their own/linked data
    let baseWhere: Record<string, unknown> | undefined = undefined
    if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id }, select: { id: true } })
      baseWhere = student ? { id: student.id } : { id: '__NONE__' }
    } else if (session.user.role === 'PARENT') {
      const links = await prisma.studentGuardian.findMany({ where: { parentUserId: session.user.id }, select: { studentId: true } })
      const ids = links.map((l) => l.studentId)
      baseWhere = ids.length > 0 ? { id: { in: ids } } : { id: '__NONE__' }
    }

    const where = baseWhere
      ? { ...baseWhere, ...(q ? { OR: [{ firstName: { contains: q, mode: 'insensitive' as const } }, { lastName: { contains: q, mode: 'insensitive' as const } }, { admissionNo: { contains: q, mode: 'insensitive' as const } }] } : {}) }
      : q
        ? { OR: [{ firstName: { contains: q, mode: 'insensitive' as const } }, { lastName: { contains: q, mode: 'insensitive' as const } }, { admissionNo: { contains: q, mode: 'insensitive' as const } }] }
        : undefined

    const { skip, take } = getSkipTake(params)
    const [data, total] = await prisma.$transaction([
      prisma.student.findMany({ where, select: listSelect, orderBy: [{ createdAt: 'desc' }], skip, take }),
      prisma.student.count({ where }),
    ])

    const totalPages = Math.ceil(total / params.pageSize)
    return NextResponse.json(
      successResponse({
        data,
        pagination: {
          page: params.page,
          pageSize: params.pageSize,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      }),
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    const res = fromError(error)
    return NextResponse.json(res, { status: error instanceof AppError ? error.statusCode : 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!hasPermission(session.user.role, PERMISSIONS.STUDENTS.CREATE)) throw new ForbiddenError()

    if (await apiRateLimit(`students-create:${session.user.id}`, 30, 60)) {
      return NextResponse.json(errorResponse('RATE_LIMITED', 'Too many requests'), { status: 429 })
    }

    const body = await request.json()
    const data = createStudentSchema.parse(body)

    const year = new Date().getFullYear()
    let admissionNo = await nextAdmissionNo(year)
    let retries = 0
    const maxRetries = 5

    while (retries < maxRetries) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const student = await tx.student.create({
            data: {
              admissionNo,
              firstName: data.firstName,
              middleName: data.middleName,
              lastName: data.lastName,
              dob: new Date(data.dob),
              gender: data.gender,
              bloodGroup: data.bloodGroup,
              religion: data.religion,
              nationality: data.nationality,
              address: data.address,
              city: data.city,
              phone: data.phone,
              email: data.email,
              guardianName: data.guardianName,
              guardianRelation: data.guardianRelation,
              guardianPhone: data.guardianPhone,
              guardianEmail: data.guardianEmail,
              classId: data.classId,
              admissionDate: data.admissionDate ? new Date(data.admissionDate) : undefined,
            },
            select: listSelect,
          })

          // Auto-create user account with temp password
          const regPrefix = `STU-${year}-`
          const lastReg = await tx.user.findFirst({
            where: { regNo: { startsWith: regPrefix } },
            orderBy: { regNo: 'desc' },
            select: { regNo: true },
          })
          const regSeq = lastReg ? (Number(lastReg.regNo.slice(lastReg.regNo.lastIndexOf('-') + 1)) || 0) + 1 : 1
          const regNo = `${regPrefix}${String(regSeq).padStart(4, '0')}`

          const { hash } = await import('bcryptjs')
          const { generateTempPassword } = await import('@/lib/password')
          const tempPassword = generateTempPassword()
          const passwordHash = await hash(tempPassword, 12)
          const user = await tx.user.create({
            data: {
              regNo,
              email: data.email || `${regNo.toLowerCase()}@educare.edu.bd`,
              passwordHash,
              name: `${data.firstName} ${data.lastName}`,
              role: 'STUDENT',
              forcePasswordChange: true,
            },
            select: { id: true },
          })
          await tx.student.update({ where: { id: student.id }, data: { userId: user.id } })

          return { ...student, _tempPassword: tempPassword }
        })

        await auditLog({
          actorId: session.user.id,
          actorRole: session.user.role,
          action: 'CREATE',
          entity: 'Student',
          entityId: result.id,
          details: { admissionNo: result.admissionNo },
        })

        const { _tempPassword: tempPassword, ...studentData } = result
        return NextResponse.json(successResponse({ ...studentData, tempPassword }), { status: 201 })
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && retries < maxRetries) {
          retries++
          admissionNo = await nextAdmissionNo(year)
          continue
        }
        throw e
      }
    }

    return NextResponse.json(errorResponse('CONFLICT', 'Unable to generate unique admission number'), { status: 409 })
  } catch (error) {
    const res = fromError(error)
    return NextResponse.json(res, { status: error instanceof AppError ? error.statusCode : 500 })
  }
}
