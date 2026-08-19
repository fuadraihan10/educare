import type { Metadata } from 'next'
import Link from 'next/link'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, CalendarCheck, FileText, Wallet, CalendarDays, Megaphone, AlertTriangle } from 'lucide-react'
import dayjs from 'dayjs'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function ParentDashboard() {
  const user = await requirePage('PARENT')
  const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)

  const children = await prisma.studentGuardian.findMany({
    where: { parentUserId: user.id },
    include: {
      student: {
        include: { class: true },
      },
    },
  })

  const childData = await Promise.all(
    children.map(async ({ student }) => {
      const [attendanceTotal, attendancePresent, marksAgg, latestInvoice, absentCount] = await Promise.all([
        prisma.attendance.count({ where: { studentId: student.id } }),
        prisma.attendance.count({
          where: { studentId: student.id, status: { in: ['PRESENT', 'LATE'] } },
        }),
        prisma.mark.aggregate({
          where: { studentId: student.id, assessment: { isPublished: true } },
          _avg: { marksObtained: true },
        }),
        prisma.invoice.findFirst({
          where: { studentId: student.id, status: { in: ['ISSUED', 'OVERDUE', 'PARTIAL'] } },
          orderBy: { dueDate: 'asc' },
          select: { invoiceNo: true, totalAmount: true, dueDate: true, status: true },
        }),
        prisma.attendance.count({
          where: { studentId: student.id, status: 'ABSENT', date: { gte: thirtyDaysAgo } },
        }),
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

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Your children at a glance"
      />

      {children.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No children linked"
          description="No children are linked to this account yet. Contact the school office."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {childData.map(({ student, attendancePct, avg, latestInvoice, absentCount }, i) => (
          <Card key={student.id} className={`overflow-hidden animate-fade-in stagger-${i + 1}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <GraduationCap className="size-4 text-primary" />
                </div>
                <span className="font-semibold">{student.firstName} {student.lastName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {student.class?.name} · Section {student.class?.section} · Roll {student.rollNo}
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="glass rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/30">
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">{attendancePct === null ? '—' : `${attendancePct}%`}</p>
                </div>
                <div className="glass rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/30">
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">{avg !== null ? `${Math.round(Number(avg))}%` : '—'}</p>
                </div>
                <div className="glass rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/30">
                  <p className="text-xs text-muted-foreground">Fees</p>
                  <p className="font-semibold">{latestInvoice ? dayjs(latestInvoice.dueDate).format('DD MMM') : 'Paid'}</p>
                </div>
              </div>
              {absentCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive">
                  <AlertTriangle className="size-3 shrink-0" />
                  {absentCount} absent in last 30 days
                </div>
              )}
              {latestInvoice && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Invoice due:</span>
                  <Badge variant={latestInvoice.status === 'OVERDUE' ? 'destructive' : 'secondary'}>{latestInvoice.invoiceNo}</Badge>
                  <span>{dayjs(latestInvoice.dueDate).format('DD MMM')}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" className="transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]" render={<Link href="/parent/attendance" />}><CalendarCheck className="mr-1 size-3 text-emerald-500" />Attendance</Button>
                <Button variant="outline" size="sm" className="transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]" render={<Link href="/parent/grades" />}><FileText className="mr-1 size-3 text-blue-500" />Results</Button>
                <Button variant="outline" size="sm" className="transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]" render={<Link href="/parent/fees" />}><Wallet className="mr-1 size-3 text-rose-500" />Fees</Button>
                <Button variant="outline" size="sm" className="transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]" render={<Link href="/parent/timetable" />}><CalendarDays className="mr-1 size-3 text-amber-500" />Timetable</Button>
                <Button variant="outline" size="sm" className="transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]" render={<Link href="/parent/announcements" />}><Megaphone className="mr-1 size-3 text-violet-500" />News</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
