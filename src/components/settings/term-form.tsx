'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { TermFormState } from '@/lib/settings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'

export function TermCreateForm({ action, yearId }: { action: (prev: TermFormState, formData: FormData) => Promise<TermFormState>; yearId: string }) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 pt-2 border-t animate-fade-in">
      {state.status === 'error' && state.message && <p role="alert" className="w-full text-xs text-destructive">{state.message}</p>}
      <input type="hidden" name="academicYearId" value={yearId} />
      <Field error={state.errors?.name}><Label>Term *</Label><Input name="name" placeholder="Term 1" className={selectClass} required /></Field>
      <Field error={state.errors?.startDate}><Label>Start *</Label><Input name="startDate" type="date" className={selectClass} required /></Field>
      <Field error={state.errors?.endDate}><Label>End *</Label><Input name="endDate" type="date" className={selectClass} required /></Field>
      <Button type="submit" size="sm" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Add term</Button>
    </form>
  )
}
