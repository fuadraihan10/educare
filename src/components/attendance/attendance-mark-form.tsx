'use client'

import { useActionState, useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

import type { AttendanceFormState } from '@/lib/attendance/actions'
import { Button } from '@/components/ui/button'


type Student = { id: string; firstName: string; lastName: string; admissionNo: string; rollNo: number | null }

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const
const statusShort: Record<string, string> = { PRESENT: 'P', ABSENT: 'A', LATE: 'L', LEAVE: 'LV' }
const statusColors: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm shadow-emerald-500/10 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
  ABSENT: 'bg-red-100 text-red-800 border-red-300 shadow-sm shadow-red-500/10 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
  LATE: 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm shadow-amber-500/10 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  LEAVE: 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm shadow-blue-500/10 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
}

export function AttendanceMarkForm({
  action,
  students,
  classId,
  date,
}: {
  action: (prev: AttendanceFormState, formData: FormData) => Promise<AttendanceFormState>
  students: Student[]
  classId: string
  date: string
}) {
  const [entries, setEntries] = useState<Record<string, string>>(
    () => Object.fromEntries(students.map((s) => [s.id, 'PRESENT']))
  )
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })

  function setStatus(studentId: string, status: string) {
    setEntries((prev) => ({ ...prev, [studentId]: status }))
  }

  const serializedEntries = JSON.stringify(
    students.map((s) => ({ studentId: s.id, status: entries[s.id] ?? 'PRESENT' }))
  )

  const presentCount = Object.values(entries).filter((v) => v === 'PRESENT').length

  return (
    <form action={formAction}>
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="entries" value={serializedEntries} />

      {state.message && (
        <div role="alert" className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${state.status === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-300/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
          {state.status === 'error' ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
          {state.message}
        </div>
      )}

      {/* Desktop: Table layout */}
      <div className="glass-card overflow-hidden rounded-2xl hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roll</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admission #</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-border/30 last:border-0 transition-colors hover:bg-muted/20">
                <td className="px-4 py-2.5 text-muted-foreground">{s.rollNo ?? '—'}</td>
                <td className="px-4 py-2.5 font-medium">{s.firstName} {s.lastName}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-center gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setStatus(s.id, opt)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${entries[s.id] === opt || (!entries[s.id] && opt === 'PRESENT') ? `${statusColors[opt]} scale-105` : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card layout */}
      <div className="space-y-2 md:hidden">
        {students.map((s) => (
          <div key={s.id} className="glass-card rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {s.rollNo ?? '?'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{s.admissionNo}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(s.id, opt)}
                  className={`rounded-lg border px-1 py-1.5 text-[10px] font-semibold transition-all ${entries[s.id] === opt || (!entries[s.id] && opt === 'PRESENT') ? `${statusColors[opt]} scale-[1.02]` : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                >
                  <span className="hidden min-[400px]:inline">{opt}</span>
                  <span className="min-[400px]:hidden">{statusShort[opt]}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Button type="submit" disabled={pending} className="transition-all">
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Saving...
            </>
          ) : (
            'Save attendance'
          )}
        </Button>
        <div className="rounded-lg bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          {students.length} students — Present: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{presentCount}</span>
        </div>
      </div>
    </form>
  )
}
