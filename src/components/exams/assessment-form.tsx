'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { AssessmentFormState } from '@/lib/exams/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'

export function AssessmentForm({
  action, submitLabel, classes, subjects, terms,
}: {
  action: (prev: AssessmentFormState, formData: FormData) => Promise<AssessmentFormState>
  submitLabel: string
  classes: { id: string; name: string; section: string; code: string }[]
  subjects: { id: string; name: string; code: string }[]
  terms: { id: string; name: string; isActive: boolean }[]
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="space-y-6 animate-fade-in">
      {state.message && state.status === 'error' && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.name}>
          <Label htmlFor="name">Assessment name *</Label>
          <Input id="name" name="name" placeholder="e.g. Chapter Quiz 1" required />
        </Field>
        <Field error={errors.type}>
          <Label htmlFor="type">Type *</Label>
          <select id="type" name="type" className={selectClass} defaultValue="QUIZ" required>
            <option value="QUIZ">Quiz</option>
            <option value="CLASSWORK">Classwork</option>
            <option value="HOMEWORK">Homework</option>
            <option value="MIDTERM">Midterm</option>
            <option value="FINAL">Final</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
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
        <Field error={errors.termId}>
          <Label htmlFor="termId">Term *</Label>
          <select id="termId" name="termId" className={selectClass} defaultValue={terms.find((t) => t.isActive)?.id || ''} required>
            <option value="" disabled>Select term…</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isActive ? ' (active)' : ''}</option>)}
          </select>
        </Field>
        <Field error={errors.maxMarks}>
          <Label htmlFor="maxMarks">Max marks *</Label>
          <Input id="maxMarks" name="maxMarks" type="number" placeholder="e.g. 100" required />
        </Field>
        <Field error={errors.weight}>
          <Label htmlFor="weight">Weight</Label>
          <Input id="weight" name="weight" type="number" placeholder="Default: 1" />
        </Field>
        <Field error={errors.date}>
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}{submitLabel}</Button>
      </div>
    </form>
  )
}
