import Link from 'next/link'
import type { Metadata } from 'next'
import { Plus, Trash2, CalendarDays } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { listTimetableByClass } from '@/lib/timetable'
import { deleteTimetableEntry } from '@/lib/timetable/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { selectClass } from '@/components/form-helpers'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Timetable' }

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const classId = typeof params.classId === 'string' ? params.classId : ''

  const classes = await prisma.class.findMany({
    where: { academicYear: { isActive: true } },
    select: { id: true, name: true, section: true, code: true },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  })

  const entries = classId ? await listTimetableByClass({ classId }) : []

  const grouped = DAY_ORDER.filter((d) => entries.some((e) => e.dayOfWeek === d)).map((d) => ({
    day: d,
    entries: entries.filter((e) => e.dayOfWeek === d).sort((a, b) => a.period - b.period),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Timetable"
        subtitle="Weekly class schedule management."
        action={<Button render={<Link href="/admin/timetable/new" />}><Plus /> Add entry</Button>}
      />

      <form action="/admin/timetable" method="GET" className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="classId">Class</Label>
          <select id="classId" name="classId" className={`ml-2 ${selectClass}`} defaultValue={classId} required>
            <option value="" disabled>Select class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · Section {c.section}</option>)}
          </select>
        </div>
        <Button type="submit" variant="outline">Load</Button>
      </form>

      {!classId && (
        <EmptyState
          icon={CalendarDays}
          title="Select a class"
          description="Choose a class from the dropdown above to view its timetable."
        />
      )}

      {classId && grouped.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No timetable entries"
          description="No timetable entries have been added for this class yet."
        />
      )}

      {classId && grouped.length > 0 && (
        <div className="space-y-4">
          {grouped.map(({ day, entries }) => (
            <Card key={day} className="overflow-hidden">
              <CardHeader><CardTitle className="text-lg">{day}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="glass-table rounded-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Period</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Time</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Subject</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Teacher</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Room</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground" scope="col">Action</th>
                  </tr></thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-3 py-2">{e.period}</td>
                        <td className="px-3 py-2 text-xs">{e.startTime} – {e.endTime}</td>
                        <td className="px-3 py-2"><Badge variant="secondary">{e.subject.code}</Badge> {e.subject.name}</td>
                        <td className="px-3 py-2 text-sm">{e.teacher.name}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{e.room ?? '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <form action={deleteTimetableEntry.bind(null, e.id)} className="inline-block">
                            <Button variant="ghost" size="icon" type="submit" aria-label="Delete entry"><Trash2 className="text-destructive size-4" /></Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
