import type { Metadata } from 'next'
import Link from 'next/link'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { Users, CalendarCheck, FileText, BookOpen, Plus, PenLine } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function TeacherDashboard() {
  const user = await requirePage('TEACHER')

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      designation: true,
      assignments: {
        select: {
          id: true,
          classId: true,
          class: { select: { name: true, section: true } },
          subject: { select: { name: true } },
        },
      },
    },
  })

  const classesTaught = teacher?.assignments ?? []
  const uniqueClasses = [...new Map(classesTaught.map((a) => [a.classId, a])).values()]
  const classIds = [...new Set(classesTaught.map((a) => a.classId))]
  const allSubjects = [...new Set(classesTaught.map((a) => a.subject.name))]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [studentCount, upcomingAssessments, attendanceToday] = await Promise.all([
    prisma.enrollment.count({
      where: { classId: { in: classIds }, status: 'ACTIVE' },
    }),
    prisma.assessment.count({
      where: {
        teacherId: teacher?.id,
        date: { gte: new Date() },
      },
    }),
    prisma.attendance.count({
      where: { classId: { in: classIds }, date: { gte: today, lt: tomorrow } },
    }),
  ])

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Dashboard</h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 flex-wrap">
            {teacher?.designation && <Badge variant="secondary">{teacher.designation}</Badge>}
            <span className="text-sm text-muted-foreground">{classesTaught.length} subject(s) across {classIds.length} class(es)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/teacher/exams/new" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="size-4" /> New Exam
          </Link>
          <Link href="/teacher/attendance" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors">
            <PenLine className="size-4" /> Mark Attendance
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="My Students" value={studentCount} icon={Users} iconColor="bg-blue-500/10" subtitle="Across all classes" className="animate-fade-in stagger-1" />
        <StatCard title="Attendance Today" value={attendanceToday} icon={CalendarCheck} iconColor="bg-emerald-500/10" subtitle={classIds.length > 0 ? `${classIds.length} class(es)` : 'No classes'} className="animate-fade-in stagger-2" />
        <StatCard title="Upcoming Exams" value={upcomingAssessments} icon={FileText} iconColor="bg-amber-500/10" subtitle={upcomingAssessments > 0 ? 'Scheduled' : 'None scheduled'} className="animate-fade-in stagger-3" />
      </div>

      {/* My Subjects */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">My Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {allSubjects.length === 0 ? (
            <EmptyState icon={BookOpen} title="No subjects assigned" description="You don't have any subject assignments yet." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {allSubjects.map((name) => (
                <span key={name} className="rounded-xl bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  {name}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Classes - Centered */}
      <div className="flex justify-center">
        <Card className="overflow-hidden w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">My Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uniqueClasses.length === 0 && (
              <EmptyState
                icon={BookOpen}
                title="No classes assigned"
                description="You don't have any classes assigned yet."
              />
            )}
            {uniqueClasses.map((a) => {
              const subjects = classesTaught.filter((x) => x.classId === a.classId)
              return (
                <div
                  key={a.classId}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl p-4 border border-border/50 transition-all duration-200 hover:border-primary/20 hover:bg-muted/20"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="shrink-0 rounded-xl bg-primary/10 p-3">
                      <BookOpen className="size-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {a.class.name} · Section {a.class.section}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {subjects.map((x) => (
                          <span key={x.id} className="rounded-lg bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary/80">
                            {x.subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link href="/teacher/attendance" className="shrink-0 inline-flex items-center justify-center rounded-xl border border-border px-3 py-1.5 text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] hover:border-primary/30 hover:text-primary">
                    Mark attendance
                  </Link>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
