import type { Metadata } from 'next'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { listAttendanceByClass, getRosterForClass } from '@/lib/attendance'
import { markAttendance } from '@/lib/attendance/actions'
import { AttendanceMarkForm } from '@/components/attendance/attendance-mark-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { selectClass } from '@/components/form-helpers'

export const metadata: Metadata = { title: 'Attendance' }

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const classId = typeof params.classId === 'string' ? params.classId : ''
  const date = typeof params.date === 'string' ? params.date : new Date().toISOString().slice(0, 10)

  const classes = await prisma.class.findMany({
    where: { academicYear: { isActive: true } },
    select: { id: true, name: true, section: true, code: true },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  })

  let roster: Awaited<ReturnType<typeof getRosterForClass>> = []
  let existing: Awaited<ReturnType<typeof listAttendanceByClass>> = []

  if (classId) {
    ;[roster, existing] = await Promise.all([
      getRosterForClass(classId),
      listAttendanceByClass({ classId, date }),
    ])
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Attendance"
        subtitle="Mark and view daily attendance by class."
      />

      <form action="/admin/attendance" method="GET" className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="classId">Class</Label>
          <select id="classId" name="classId" className={`ml-2 ${selectClass}`} defaultValue={classId} required>
            <option value="" disabled>Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · Section {c.section}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <input type="date" id="date" name="date" defaultValue={date} className={`ml-2 ${selectClass}`} />
        </div>
        <Button type="submit" variant="outline">Load</Button>
      </form>

      {classId && roster.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mark attendance — {classes.find((c) => c.id === classId)?.name} · Section {classes.find((c) => c.id === classId)?.section} ({date})</span>
              <Badge variant="secondary">{roster.length} students</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceMarkForm
              action={markAttendance}
              students={roster.map((s) => ({ ...s }))}
              classId={classId}
              date={date}
            />
          </CardContent>
        </Card>
      )}

      {classId && existing.length > 0 && !roster.length && (
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Existing records — {date}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="glass-table rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Student</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Marked by</th>
                </tr>
              </thead>
              <tbody>
                {existing.map((a) => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2 font-medium">{a.student.firstName} {a.student.lastName}</td>
                    <td className="px-3 py-2"><Badge variant={a.status === 'PRESENT' ? 'default' : a.status === 'ABSENT' ? 'destructive' : 'secondary'}>{a.status}</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground">{a.markedBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
