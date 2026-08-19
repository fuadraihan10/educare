import type { Metadata } from 'next'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { Users, GraduationCap, UserRound, BookOpen, CalendarCheck, Wallet, Megaphone } from 'lucide-react'

export const metadata: Metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalStudents,
    activeStudents,
    totalTeachers,
    activeTeachers,
    totalClasses,
    totalSubjects,
    totalAttendance,
    presentAttendance,
    totalInvoices,
    paidInvoices,
    totalAnnouncements,
    recentEnrollmentCount,
    topPerformers,
    attendanceByDay,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.teacher.count(),
    prisma.teacher.count({ where: { status: 'ACTIVE' } }),
    prisma.class.count({ where: { academicYear: { isActive: true } } }),
    prisma.subject.count(),
    prisma.attendance.count(),
    prisma.attendance.count({ where: { status: { in: ['PRESENT', 'LATE'] } } }),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: 'PAID' } }),
    prisma.announcement.count(),
    prisma.enrollment.count({
      where: { enrollmentDate: { gte: thirtyDaysAgo } },
    }),
    prisma.mark.groupBy({
      by: ['studentId'],
      where: { assessment: { isPublished: true } },
      _avg: { marksObtained: true },
      _count: { id: true },
      orderBy: { _avg: { marksObtained: 'desc' } },
      take: 5,
    }),
    prisma.attendance.groupBy({
      by: ['date'],
      where: { date: { gte: sevenDaysAgo } },
      _count: { id: true },
      orderBy: { date: 'asc' },
    }),
  ])

  const attendancePct = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0
  const feeCollectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0

  const topStudentIds = topPerformers.map((p) => p.studentId)

  const [topStudents, overdueAmount, pendingPayments] = await Promise.all([
    topStudentIds.length > 0
      ? prisma.student.findMany({ where: { id: { in: topStudentIds } }, select: { id: true, firstName: true, lastName: true, admissionNo: true } })
      : [],
    prisma.invoice.aggregate({
      where: { status: { in: ['ISSUED', 'OVERDUE', 'PARTIAL'] } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ])

  const topStudentMap = Object.fromEntries(topStudents.map((s) => [s.id, s]))

  const stats = [
    { label: 'Active Students', value: activeStudents, total: totalStudents, icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active Teachers', value: activeTeachers, total: totalTeachers, icon: UserRound, color: 'text-green-600 dark:text-green-400' },
    { label: 'Classes', value: totalClasses, icon: Users, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Subjects', value: totalSubjects, icon: BookOpen, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Attendance Rate', value: `${attendancePct}%`, icon: CalendarCheck, color: 'text-teal-600 dark:text-teal-400' },
    { label: 'Fee Collection', value: `${feeCollectionRate}%`, icon: Wallet, color: 'text-rose-600 dark:text-rose-400' },
    { label: 'Overdue Invoices', value: overdueAmount._count.id, icon: Wallet, color: 'text-red-600 dark:text-red-400' },
    { label: 'Pending Payments', value: pendingPayments._count.id, icon: Megaphone, color: 'text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Analytics"
        subtitle="School overview at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={s.label} className={`overflow-hidden relative animate-fade-in stagger-${Math.min(i + 1, 6)}`}>
            <div className="absolute -top-6 -right-6 size-24 rounded-full bg-primary/5" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`size-4 ${s.color}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold tracking-tight">{s.value}</div>
              {'total' in s && s.total !== undefined && <p className="text-xs text-muted-foreground mt-1">of {s.total} total</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-lg">Top Performers</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No published marks yet.</p>}
            {topPerformers.map((p, i) => {
              const s = topStudentMap[p.studentId]
              return (
                <div key={p.studentId} className="flex items-center justify-between text-sm rounded-lg bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Badge variant={i === 0 ? 'default' : 'outline'} className="size-6 justify-center rounded-full">{i + 1}</Badge>
                    <span className="font-medium">{s ? `${s.firstName} ${s.lastName}` : p.studentId}</span>
                  </div>
                  <span className="font-semibold text-primary">{Math.round(Number(p._avg.marksObtained))}%</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'New enrollments (30d)', value: recentEnrollmentCount, variant: 'secondary' as const },
              { label: 'Total attendance records', value: totalAttendance.toLocaleString(), variant: 'secondary' as const },
              { label: 'Announcements', value: totalAnnouncements, variant: 'secondary' as const },
              { label: 'Total invoices', value: totalInvoices, variant: 'secondary' as const },
              { label: 'Outstanding amount', value: Number(overdueAmount._sum.totalAmount ?? 0).toLocaleString(), variant: 'destructive' as const },
              { label: 'Pending payments', value: `${pendingPayments._count.id} (${Number(pendingPayments._sum.amount ?? 0).toLocaleString()})`, variant: 'destructive' as const },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm rounded-lg bg-muted/30 px-3 py-2">
                <span className="text-muted-foreground">{item.label}</span>
                <Badge variant={item.variant}>{item.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {attendanceByDay.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-lg">Attendance (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {(() => {
                const maxCount = Math.max(...attendanceByDay.map((x) => x._count.id))
                return attendanceByDay.map((d) => {
                  const pct = maxCount > 0 ? (d._count.id / maxCount) * 100 : 0
                  return (
                    <div key={String(d.date)} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{d._count.id}</span>
                      <div className="w-full bg-gradient-to-t from-teal-600 to-teal-400 dark:from-teal-400 dark:to-teal-300 rounded-t-sm rounded-b-md transition-all duration-500" style={{ height: `${Math.max(pct, 4)}%` }} title={`${d._count.id} records`} />
                      <span className="text-[10px] text-muted-foreground font-medium">{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    </div>
                  )
                })
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
