import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PERMISSIONS, hasPermission } from '@/lib/rbac'
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

const filterSchema = paginationSchema.extend({
  classId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  studentId: z.string().optional(),
})

const listSelect = {
  id: true,
  date: true,
  status: true,
  note: true,
  student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
  class: { select: { id: true, name: true, section: true } },
  markedBy: { select: { id: true, name: true } },
  createdAt: true,
} as const

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!hasPermission(session.user.role, PERMISSIONS.ATTENDANCE.READ)) throw new ForbiddenError()

    if (await apiRateLimit(`attendance:${session.user.id}`, 100, 60)) {
      return NextResponse.json(errorResponse('RATE_LIMITED', 'Too many requests'), { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const params = filterSchema.parse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      classId: searchParams.get('classId'),
      date: searchParams.get('date'),
      studentId: searchParams.get('studentId'),
    })

    const where: Record<string, unknown> = {}
    if (params.classId) where.classId = params.classId
    if (params.studentId) where.studentId = params.studentId
    if (params.date) where.date = new Date(params.date)

    // Row-level filtering: restrict to own data for STUDENT/PARENT roles
    if (session.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id }, select: { id: true } })
      where.studentId = student?.id ?? '__NONE__'
    } else if (session.user.role === 'PARENT') {
      const links = await prisma.studentGuardian.findMany({ where: { parentUserId: session.user.id }, select: { studentId: true } })
      const ids = links.map((l) => l.studentId)
      where.studentId = ids.length > 0 ? { in: ids } : '__NONE__'
    } else if (session.user.role === 'TEACHER') {
      const assigned = await prisma.teacherAssignment.findMany({ where: { teacher: { userId: session.user.id } }, select: { classId: true } })
      const classIds = assigned.map((a) => a.classId)
      if (classIds.length > 0) {
        where.classId = params.classId ? (classIds.includes(params.classId) ? params.classId : '__NONE__') : { in: classIds }
      } else {
        where.classId = '__NONE__'
      }
    }

    const { skip, take } = getSkipTake(params)
    const [data, total] = await prisma.$transaction([
      prisma.attendance.findMany({ where, select: listSelect, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], skip, take }),
      prisma.attendance.count({ where }),
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
