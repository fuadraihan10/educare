import 'server-only'

import { prisma } from '@/lib/db'

export type StaffListItem = {
  id: string
  employeeId: string
  name: string
  email: string | null
  phone: string | null
  designation: string | null
  status: string
  classesTaught: { name: string; section: string }[]
}

// Parses "EMP-011" and returns the integer sequence (011 -> 11).
function seqOf(employeeId: string): number {
  const i = Number(employeeId.slice(employeeId.lastIndexOf('-') + 1))
  return Number.isInteger(i) ? i : 0
}

// Generates the next employee id, e.g. EMP-011. Callers must wrap their create
// in a P2002 retry loop: this only computes the candidate from the latest row.
export async function nextEmployeeId(): Promise<string> {
  const last = await prisma.teacher.findFirst({
    orderBy: { employeeId: 'desc' },
    select: { employeeId: true },
  })
  const seq = (last ? seqOf(last.employeeId) : 0) + 1
  return `EMP-${String(seq).padStart(3, '0')}`
}

export async function listStaff(input: {
  q?: string
  page?: number
  pageSize?: number
}): Promise<{ staff: StaffListItem[]; total: number }> {
  const q = input.q?.trim()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { employeeId: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
          { designation: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  const [staff, total] = await prisma.$transaction([
    prisma.teacher.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        designation: true,
        status: true,
        classesTaught: { select: { name: true, section: true } },
      },
      orderBy: [{ employeeId: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.teacher.count({ where }),
  ])

  return { staff, total }
}

export async function getTeacher(id: string) {
  return prisma.teacher.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, status: true } },
      assignments: {
        orderBy: [{ academicYear: { startDate: 'desc' } }],
        take: 20,
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true } },
          academicYear: { select: { name: true } },
        },
      },
      classesTaught: {
        select: { name: true, section: true, academicYear: { select: { name: true } } },
      },
    },
  })
}
