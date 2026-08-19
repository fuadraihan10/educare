import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { getStudentAttendanceHistory, getStudentAttendanceStats } from '@/lib/attendance'
import { Badge } from '@/components/ui/badge'
import { attendanceStatusVariant } from '@/lib/status-variants'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { StatCard } from '@/components/stat-card'
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'My Attendance' }

export default async function StudentAttendancePage() {
  const user = await requirePage('STUDENT')
  const student = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } })
  if (!student) return <EmptyState icon={AlertCircle} title="Student profile not found" description="Your student profile could not be loaded." />

  const [history, stats] = await Promise.all([
    getStudentAttendanceHistory(student.id, 60),
    getStudentAttendanceStats(student.id),
  ])

  const late = history.filter((h) => h.status === 'LATE').length
  const leave = history.filter((h) => h.status === 'LEAVE').length

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="My Attendance" subtitle="Your attendance history and statistics." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Days" value={stats.total} icon={ClipboardList} iconColor="bg-blue-500/10" />
        <StatCard title="Present" value={stats.present} icon={CheckCircle} iconColor="bg-emerald-500/10" subtitle={`${stats.percentage}% attendance`} />
        <StatCard title="Absent" value={stats.absent} icon={XCircle} iconColor="bg-red-500/10" />
        <StatCard title="Late" value={late} icon={Clock} iconColor="bg-amber-500/10" />
        <StatCard title="Attendance" value={`${stats.percentage}%`} icon={TrendingUp} iconColor="bg-violet-500/10" subtitle={`${leave} leave(s)`} />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Attendance History</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Last {history.length} records</p>
        </div>
        <div className="glass-table rounded-none overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Class</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center">
                  <EmptyState icon={ClipboardList} title="No attendance records yet" description="Your attendance history will appear here." />
                </td></tr>
              )}
              {history.map((h) => (
                <tr key={`${h.date}-${h.class.code}`} className="border-b border-border/30 last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3.5 font-medium">{dayjs(h.date).format('DD MMM YYYY')}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{h.class.name} <Badge variant="secondary" className="text-xs">{h.class.section}</Badge></td>
                  <td className="px-6 py-3.5">
                    <Badge variant={attendanceStatusVariant[h.status] ?? 'outline'} className="font-medium">
                      {h.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground">{h.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
