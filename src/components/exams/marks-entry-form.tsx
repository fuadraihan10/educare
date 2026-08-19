'use client'

import { useActionState, useState } from 'react'
import { Loader2 } from 'lucide-react'

import type { MarksFormState } from '@/lib/exams/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Student = { id: string; firstName: string; lastName: string; admissionNo: string; rollNo: number | null }
type ExistingMark = { studentId: string; marksObtained: unknown; grade: string | null }

export function MarksEntryForm({
  action, assessmentId, students, existingMarks, maxMarks,
}: {
  action: (assessmentId: string, prev: MarksFormState, formData: FormData) => Promise<MarksFormState>
  assessmentId: string
  students: Student[]
  existingMarks: ExistingMark[]
  maxMarks: number
}) {
  const marksMap = new Map(existingMarks.map((m) => [m.studentId, { marks: String(m.marksObtained ?? ''), grade: m.grade }]))
  const [entries, setEntries] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((s) => [s.id, marksMap.get(s.id)?.marks ?? '']))
  )
  const [state, formAction, pending] = useActionState(action.bind(null, assessmentId), { status: 'idle' })

  function setMark(studentId: string, val: string) {
    setEntries((prev) => ({ ...prev, [studentId]: val }))
  }

  const serializedEntries = JSON.stringify(
    students.map((s) => ({ studentId: s.id, marksObtained: Number(entries[s.id]) || 0 }))
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="entries" value={serializedEntries} />
      {state.message && (
        <div role="alert" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${state.status === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-green-300 bg-green-50 text-green-800'}`}>{state.message}</div>
      )}
      <div className="glass-table rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Roll</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Student</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Existing</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground" scope="col">Marks (out of {maxMarks})</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="px-3 py-2 text-muted-foreground">{s.rollNo ?? '—'}</td>
                <td className="px-3 py-2 font-medium">{s.firstName} {s.lastName}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{marksMap.get(s.id)?.grade ?? '—'}</td>
                <td className="px-3 py-2 text-center">
                  <Input type="number" min={0} max={maxMarks} value={entries[s.id] ?? ''} onChange={(e) => setMark(s.id, e.target.value)} className="w-20 mx-auto text-center" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Save marks</Button>
      </div>
    </form>
  )
}
