import Link from 'next/link'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CalendarCheck, FileText } from 'lucide-react'

export default async function TeacherDashboard() {
  const user = await requirePage('TEACHER')

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      assignments: {
        include: {
          class: true,
          subject: true,
        },
      },
    },
  })

  const classesTaught = teacher?.assignments ?? []
  const classIds = [...new Set(classesTaught.map((a) => a.classId))]
  const studentCount = await prisma.enrollment.count({
    where: { classId: { in: classIds }, status: 'ACTIVE' },
  })

  const upcomingAssessments = await prisma.assessment.count({
    where: {
      teacherId: teacher?.id,
      date: { gte: new Date() },
    },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const attendanceToday = await prisma.attendance.count({
    where: { classId: { in: classIds }, date: { gte: today } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-sm text-muted-foreground">
          {teacher?.designation} · {classesTaught.length} subject(s) across {classIds.length} class(es)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="My students" value={studentCount} icon={Users} />
        <StatCard title="Attendance marked today" value={attendanceToday} icon={CalendarCheck} />
        <StatCard title="Upcoming assessments" value={upcomingAssessments} icon={FileText} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {classesTaught.length === 0 && (
            <p className="text-sm text-muted-foreground">No classes assigned yet.</p>
          )}
          {[...new Map(classesTaught.map((a) => [a.classId, a])).values()].map((a) => (
            <div key={a.classId} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">
                  {a.class.name} {a.class.section}
                </p>
                <p className="text-sm text-muted-foreground">
                  {classesTaught.filter((x) => x.classId === a.classId).map((x) => x.subject.name).join(', ')}
                </p>
              </div>
              <Button variant="outline" size="sm" render={<Link href="/teacher/attendance" />}>
                Mark attendance
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
