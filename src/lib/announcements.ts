import 'server-only'

import { prisma } from '@/lib/db'
import { type AnnouncementAudience } from '@/generated/prisma/client'

export type AnnouncementListItem = {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience
  createdAt: Date
  createdBy: { name: string }
  class: { code: string; name: string; section: string } | null
}

export async function listAnnouncements(input: {
  q?: string
  page?: number
  pageSize?: number
}): Promise<{ announcements: AnnouncementListItem[]; total: number }> {
  const q = input.q?.trim()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { body: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [announcements, total] = await prisma.$transaction([
    prisma.announcement.findMany({
      where,
      select: {
        id: true, title: true, body: true, audience: true, createdAt: true,
        createdBy: { select: { name: true } },
        class: { select: { code: true, name: true, section: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.announcement.count({ where }),
  ])

  return { announcements, total }
}

export async function getAnnouncement(id: string) {
  return prisma.announcement.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      class: { select: { id: true, code: true, name: true, section: true } },
    },
  })
}

export async function listAnnouncementsForRole(role: string, userId: string) {
  const audience = role.toUpperCase() as AnnouncementAudience

  const where: Record<string, unknown>[] = [
    { audience: 'ALL' },
    { audience },
  ]

  if (role === 'PARENT') {
    const links = await prisma.studentGuardian.findMany({
      where: { parentUserId: userId },
      select: { student: { select: { classId: true } } },
    })
    const classIds = links.map((l) => l.student.classId).filter(Boolean)
    if (classIds.length > 0) where.push({ classId: { in: classIds } })
  }

  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId }, select: { classId: true } })
    if (student?.classId) where.push({ classId: student.classId })
  }

  if (role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } })
    if (teacher) {
      const assignments = await prisma.teacherAssignment.findMany({
        where: { teacherId: teacher.id },
        select: { classId: true },
      })
      const classIds = [...new Set(assignments.map((a: { classId: string }) => a.classId))]
      if (classIds.length > 0) where.push({ classId: { in: classIds } })
    }
  }

  return prisma.announcement.findMany({
    where: { OR: where },
    select: {
      id: true, title: true, body: true, audience: true, createdAt: true,
      createdBy: { select: { name: true } },
      class: { select: { code: true, name: true, section: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
