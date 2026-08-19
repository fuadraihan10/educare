import type { Metadata } from 'next'
import Link from 'next/link'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { CalendarCheck, GraduationCap, Wallet, ArrowRight, CalendarDays } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function StudentDashboard() {
  const user = await requirePage('STUDENT')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: {
      id: true, firstName: true, lastName: true, admissionNo: true,
      rollNo: true, classId: true, photoUrl: true,
      class: { select: { name: true, section: true } },
    },
  })

  if (!student) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Dashboard" />
        <EmptyState
          icon={GraduationCap}
          title="No student profile"
          description="No student profile is linked to this account. Contact the school office to get enrolled."
        />
      </div>
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

  const links = [
    { href: '/student/attendance', label: 'Attendance', icon: CalendarCheck, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', hoverBorder: 'hover:border-emerald-500/30' },
    { href: '/student/grades', label: 'Results', icon: GraduationCap, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', hoverBorder: 'hover:border-blue-500/30' },
    { href: '/student/timetable', label: 'Timetable', icon: CalendarDays, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', hoverBorder: 'hover:border-amber-500/30' },
    { href: '/student/fees', label: 'Fees', icon: Wallet, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', hoverBorder: 'hover:border-rose-500/30' },
  ]

  const staggerClasses = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4']

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {student.class?.name} · Section {student.class?.section} &middot; Roll {student.rollNo}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Attendance" value={attendancePct === null ? '—' : `${attendancePct}%`} icon={CalendarCheck} iconColor="bg-emerald-500/10" subtitle={attendanceTotal > 0 ? `${attendancePresent}/${attendanceTotal} days` : 'No records'} className="animate-fade-in stagger-1" />
        <StatCard title="Average" value={avg === null ? '—' : `${Math.round(Number(avg))}%`} icon={GraduationCap} iconColor="bg-blue-500/10" subtitle="Published marks" className="animate-fade-in stagger-2" />
        <StatCard title="Fees" value="View" icon={Wallet} iconColor="bg-rose-500/10" subtitle="Payment status" className="animate-fade-in stagger-3" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Quick links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className={`glass-card group flex items-center gap-4 rounded-xl p-5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] hover:text-foreground border border-transparent ${l.hoverBorder} animate-fade-in ${staggerClasses[i]}`}
              >
                <div className={`rounded-2xl ${l.color} p-3 group-hover:scale-110 transition-transform duration-200`}>
                  <l.icon className="size-5" />
                </div>
                <span className="flex-1">{l.label}</span>
                <ArrowRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
