import 'server-only'

import { prisma } from '@/lib/db'

export type AttendanceRecord = {
  id: string
  studentId: string
  student: { id: string; firstName: string; lastName: string; admissionNo: string; rollNo: number | null }
  date: Date
  status: string
  note: string | null
  markedBy: { name: string }
}

export async function listAttendanceByClass(input: {
  classId: string
  date: string
}): Promise<AttendanceRecord[]> {
  const d = new Date(`${input.date}T00:00:00.000Z`)
  return prisma.attendance.findMany({
    where: { classId: input.classId, date: d },
    select: {
      id: true,
      studentId: true,
      student: { select: { id: true, firstName: true, lastName: true, admissionNo: true, rollNo: true } },
      date: true,
      status: true,
      note: true,
      markedBy: { select: { name: true } },
    },
    orderBy: { student: { rollNo: 'asc' } },
  })
}

export async function getRosterForClass(classId: string) {
  return prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, admissionNo: true, rollNo: true },
    orderBy: { rollNo: 'asc' },
  })
}

export type StudentAttendanceHistory = {
  date: Date
  status: string
  note: string | null
  class: { name: string; section: string; code: string }
}

export async function getStudentAttendanceHistory(studentId: string, limit = 30): Promise<StudentAttendanceHistory[]> {
  return prisma.attendance.findMany({
    where: { studentId },
    select: {
      date: true,
      status: true,
      note: true,
      class: { select: { name: true, section: true, code: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  })
}

export async function getStudentAttendanceStats(studentId: string) {
  const results = await prisma.attendance.groupBy({
    by: ['status'],
    where: { studentId },
    _count: true,
  })

  const statusCounts = new Map(results.map(r => [r.status, r._count]))
  const total = results.reduce((sum, r) => sum + r._count, 0)
  const present = statusCounts.get('PRESENT') ?? 0
  const late = statusCounts.get('LATE') ?? 0
  const absent = statusCounts.get('ABSENT') ?? 0
  const leave = statusCounts.get('LEAVE') ?? 0

  return { total, present, late, absent, leave, percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0 }
}

export type AbsenceReportRow = {
  studentId: string
  firstName: string
  lastName: string
  admissionNo: string
  class: { name: string; section: string; code: string } | null
  absentCount: number
  totalDays: number
  percentage: number
}

export async function getAbsenceReport(input: {
  classId?: string
  startDate?: string
  endDate?: string
}): Promise<AbsenceReportRow[]> {
  const where: Record<string, unknown> = {}
  if (input.classId) where.classId = input.classId
  if (input.startDate || input.endDate) {
    where.date = {}
    if (input.startDate) (where.date as Record<string, unknown>).gte = new Date(`${input.startDate}T00:00:00.000Z`)
    if (input.endDate) (where.date as Record<string, unknown>).lte = new Date(`${input.endDate}T00:00:00.000Z`)
  }

  const studentWhere: Record<string, unknown> = { status: 'ACTIVE' }
  if (input.classId) studentWhere.classId = input.classId

  const students = await prisma.student.findMany({
    where: studentWhere,
    select: { id: true, firstName: true, lastName: true, admissionNo: true, class: { select: { name: true, section: true, code: true } } },
    orderBy: [{ class: { name: 'asc' } }, { rollNo: 'asc' }],
  })

  const studentIds = students.map((s) => s.id)
  if (studentIds.length === 0) return []

  const totalByStudent = await prisma.attendance.groupBy({
    by: ['studentId'],
    where: { studentId: { in: studentIds }, ...where },
    _count: true,
  })

  const absentByStudent = await prisma.attendance.groupBy({
    by: ['studentId'],
    where: { studentId: { in: studentIds }, status: 'ABSENT', ...where },
    _count: true,
  })

  const totalMap = new Map(totalByStudent.map((r) => [r.studentId, r._count]))
  const absentMap = new Map(absentByStudent.map((r) => [r.studentId, r._count]))

  return students.map((s) => {
    const t = totalMap.get(s.id) ?? 0
    const a = absentMap.get(s.id) ?? 0
    return {
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      admissionNo: s.admissionNo,
      class: s.class,
      absentCount: a,
      totalDays: t,
      percentage: t > 0 ? Math.round((a / t) * 100) : 0,
    }
  })
}
