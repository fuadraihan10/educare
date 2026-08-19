import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { listTimetableByTeacher } from '@/lib/timetable'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { AlertCircle, CalendarDays, Clock, MapPin, Users } from 'lucide-react'

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const DAY_COLORS: Record<string, string> = {
  MONDAY: 'bg-blue-500/10 border-blue-500/20',
  TUESDAY: 'bg-emerald-500/10 border-emerald-500/20',
  WEDNESDAY: 'bg-amber-500/10 border-amber-500/20',
  THURSDAY: 'bg-violet-500/10 border-violet-500/20',
  FRIDAY: 'bg-rose-500/10 border-rose-500/20',
  SATURDAY: 'bg-pink-500/10 border-pink-500/20',
  SUNDAY: 'bg-slate-500/10 border-slate-500/20',
}

export const metadata: Metadata = { title: 'My Timetable' }

export default async function TeacherTimetablePage() {
  const user = await requirePage('TEACHER')
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } })
  if (!teacher) return <EmptyState icon={AlertCircle} title="Teacher profile not found" description="Your teacher profile could not be loaded." />

  const entries = await listTimetableByTeacher(teacher.id)
  const grouped = DAY_ORDER.filter((d) => entries.some((e) => e.dayOfWeek === d)).map((d) => ({
    day: d,
    entries: entries.filter((e) => e.dayOfWeek === d).sort((a, b) => a.period - b.period),
  }))

  const totalPeriods = entries.length

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="My Timetable" subtitle={`Weekly teaching schedule · ${totalPeriods} period${totalPeriods !== 1 ? 's' : ''}`} />

      {grouped.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No timetable entries" description="Your teaching timetable is empty." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map(({ day, entries }) => (
            <div key={day} className={`glass-card rounded-2xl overflow-hidden border ${DAY_COLORS[day] ?? 'bg-muted/30 border-border/50'}`}>
              <div className="border-b border-border/30 px-5 py-3.5">
                <h3 className="text-base font-semibold tracking-tight">{day.charAt(0) + day.slice(1).toLowerCase()}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{entries.length} period{entries.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="divide-y divide-border/30">
                {entries.map((e) => (
                  <div key={e.id} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="secondary" className="text-[0.65rem] font-semibold px-2 py-0.5">Period {e.period}</Badge>
                      <span className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                        <Clock className="size-3" />
                        {e.startTime} – {e.endTime}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-1">{e.subject.name}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {e.class.name} · Section {e.class.section}
                      </span>
                      {e.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {e.room}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
