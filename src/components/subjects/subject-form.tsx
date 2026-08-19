'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { SubjectFormState } from '@/lib/subjects/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field } from '@/components/form-helpers'

export type SubjectFormInitial = {
  name: string
  code: string
  description: string | null
}

export function SubjectForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: SubjectFormState, formData: FormData) => Promise<SubjectFormState>
  initial?: SubjectFormInitial
  submitLabel: string
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.name}>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" defaultValue={initial?.name} placeholder="e.g. Mathematics" required />
        </Field>
        <Field error={errors.code}>
          <Label htmlFor="code">Code *</Label>
          <Input id="code" name="code" defaultValue={initial?.code} placeholder="e.g. MATH" required />
        </Field>
        <Field error={errors.description}>
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" defaultValue={initial?.description ?? ''} placeholder="Optional description" />
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
