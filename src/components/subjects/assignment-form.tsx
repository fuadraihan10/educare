'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { AssignmentFormState } from '@/lib/subjects/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'

export function AssignmentForm({
  action,
  submitLabel,
  classes,
  subjects,
  teachers,
  years,
}: {
  action: (prev: AssignmentFormState, formData: FormData) => Promise<AssignmentFormState>
  submitLabel: string
  classes: { id: string; name: string; section: string; code: string }[]
  subjects: { id: string; name: string; code: string }[]
  teachers: { id: string; name: string; employeeId: string }[]
  years: { id: string; name: string; isActive: boolean }[]
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="space-y-6 animate-fade-in">
      {state.message && state.status === 'error' && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.classId}>
          <Label htmlFor="classId">Class *</Label>
          <select id="classId" name="classId" className={selectClass} required>
            <option value="" disabled>Select class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name} {c.section}</option>
            ))}
          </select>
        </Field>
        <Field error={errors.subjectId}>
          <Label htmlFor="subjectId">Subject *</Label>
          <select id="subjectId" name="subjectId" className={selectClass} required>
            <option value="" disabled>Select subject…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>
        </Field>
        <Field error={errors.teacherId}>
          <Label htmlFor="teacherId">Teacher *</Label>
          <select id="teacherId" name="teacherId" className={selectClass} required>
            <option value="" disabled>Select teacher…</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.employeeId})</option>
            ))}
          </select>
        </Field>
        <Field error={errors.academicYearId}>
          <Label htmlFor="academicYearId">Academic year *</Label>
          <select id="academicYearId" name="academicYearId" className={selectClass} defaultValue={years.find((y) => y.isActive)?.id || ''} required>
            <option value="" disabled>Select year…</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (active)' : ''}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
