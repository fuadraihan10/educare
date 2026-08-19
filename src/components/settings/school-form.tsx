'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { SchoolFormState } from '@/lib/settings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'

export function SchoolForm({
  action, school,
}: {
  action: (prev: SchoolFormState, formData: FormData) => Promise<SchoolFormState>
  school: { name: string; shortName: string; address: string | null; city: string | null; phone: string | null; email: string | null; timezone: string } | null
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="space-y-4 animate-fade-in">
      {state.status === 'success' && <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400">{state.message}</p>}
      {state.status === 'error' && state.message && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.name}>
          <Label htmlFor="name">School name *</Label>
          <Input id="name" name="name" defaultValue={school?.name || ''} required className={selectClass} />
        </Field>
        <Field error={errors.shortName}>
          <Label htmlFor="shortName">Short name *</Label>
          <Input id="shortName" name="shortName" defaultValue={school?.shortName || ''} required maxLength={20} className={selectClass} />
        </Field>
        <Field error={errors.address}>
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={school?.address || ''} className={selectClass} />
        </Field>
        <Field error={errors.city}>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={school?.city || ''} className={selectClass} />
        </Field>
        <Field error={errors.phone}>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={school?.phone || ''} className={selectClass} />
        </Field>
        <Field error={errors.email}>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={school?.email || ''} className={selectClass} />
        </Field>
        <Field error={errors.timezone}>
          <Label htmlFor="timezone">Timezone *</Label>
          <Input id="timezone" name="timezone" defaultValue={school?.timezone || 'UTC'} required className={selectClass} />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Save school profile</Button>
    </form>
  )
}
