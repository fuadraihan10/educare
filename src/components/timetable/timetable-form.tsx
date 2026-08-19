'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { TimetableFormState } from '@/lib/timetable/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'

export function TimetableForm({
  action, submitLabel, classes, subjects, teachers, terms,
}: {
  action: (prev: TimetableFormState, formData: FormData) => Promise<TimetableFormState>
  submitLabel: string
  classes: { id: string; name: string; section: string; code: string }[]
  subjects: { id: string; name: string; code: string }[]
  teachers: { id: string; name: string; employeeId: string }[]
  terms: { id: string; name: string; isActive: boolean }[]
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="space-y-6 animate-fade-in">
      {state.message && state.status === 'error' && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.classId}>
          <Label htmlFor="classId">Class *</Label>
          <select id="classId" name="classId" className={selectClass} required>
            <option value="" disabled>Select class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name} {c.section}</option>)}
          </select>
        </Field>
        <Field error={errors.subjectId}>
          <Label htmlFor="subjectId">Subject *</Label>
          <select id="subjectId" name="subjectId" className={selectClass} required>
            <option value="" disabled>Select subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>
        </Field>
        <Field error={errors.teacherId}>
          <Label htmlFor="teacherId">Teacher *</Label>
          <select id="teacherId" name="teacherId" className={selectClass} required>
            <option value="" disabled>Select teacher…</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.employeeId})</option>)}
          </select>
        </Field>
        <Field error={errors.termId}>
          <Label htmlFor="termId">Term *</Label>
          <select id="termId" name="termId" className={selectClass} defaultValue={terms.find((t) => t.isActive)?.id || ''} required>
            <option value="" disabled>Select term…</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isActive ? ' (active)' : ''}</option>)}
          </select>
        </Field>
        <Field error={errors.dayOfWeek}>
          <Label htmlFor="dayOfWeek">Day *</Label>
          <select id="dayOfWeek" name="dayOfWeek" className={selectClass} required>
            <option value="" disabled>Select day…</option>
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field error={errors.period}>
          <Label htmlFor="period">Period *</Label>
          <Input id="period" name="period" type="number" min={1} placeholder="e.g. 1" required />
        </Field>
        <Field error={errors.startTime}>
          <Label htmlFor="startTime">Start time *</Label>
          <Input id="startTime" name="startTime" type="time" required />
        </Field>
        <Field error={errors.endTime}>
          <Label htmlFor="endTime">End time *</Label>
          <Input id="endTime" name="endTime" type="time" required />
        </Field>
        <Field error={errors.room}>
          <Label htmlFor="room">Room</Label>
          <Input id="room" name="room" placeholder="Optional" />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}{submitLabel}</Button>
      </div>
    </form>
  )
}
