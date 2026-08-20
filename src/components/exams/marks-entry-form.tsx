'use client'

import { useActionState, useState, useMemo } from 'react'
import { Loader2, Info } from 'lucide-react'

import type { MarksFormState } from '@/lib/exams/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type Student = { id: string; firstName: string; lastName: string; admissionNo: string; rollNo: number | null }
type ExistingMark = { studentId: string; marksObtained: unknown; grade: string | null; gradePoint: unknown }
type GradeScaleEntry = { label: string; minPercent: number; maxPercent: number; points: number; order: number }

function computeGrade(pct: number, scale: GradeScaleEntry[]): { label: string; points: number } {
  for (const g of scale) {
    if (pct >= g.minPercent && pct <= g.maxPercent) return { label: g.label, points: g.points }
  }
  return { label: 'F', points: 0 }
}

function GradePreview({ pct, scale }: { pct: number; scale: GradeScaleEntry[] }) {
  const { label, points } = computeGrade(pct, scale)
  if (isNaN(pct)) return <span className="text-muted-foreground">—</span>
  const variant = label === 'F' ? 'destructive' : label === 'A+' || label === 'A' ? 'default' : 'secondary'
  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant} className="font-medium text-xs">{label}</Badge>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">{points.toFixed(1)}</span>
    </div>
  )
}

export function MarksEntryForm({
  action, assessmentId, students, existingMarks, maxMarks, gradeScale,
}: {
  action: (assessmentId: string, prev: MarksFormState, formData: FormData) => Promise<MarksFormState>
  assessmentId: string
  students: Student[]
  existingMarks: ExistingMark[]
  maxMarks: number
  gradeScale?: GradeScaleEntry[]
}) {
  const marksMap = new Map(existingMarks.map((m) => [m.studentId, { marks: String(m.marksObtained ?? ''), grade: m.grade, gradePoint: m.gradePoint }]))
  const [entries, setEntries] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((s) => [s.id, marksMap.get(s.id)?.marks ?? '']))
  )
  const [state, formAction, pending] = useActionState(action.bind(null, assessmentId), { status: 'idle' })

  const scale = useMemo(() => gradeScale ?? [], [gradeScale])

  const livePreview = useMemo(() => {
    return students.map((s) => {
      const val = Math.round(Number(entries[s.id]))
      if (!val && val !== 0) return null
      const pct = maxMarks > 0 ? (val / maxMarks) * 100 : 0
      return computeGrade(pct, scale)
    })
  }, [entries, students, maxMarks, scale])

  const summary = useMemo(() => {
    const entered = livePreview.filter(Boolean)
    if (entered.length === 0) return null
    const avgGpa = entered.reduce((s, g) => s + g!.points, 0) / entered.length
    const aPlusCount = entered.filter((g) => g!.label === 'A+').length
    const fCount = entered.filter((g) => g!.label === 'F').length
    return { count: entered.length, avgGpa, aPlusCount, fCount }
  }, [livePreview])

  function setMark(studentId: string, val: string) {
    setEntries((prev) => ({ ...prev, [studentId]: val }))
  }

  const serializedEntries = JSON.stringify(
    students.map((s) => ({ studentId: s.id, marksObtained: Math.round(Number(entries[s.id])) || 0 }))
  )

  return (
    <div className="space-y-6">
      <form action={formAction}>
        <input type="hidden" name="entries" value={serializedEntries} />
        {state.message && (
          <div role="alert" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${state.status === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-green-300 bg-green-50 text-green-800'}`}>{state.message}</div>
        )}

        {scale.length > 0 && (
          <div className="mb-4 rounded-xl border border-border/50 bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GPA-5 Grade Scale</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scale.map((g) => (
                <span key={g.label} className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-background/60 px-2.5 py-1 text-xs">
                  <span className="font-medium">{g.label}</span>
                  <span className="text-muted-foreground">{g.minPercent}%–{g.maxPercent}%</span>
                  <span className="font-medium tabular-nums">{g.points}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="glass-table rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Roll</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Student</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Existing</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground" scope="col">Marks (out of {maxMarks})</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground" scope="col">Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const val = Number(entries[s.id])
                const pct = val && maxMarks > 0 ? (val / maxMarks) * 100 : NaN
                const existingGrade = marksMap.get(s.id)?.grade
                const existingGp = marksMap.get(s.id)?.gradePoint
                return (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground">{s.rollNo ?? '—'}</td>
                    <td className="px-3 py-2 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {existingGrade ? (
                        <span>{existingGrade} <span className="tabular-nums">({existingGp != null ? Number(existingGp).toFixed(1) : '—'})</span></span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Input
                        type="number"
                        min={0}
                        max={maxMarks}
                        step={1}
                        value={entries[s.id] ?? ''}
                        onChange={(e) => setMark(s.id, e.target.value)}
                        className="w-20 mx-auto text-center"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {livePreview[i] ? (
                        <GradePreview pct={pct} scale={scale} />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {summary && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{summary.count} entered</span>
            <span className="tabular-nums">Avg GPA: <strong className="text-foreground">{summary.avgGpa.toFixed(2)}</strong></span>
            {summary.aPlusCount > 0 && <span className="text-emerald-600 dark:text-emerald-400">{summary.aPlusCount}× A+</span>}
            {summary.fCount > 0 && <span className="text-destructive">{summary.fCount}× F</span>}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Save marks</Button>
        </div>
      </form>
    </div>
  )
}
