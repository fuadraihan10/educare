'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { ClassFormState } from '@/lib/classes/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'

export type ClassFormInitial = {
  name: string
  section: string
  code: string
  room: string | null
  academicYearId: string
  classTeacherId: string | null
}

export function ClassForm({
  action,
  initial,
  submitLabel,
  years,
  teachers,
}: {
  action: (prev: ClassFormState, formData: FormData) => Promise<ClassFormState>
  initial?: ClassFormInitial
  submitLabel: string
  years: { id: string; name: string; isActive: boolean }[]
  teachers: { id: string; name: string; employeeId: string }[]
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="space-y-6 animate-fade-in">
      {state.message && state.status === 'error' && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.name}>
            <Label htmlFor="name">Class name *</Label>
            <Input id="name" name="name" defaultValue={initial?.name} placeholder="e.g. Grade 6" required />
          </Field>
          <Field error={errors.section}>
            <Label htmlFor="section">Section *</Label>
            <Input id="section" name="section" defaultValue={initial?.section} placeholder="e.g. A" required />
          </Field>
          <Field error={errors.code}>
            <Label htmlFor="code">Code *</Label>
            <Input id="code" name="code" defaultValue={initial?.code} placeholder="e.g. G6-A" required />
          </Field>
          <Field error={errors.room}>
            <Label htmlFor="room">Room</Label>
            <Input id="room" name="room" defaultValue={initial?.room ?? ''} placeholder="e.g. Room 101" />
          </Field>
          <Field error={errors.academicYearId}>
            <Label htmlFor="academicYearId">Academic year *</Label>
            <select id="academicYearId" name="academicYearId" className={selectClass} defaultValue={initial?.academicYearId || years.find((y) => y.isActive)?.id || ''} required>
              <option value="" disabled>Select year…</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}{y.isActive ? ' (active)' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field error={errors.classTeacherId}>
            <Label htmlFor="classTeacherId">Class teacher</Label>
            <select id="classTeacherId" name="classTeacherId" className={selectClass} defaultValue={initial?.classTeacherId ?? ''}>
              <option value="">Not assigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.employeeId})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
