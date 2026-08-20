import type { Metadata } from 'next'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import {
  Users,
  GraduationCap,
  UserRound,
  BookOpen,
  CalendarCheck,
  Wallet,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  UserCheck,
  School,
  FileText,
  Hourglass,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'

export const metadata: Metadata = { title: 'Analytics' }

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return current > 0 ? (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-500">
        <TrendingUp className="size-3" /> New
      </span>
    ) : (
      <span className="text-xs text-muted-foreground">No change</span>
    )
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return <span className="text-xs text-muted-foreground">No change</span>
  return pct > 0 ? (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-500">
      <TrendingUp className="size-3" /> +{pct}%
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500">
      <TrendingDown className="size-3" /> {pct}%
    </span>
  )
}

function ProgressBar({ value, color = 'bg-primary' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  )
}

function StatBox({
  label,
  value,
  icon: Icon,
  color,
  children,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  children?: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden relative">
      <div className="absolute -top-6 -right-6 size-24 rounded-full bg-primary/5" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`size-4 ${color}`} />
      </CardHeader>
      <CardContent className="relative space-y-1">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {children}
      </CardContent>
    </Card>
  )
}

export default async function AnalyticsPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalStudents,
    activeStudents,
    totalTeachers,
    activeTeachers,
    totalClasses,
    totalSubjects,
    attendanceByStatus30d,
    attendanceByStatusPrev30d,
    attendanceByDay,
    totalInvoices,
    paidInvoices,
    overdueInvoices,
    totalInvoicedAmount,
    totalCollectedAmount,
    pendingPayments,
    recentEnrollments,
    previousEnrollments,
    enrollmentsByClass,
    totalAnnouncements,
    recentAnnouncements,
    lastAnnouncement,
    topPerformers,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.teacher.count(),
    prisma.teacher.count({ where: { status: 'ACTIVE' } }),
    prisma.class.count({ where: { academicYear: { isActive: true } } }),
    prisma.subject.count(),
    prisma.attendance.groupBy({
      by: ['status'],
      where: { date: { gte: thirtyDaysAgo } },
      _count: { id: true },
    }),
    prisma.attendance.groupBy({
      by: ['status'],
      where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _count: { id: true },
    }),
    prisma.attendance.groupBy({
      by: ['date'],
      where: { date: { gte: sevenDaysAgo } },
      _count: { id: true },
      orderBy: { date: 'asc' },
    }),
    prisma.invoice.count({ where: { status: { not: 'CANCELLED' } } }),
    prisma.invoice.count({ where: { status: 'PAID' } }),
    prisma.invoice.count({ where: { status: { in: ['ISSUED', 'OVERDUE', 'PARTIAL'] } } }),
    prisma.invoice.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.enrollment.count({
      where: { enrollmentDate: { gte: thirtyDaysAgo } },
    }),
    prisma.enrollment.count({
      where: { enrollmentDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.enrollment.groupBy({
      by: ['classId'],
      where: { enrollmentDate: { gte: thirtyDaysAgo } },
      _count: { id: true },
    }),
    prisma.announcement.count(),
    prisma.announcement.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.announcement.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, title: true },
    }),
    prisma.mark.groupBy({
      by: ['studentId'],
      where: { assessment: { isPublished: true } },
      _avg: { marksObtained: true },
      _count: { id: true },
      orderBy: { _avg: { marksObtained: 'desc' } },
      take: 5,
    }),
  ])

  const topStudentIds = topPerformers.map((p) => p.studentId)

  const [topStudents, overdueAmount, classNames] = await Promise.all([
    topStudentIds.length > 0
      ? prisma.student.findMany({
          where: { id: { in: topStudentIds } },
          select: { id: true, firstName: true, lastName: true, admissionNo: true, class: { select: { name: true, section: true } } },
        })
      : [],
    prisma.invoice.aggregate({
      where: { status: { in: ['ISSUED', 'OVERDUE', 'PARTIAL'] } },
      _sum: { totalAmount: true },
    }),
    prisma.class.findMany({
      where: { academicYear: { isActive: true } },
      select: { id: true, name: true, section: true },
    }),
  ])

  const topStudentMap = Object.fromEntries(topStudents.map((s) => [s.id, s]))
  const classNameMap = Object.fromEntries(classNames.map((c) => [c.id, `${c.name} ${c.section}`]))

  const attendanceByStatusMap: Record<string, number> = {}
  attendanceByStatus30d.forEach((a) => { attendanceByStatusMap[a.status] = a._count.id })

  const prevAttendanceByStatusMap: Record<string, number> = {}
  attendanceByStatusPrev30d.forEach((a) => { prevAttendanceByStatusMap[a.status] = a._count.id })

  const current30dTotal = Object.values(attendanceByStatusMap).reduce((s, v) => s + v, 0)
  const prev30dTotal = Object.values(prevAttendanceByStatusMap).reduce((s, v) => s + v, 0)

  const current30dPresent = (attendanceByStatusMap['PRESENT'] ?? 0) + (attendanceByStatusMap['LATE'] ?? 0)
  const prev30dPresent = (prevAttendanceByStatusMap['PRESENT'] ?? 0) + (prevAttendanceByStatusMap['LATE'] ?? 0)
  const current30dRate = current30dTotal > 0 ? Math.round((current30dPresent / current30dTotal) * 100) : 0
  const prev30dRate = prev30dTotal > 0 ? Math.round((prev30dPresent / prev30dTotal) * 100) : 0

  const feeCollectionRate = totalInvoicedAmount._sum.totalAmount
    ? Math.round((Number(totalCollectedAmount._sum.amount ?? 0) / Number(totalInvoicedAmount._sum.totalAmount)) * 100)
    : 0

  const outstandingAmount = Number(overdueAmount._sum.totalAmount ?? 0)
  const totalInvoiced = Number(totalInvoicedAmount._sum.totalAmount ?? 0)
  const totalCollected = Number(totalCollectedAmount._sum.amount ?? 0)
  const pendingPayAmount = Number(pendingPayments._sum.amount ?? 0)

  const studentsPerTeacher = activeTeachers > 0 ? Math.round(totalStudents / activeTeachers) : 0
  const studentsPerClass = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0

  const enrollmentByClassData = enrollmentsByClass.map((e) => ({
    className: classNameMap[e.classId] ?? e.classId,
    count: e._count.id,
  })).sort((a, b) => b.count - a.count)

  const attendanceBreakdown = [
    { label: 'Present', count: attendanceByStatusMap['PRESENT'] ?? 0, color: 'bg-emerald-500', icon: CheckCircle2 },
    { label: 'Late', count: attendanceByStatusMap['LATE'] ?? 0, color: 'bg-amber-500', icon: Clock },
    { label: 'Absent', count: attendanceByStatusMap['ABSENT'] ?? 0, color: 'bg-red-500', icon: XCircle },
    { label: 'Leave', count: attendanceByStatusMap['LEAVE'] ?? 0, color: 'bg-blue-500', icon: MinusCircle },
  ]

  const topRowStats = [
    { label: 'Active Students', value: activeStudents, total: totalStudents, icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active Teachers', value: activeTeachers, total: totalTeachers, icon: UserRound, color: 'text-green-600 dark:text-green-400' },
    { label: 'Active Classes', value: totalClasses, icon: School, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Subjects', value: totalSubjects, icon: BookOpen, color: 'text-amber-600 dark:text-amber-400' },
  ]

  const bottomRowStats = [
    { label: 'Attendance Rate (30d)', value: `${current30dRate}%`, icon: CalendarCheck, color: 'text-teal-600 dark:text-teal-400', trend: current30dRate - prev30dRate },
    { label: 'Fee Collection Rate', value: `${feeCollectionRate}%`, icon: Wallet, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Overdue Invoices', value: overdueInvoices, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', subtitle: formatCurrency(outstandingAmount) },
    { label: 'Pending Payments', value: pendingPayments._count.id, icon: Hourglass, color: 'text-orange-600 dark:text-orange-400', subtitle: formatCurrency(pendingPayAmount) },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Analytics"
        subtitle="School-wide performance and operational overview"
      />

      {/* Row 1: Academic & Staff KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topRowStats.map((s) => (
          <StatBox key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color}>
            {'total' in s && s.total !== undefined && (
              <p className="text-xs text-muted-foreground">of {s.total} total</p>
            )}
          </StatBox>
        ))}
      </div>

      {/* Row 2: Operational KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {bottomRowStats.map((s) => (
          <StatBox key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color}>
            {'trend' in s && s.trend !== undefined && <TrendIndicator current={s.trend + 100} previous={100} />}
            {'subtitle' in s && s.subtitle && (
              <p className="text-xs text-muted-foreground">{s.subtitle}</p>
            )}
          </StatBox>
        ))}
      </div>

      {/* Row 3: Ratios */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="overflow-hidden relative">
          <div className="absolute -top-6 -right-6 size-24 rounded-full bg-primary/5" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">Students per Teacher</CardTitle>
            <UserCheck className="size-4 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-2xl font-bold tracking-tight">{studentsPerTeacher}</div>
            <p className="text-xs text-muted-foreground">{activeStudents} active students / {activeTeachers} active teachers</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden relative">
          <div className="absolute -top-6 -right-6 size-24 rounded-full bg-primary/5" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Class Size</CardTitle>
            <Users className="size-4 text-cyan-600 dark:text-cyan-400" />
          </CardHeader>
          <CardContent className="relative space-y-2">
            <div className="text-2xl font-bold tracking-tight">{studentsPerClass}</div>
            <p className="text-xs text-muted-foreground">{totalStudents} active students / {totalClasses} active classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Attendance Chart + Top Performers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Attendance (Last 7 Days)</CardTitle>
            <TrendIndicator current={current30dRate} previous={prev30dRate} />
          </CardHeader>
          <CardContent className="space-y-4">
            {attendanceByDay.length > 0 ? (
              <div className="flex items-end gap-2 h-40">
                {(() => {
                  const maxCount = Math.max(...attendanceByDay.map((x) => x._count.id))
                  return attendanceByDay.map((d) => {
                    const pct = maxCount > 0 ? (d._count.id / maxCount) * 100 : 0
                    return (
                      <div key={String(d.date)} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">{d._count.id}</span>
                        <div
                          className="w-full bg-gradient-to-t from-teal-600 to-teal-400 dark:from-teal-400 dark:to-teal-300 rounded-t-sm rounded-b-md transition-all duration-500"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                          title={`${d._count.id} records`}
                        />
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                      </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No attendance data for the last 7 days.</p>
            )}

            {/* Attendance breakdown by status (30d) */}
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">30-Day Breakdown</p>
              <div className="grid grid-cols-2 gap-2">
                {attendanceBreakdown.map((a) => (
                  <div key={a.label} className="flex items-center justify-between text-sm rounded-lg bg-muted/30 px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`size-2 rounded-full ${a.color}`} />
                      <span className="text-muted-foreground">{a.label}</span>
                    </div>
                    <span className="font-medium">{a.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-lg">Top Performers</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No published marks yet.</p>
            )}
            {topPerformers.map((p, i) => {
              const s = topStudentMap[p.studentId]
              return (
                <div key={p.studentId} className="flex items-center justify-between text-sm rounded-lg bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Badge variant={i === 0 ? 'default' : 'outline'} className="size-6 justify-center rounded-full">{i + 1}</Badge>
                    <div>
                      <span className="font-medium">{s ? `${s.firstName} ${s.lastName}` : p.studentId}</span>
                      {s?.class && (
                        <p className="text-xs text-muted-foreground">{s.class.name} {s.class.section}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-primary">{Math.round(Number(p._avg.marksObtained))}%</span>
                    <p className="text-[10px] text-muted-foreground">{p._count.id} assessments</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Recent Activity */}
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">Recent Activity (30 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'New Enrollments', value: recentEnrollments, variant: 'secondary' as const, icon: GraduationCap },
              { label: 'Attendance Records', value: current30dTotal.toLocaleString(), variant: 'secondary' as const, icon: CalendarCheck },
              { label: 'Announcements', value: recentAnnouncements, variant: 'secondary' as const, icon: Megaphone },
              { label: 'Invoices Issued', value: totalInvoices, variant: 'secondary' as const, icon: FileText },
              { label: 'Outstanding', value: formatCurrency(outstandingAmount), variant: 'destructive' as const, icon: AlertTriangle },
              { label: 'Pending Payments', value: `${pendingPayments._count.id}`, variant: 'destructive' as const, icon: Hourglass },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <item.icon className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <Badge variant={item.variant} className="text-sm">{item.value}</Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Total enrollments: <strong className="text-foreground">{totalAnnouncements}</strong> announcements</span>
              {lastAnnouncement && (
                <span>Last announcement: <strong className="text-foreground">{lastAnnouncement.title}</strong> ({new Date(lastAnnouncement.createdAt).toLocaleDateString()})</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 6: Financial Analytics */}
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">Financial Analytics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium">Total Invoiced</span>
              </div>
              <p className="text-xl font-bold">{formatCurrency(totalInvoiced)}</p>
              <p className="text-xs text-muted-foreground">{totalInvoices} invoices</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium">Total Collected</span>
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCollected)}</p>
              <p className="text-xs text-muted-foreground">{paidInvoices} paid invoices</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm font-medium">Outstanding</span>
              </div>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(outstandingAmount)}</p>
              <p className="text-xs text-muted-foreground">{overdueInvoices} overdue invoices</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-orange-500/10 p-2">
                  <Hourglass className="size-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-medium">Pending Payments</span>
              </div>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(pendingPayAmount)}</p>
              <p className="text-xs text-muted-foreground">{pendingPayments._count.id} awaiting confirmation</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Collection Progress</span>
                <span className="font-medium">{feeCollectionRate}%</span>
              </div>
              <ProgressBar value={feeCollectionRate} color="bg-emerald-500" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(totalCollected)} collected</span>
                <span>{formatCurrency(totalInvoiced)} total</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 7: Enrollment & Communication Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Enrollment Analytics</CardTitle>
            <TrendIndicator current={recentEnrollments} previous={previousEnrollments} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">New Enrollments (30d)</p>
                <p className="text-xl font-bold">{recentEnrollments}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Previous Period</p>
                <p className="text-xl font-bold text-muted-foreground">{previousEnrollments}</p>
              </div>
            </div>

            {enrollmentByClassData.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enrollments by Class (30d)</p>
                <div className="space-y-2">
                  {enrollmentByClassData.map((e) => (
                    <div key={e.className} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{e.className}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <ProgressBar
                            value={(e.count / Math.max(...enrollmentByClassData.map((x) => x.count))) * 100}
                            color="bg-blue-500"
                          />
                        </div>
                        <span className="font-medium w-6 text-right">{e.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Students</span>
                <span className="font-medium">{activeStudents} / {totalStudents}</span>
              </div>
              <div className="mt-1">
                <ProgressBar value={totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0} color="bg-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader><CardTitle className="text-lg">Communication Analytics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Announcements</p>
                <p className="text-xl font-bold">{totalAnnouncements}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last 30 Days</p>
                <p className="text-xl font-bold">{recentAnnouncements}</p>
              </div>
            </div>

            {lastAnnouncement && (
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Latest Announcement</p>
                <div className="rounded-lg bg-muted/30 px-3 py-2 space-y-1">
                  <p className="text-sm font-medium">{lastAnnouncement.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Published {new Date(lastAnnouncement.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Communication Activity</span>
                <span className="font-medium">{recentAnnouncements} in 30 days</span>
              </div>
              <div className="mt-1">
                <ProgressBar
                  value={totalAnnouncements > 0 ? (recentAnnouncements / totalAnnouncements) * 100 : 0}
                  color="bg-violet-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
