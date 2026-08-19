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
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Attendance' }

export default async function ParentAttendancePage() {
  const user = await requirePage('PARENT')
  const links = await prisma.studentGuardian.findMany({
    where: { parentUserId: user.id },
    select: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
  })
  if (links.length === 0) return <EmptyState icon={AlertCircle} title="No linked students found" description="No students are linked to your parent account." />

  const studentIds = links.map((l) => l.student.id)
  const studentNames = links.map((l) => `${l.student.firstName} ${l.student.lastName}`).join(', ')
  const allHistory = await Promise.all(
    studentIds.map(async (id) => {
      const [history, stats] = await Promise.all([
        getStudentAttendanceHistory(id, 60),
        getStudentAttendanceStats(id),
      ])
      const student = links.find((l) => l.student.id === id)!.student
      return { student, history, stats }
    }),
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Attendance" subtitle={`Attendance records for ${studentNames}.`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Children" value={links.length} icon={Users} iconColor="bg-blue-500/10" subtitle="Linked students" />
        {allHistory.map(({ student, stats }) => (
          <StatCard key={student.id} title={`${student.firstName} ${student.lastName}`} value={`${stats.percentage}%`} icon={TrendingUp} iconColor="bg-emerald-500/10" subtitle={`${stats.present}/${stats.total} present`} />
        ))}
      </div>

      {allHistory.map(({ student, stats, history }) => (
        <div key={student.id} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{student.firstName} {student.lastName}</h2>
            <Badge variant="secondary" className="font-mono text-xs">#{student.admissionNo}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Days" value={stats.total} icon={ClipboardList} iconColor="bg-blue-500/10" />
            <StatCard title="Present" value={stats.present} icon={CheckCircle} iconColor="bg-emerald-500/10" subtitle={`${stats.percentage}%`} />
            <StatCard title="Absent" value={stats.absent} icon={XCircle} iconColor="bg-red-500/10" />
            <StatCard title="Late" value={history.filter((h) => h.status === 'LATE').length} icon={Clock} iconColor="bg-amber-500/10" />
            <StatCard title="Leave" value={history.filter((h) => h.status === 'LEAVE').length} icon={ClipboardList} iconColor="bg-violet-500/10" />
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="border-b border-border/50 px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight">Attendance History</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Last {history.length} records</p>
            </div>
            <div className="glass-table overflow-x-auto">
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
                      <EmptyState icon={ClipboardList} title="No attendance records yet" description="Attendance history will appear here." />
                    </td></tr>
                  )}
                  {history.map((h) => (
                    <tr key={`${h.date}-${h.class.code}`} className="border-b border-border/30 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-3.5 font-medium">{dayjs(h.date).format('DD MMM YYYY')}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{h.class.name} <Badge variant="secondary" className="text-xs">{h.class.section}</Badge></td>
                      <td className="px-6 py-3.5">
                        <Badge variant={attendanceStatusVariant[h.status] ?? 'outline'} className="font-medium">{h.status}</Badge>
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground">{h.note ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
