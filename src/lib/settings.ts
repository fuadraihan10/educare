import 'server-only'

import { prisma } from '@/lib/db'

export async function getSchool() {
  return prisma.school.findFirst({
    select: {
      id: true, name: true, shortName: true, address: true, city: true,
      phone: true, email: true, logoUrl: true, timezone: true,
      currentAcademicYear: { select: { id: true, name: true, startDate: true, endDate: true } },
    },
  })
}

export async function listAcademicYearsWithTerms() {
  return prisma.academicYear.findMany({
    include: {
      terms: { orderBy: { startDate: 'asc' } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { startDate: 'desc' },
  })
}

export async function listGradeScales() {
  return prisma.gradeScale.findMany({ orderBy: { order: 'asc' } })
}
