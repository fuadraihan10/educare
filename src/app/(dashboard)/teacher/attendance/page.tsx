import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { getRosterForClass } from '@/lib/attendance'
import { markAttendance } from '@/lib/attendance/actions'
import { AttendanceMarkForm } from '@/components/attendance/attendance-mark-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { selectClass } from '@/components/form-helpers'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { StatCard } from '@/components/stat-card'
import { Users, Calendar, AlertCircle, UserCheck } from 'lucide-react'

export const metadata: Metadata = { title: 'Mark Attendance' }

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>
}) {
  const user = await requirePage('TEACHER')
  const params = await searchParams
  const classId = typeof params.classId === 'string' ? params.classId : ''
  const date = typeof params.date === 'string' ? params.date : new Date().toISOString().slice(0, 10)

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })

  const classes = teacher
    ? await prisma.class.findMany({
        where: { academicYear: { isActive: true }, assignments: { some: { teacherId: teacher.id } } },
        select: { id: true, name: true, section: true, code: true },
        orderBy: [{ name: 'asc' }, { section: 'asc' }],
        distinct: ['id'],
      })
    : []

  let roster: Awaited<ReturnType<typeof getRosterForClass>> = []
  const validClassId = classes.some((c) => c.id === classId) ? classId : ''
  if (validClassId) {
    roster = await getRosterForClass(validClassId)
  }

  const selectedClass = classes.find((c) => c.id === validClassId)

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Mark Attendance" subtitle="Select a class and date to mark attendance." />

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Select Class & Date</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Choose the class and date to begin</p>
        </div>
        <div className="p-6">
          <form action="/teacher/attendance" method="GET" className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="classId" className="text-sm font-medium">Class</Label>
              <select id="classId" name="classId" className={`mt-1.5 w-full ${selectClass}`} defaultValue={validClassId} required>
                <option value="" disabled>Select class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · Section {c.section}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="date" className="text-sm font-medium">Date</Label>
              <input type="date" id="date" name="date" defaultValue={date} className={`mt-1.5 w-full ${selectClass}`} />
            </div>
            <Button type="submit">
              <UserCheck className="size-4 mr-2" />
              Load Roster
            </Button>
          </form>
        </div>
      </div>

      {validClassId && roster.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Class" value={selectedClass?.name ?? '—'} icon={Users} iconColor="bg-blue-500/10" subtitle={`Section ${selectedClass?.section ?? ''}`} />
            <StatCard title="Students" value={roster.length} icon={Users} iconColor="bg-emerald-500/10" subtitle="In this class" />
            <StatCard title="Date" value={date} icon={Calendar} iconColor="bg-violet-500/10" subtitle="Attendance date" />
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Student Roster</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {selectedClass?.name} · Section {selectedClass?.section} — {date}
                </p>
              </div>
              <Badge variant="secondary" className="font-medium">{roster.length} students</Badge>
            </div>
            <div className="p-6">
              <AttendanceMarkForm action={markAttendance} students={roster} classId={validClassId} date={date} />
            </div>
          </div>
        </>
      )}

      {validClassId && roster.length === 0 && (
        <EmptyState icon={AlertCircle} title="No students found" description="The selected class has no students enrolled." />
      )}
    </div>
  )
}
