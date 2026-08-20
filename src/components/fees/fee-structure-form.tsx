'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { FeeStructureFormState } from '@/lib/fees/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field } from '@/components/form-helpers'

export function FeeStructureForm({
  action,
  submitLabel,
  initialData,
}: {
  action: (prev: FeeStructureFormState, formData: FormData) => Promise<FeeStructureFormState>
  submitLabel: string
  initialData?: { name: string; description: string; amount: number }
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="space-y-6">
      {state.message && state.status === 'error' && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state.message && state.status === 'success' && (
        <p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
          {state.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.name}>
          <Label htmlFor="fs-name">Fee name *</Label>
          <Input id="fs-name" name="name" placeholder="e.g. Tuition Fee, Lab Fee" defaultValue={initialData?.name} required />
        </Field>
        <Field error={errors.amount}>
          <Label htmlFor="fs-amount">Amount *</Label>
          <Input id="fs-amount" name="amount" type="number" min="0" step="0.01" placeholder="0.00" defaultValue={initialData?.amount ?? ''} required />
        </Field>
      </div>
      <Field error={errors.description}>
        <Label htmlFor="fs-desc">Reason / Description</Label>
        <Input id="fs-desc" name="description" placeholder="Optional description or reason for this fee" defaultValue={initialData?.description} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
