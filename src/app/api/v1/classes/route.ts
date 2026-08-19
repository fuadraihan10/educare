import { NextRequest, NextResponse } from 'next/server'

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

const listSelect = {
  id: true,
  name: true,
  section: true,
  code: true,
  room: true,
  classTeacher: { select: { id: true, name: true } },
  _count: { select: { students: true, assessments: true } },
} as const

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) throw new UnauthorizedError()
    if (!hasPermission(session.user.role, PERMISSIONS.CLASSES.READ)) throw new ForbiddenError()

    if (await apiRateLimit(`classes:${session.user.id}`, 100, 60)) {
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
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { code: { contains: q, mode: 'insensitive' as const } },
            { section: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined

    const { skip, take } = getSkipTake(params)
    const [data, total] = await prisma.$transaction([
      prisma.class.findMany({ where, select: listSelect, orderBy: [{ name: 'asc' }], skip, take }),
      prisma.class.count({ where }),
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
