import Link from 'next/link'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarCheck, GraduationCap, Wallet } from 'lucide-react'

export default async function StudentDashboard() {
  const user = await requirePage('STUDENT')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { class: true },
  })

  if (!student) {
    return (
      <p className="text-sm text-muted-foreground">
        No student profile is linked to this account. Contact the school office.
      </p>
    )
  }

  const [attendanceTotal, attendancePresent, marksAgg] = await Promise.all([
    prisma.attendance.count({ where: { studentId: student.id } }),
    prisma.attendance.count({
      where: { studentId: student.id, status: { in: ['PRESENT', 'LATE'] } },
    }),
    prisma.mark.aggregate({
      where: { studentId: student.id, assessment: { isPublished: true } },
      _avg: { marksObtained: true },
    }),
  ])

  const attendancePct = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null
  const avg = marksAgg._avg.marksObtained

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-sm text-muted-foreground">
          {student.class?.name} {student.class?.section} · Roll {student.rollNo}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Attendance" value={attendancePct === null ? '—' : `${attendancePct}%`} icon={CalendarCheck} />
        <StatCard title="Average (published)" value={avg === null ? '—' : `${Math.round(Number(avg))}%`} icon={GraduationCap} />
        <StatCard title="Fees" value="View" icon={Wallet} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/student/attendance" />}>Attendance history</Button>
          <Button variant="outline" render={<Link href="/student/grades" />}>My results</Button>
          <Button variant="outline" render={<Link href="/student/timetable" />}>Timetable</Button>
          <Button variant="outline" render={<Link href="/student/fees" />}>Fees</Button>
        </CardContent>
      </Card>
    </div>
  )
}
