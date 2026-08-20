import type { Metadata } from 'next'
import Link from 'next/link'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, CalendarCheck, FileText, Wallet, CalendarDays, Megaphone, AlertTriangle, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import dayjs from 'dayjs'

export const metadata: Metadata = { title: 'Dashboard' }

const quickLinks = [
  { href: '/parent/attendance', label: 'Attendance', desc: 'View attendance records', icon: CalendarCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', hoverBorder: 'hover:border-emerald-500/30' },
  { href: '/parent/grades', label: 'Results', desc: 'Exam marks & grades', icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', hoverBorder: 'hover:border-blue-500/30' },
  { href: '/parent/fees', label: 'Fees', desc: 'Invoices & payments', icon: Wallet, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', hoverBorder: 'hover:border-rose-500/30' },
  { href: '/parent/timetable', label: 'Timetable', desc: 'Class schedule', icon: CalendarDays, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', hoverBorder: 'hover:border-amber-500/30' },
  { href: '/parent/announcements', label: 'News', desc: 'School announcements', icon: Megaphone, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', hoverBorder: 'hover:border-violet-500/30' },
]

export default async function ParentDashboard() {
  const user = await requirePage('PARENT')
  const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)

  const children = await prisma.studentGuardian.findMany({
    where: { parentUserId: user.id },
    include: { student: { include: { class: true } } },
  })

  const childData = await Promise.all(
    children.map(async ({ student }) => {
      const [attendanceTotal, attendancePresent, marksAgg, latestInvoice, absentCount] = await Promise.all([
        prisma.attendance.count({ where: { studentId: student.id } }),
        prisma.attendance.count({ where: { studentId: student.id, status: { in: ['PRESENT', 'LATE'] } } }),
        prisma.mark.aggregate({ where: { studentId: student.id, assessment: { isPublished: true } }, _avg: { marksObtained: true } }),
        prisma.invoice.findFirst({ where: { studentId: student.id, status: { in: ['ISSUED', 'OVERDUE', 'PARTIAL'] } }, orderBy: { dueDate: 'asc' }, select: { invoiceNo: true, totalAmount: true, dueDate: true, status: true } }),
        prisma.attendance.count({ where: { studentId: student.id, status: 'ABSENT', date: { gte: thirtyDaysAgo } } }),
      ])
      return {
        student,
        attendancePct: attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null,
        avg: marksAgg._avg.marksObtained,
        latestInvoice,
        absentCount,
      }
    }),
  )

  const staggerClasses = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5']

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {children.length} child{children.length !== 1 ? 'ren' : ''} enrolled
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No children linked" description="No children are linked to this account yet. Contact the school office." />
      ) : (
        <>
          {/* Quick Links */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Quick links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {quickLinks.map((l, i) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`glass-card group flex items-center gap-3 rounded-xl p-4 text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] hover:text-foreground border border-transparent ${l.hoverBorder} animate-fade-in ${staggerClasses[i]}`}
                  >
                    <div className={`rounded-xl ${l.bg} p-2.5 transition-transform duration-200 group-hover:scale-105`}>
                      <l.icon className={`size-4.5 ${l.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-sm">{l.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{l.desc}</div>
                    </div>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Children Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">My Children</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {childData.map(({ student, attendancePct, avg, latestInvoice, absentCount }, i) => (
                <Card key={student.id} className="overflow-hidden group animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2.5">
                        <div className="rounded-xl bg-primary/10 p-2 group-hover:scale-105 transition-transform duration-200">
                          <GraduationCap className="size-4 text-primary" />
                        </div>
                        <span className="font-semibold">{student.firstName} {student.lastName}</span>
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">Roll {student.rollNo}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-[44px]">
                      {student.class?.name} · Section {student.class?.section}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-3 py-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Attendance</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{attendancePct === null ? '—' : `${attendancePct}%`}</p>
                      </div>
                      <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 px-3 py-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Average</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{avg !== null ? `${Math.round(Number(avg))}%` : '—'}</p>
                      </div>
                      <div className="rounded-xl bg-rose-500/5 border border-rose-500/10 px-3 py-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fees</p>
                        <p className="text-lg font-bold">{latestInvoice ? formatCurrency(Number(latestInvoice.totalAmount)) : 'Paid'}</p>
                      </div>
                    </div>

                    {/* Alerts */}
                    {absentCount > 0 && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive">
                        <AlertTriangle className="size-3 shrink-0" />
                        {absentCount} absent in last 30 days
                      </div>
                    )}

                    {latestInvoice && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Invoice due:</span>
                        <Badge variant={latestInvoice.status === 'OVERDUE' ? 'destructive' : 'secondary'} className="text-[10px]">{latestInvoice.invoiceNo}</Badge>
                        <span>{dayjs(latestInvoice.dueDate).format('DD MMM')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
