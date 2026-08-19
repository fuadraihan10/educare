import 'server-only'

import { prisma } from '@/lib/db'

export type AdmissionListItem = {
  id: string
  applicantName: string
  dob: Date
  gender: string
  phone: string
  email: string | null
  guardianName: string
  guardianPhone: string
  appliedClass: { id: string; name: string; section: string; code: string }
  academicYear: { id: string; name: string }
  status: string
  createdAt: Date
}

export async function listAdmissions(input: {
  q?: string
  page?: number
  pageSize?: number
  status?: string
}): Promise<{ admissions: AdmissionListItem[]; total: number }> {
  const q = input.q?.trim()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const where: Record<string, unknown> = {}
  if (input.status) where.status = input.status
  if (q) {
    where.OR = [
      { applicantName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { guardianName: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [admissions, total] = await prisma.$transaction([
    prisma.admissionApplication.findMany({
      where,
      select: {
        id: true,
        applicantName: true,
        dob: true,
        gender: true,
        phone: true,
        email: true,
        guardianName: true,
        guardianPhone: true,
        appliedClass: { select: { id: true, name: true, section: true, code: true } },
        academicYear: { select: { id: true, name: true } },
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.admissionApplication.count({ where }),
  ])

  return { admissions, total }
}

export type AdmissionDetail = {
  id: string
  applicantName: string
  dob: Date
  gender: string
  phone: string
  email: string | null
  address: string | null
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  guardianEmail: string | null
  appliedClass: { id: string; name: string; section: string; code: string }
  academicYear: { id: string; name: string }
  status: string
  reviewedBy: { name: string } | null
  reviewedAt: Date | null
  remarks: string | null
  studentId: string | null
  createdAt: Date
}

export async function getAdmission(id: string): Promise<AdmissionDetail | null> {
  return prisma.admissionApplication.findUnique({
    where: { id },
    select: {
      id: true,
      applicantName: true,
      dob: true,
      gender: true,
      phone: true,
      email: true,
      address: true,
      guardianName: true,
      guardianRelation: true,
      guardianPhone: true,
      guardianEmail: true,
      appliedClass: { select: { id: true, name: true, section: true, code: true } },
      academicYear: { select: { id: true, name: true } },
      status: true,
      reviewedBy: { select: { name: true } },
      reviewedAt: true,
      remarks: true,
      studentId: true,
      createdAt: true,
    },
  }) as Promise<AdmissionDetail | null>
}
