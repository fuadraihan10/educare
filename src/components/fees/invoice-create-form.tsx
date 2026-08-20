'use client'

import { useActionState, useState } from 'react'
import { Loader2 } from 'lucide-react'

import type { InvoiceFormState } from '@/lib/fees/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'
import { formatCurrency } from '@/lib/format'

export function InvoiceCreateForm({
  action, submitLabel, students, terms, feeStructures,
}: {
  action: (prev: InvoiceFormState, formData: FormData) => Promise<InvoiceFormState>
  submitLabel: string
  students: { id: string; firstName: string; lastName: string; admissionNo: string }[]
  terms: { id: string; name: string; isActive: boolean }[]
  feeStructures: { id: string; name: string; amount: unknown }[]
}) {
  const [selectedFees, setSelectedFees] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(feeStructures.map((f) => [f.id, true]))
  )
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="space-y-6 animate-fade-in">
      <input type="hidden" name="feeStructureIds" value={JSON.stringify(Object.keys(selectedFees).filter((k) => selectedFees[k]))} />
      {state.message && state.status === 'error' && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.studentId}>
          <Label htmlFor="studentId">Student *</Label>
          <select id="studentId" name="studentId" className={selectClass} required>
            <option value="" disabled>Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.admissionNo} — {s.firstName} {s.lastName}</option>)}
          </select>
        </Field>
        <Field error={errors.termId}>
          <Label htmlFor="termId">Term *</Label>
          <select id="termId" name="termId" className={selectClass} defaultValue={terms.find((t) => t.isActive)?.id || ''} required>
            <option value="" disabled>Select term…</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isActive ? ' (active)' : ''}</option>)}
          </select>
        </Field>
        <Field error={errors.issueDate}>
          <Label htmlFor="issueDate">Issue date *</Label>
          <Input id="issueDate" name="issueDate" type="date" defaultValue={today} required />
        </Field>
        <Field error={errors.dueDate}>
          <Label htmlFor="dueDate">Due date *</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={today} required />
        </Field>
      </div>
      <div>
        <Label>Fee structures</Label>
        <div className="mt-2 space-y-2">
          {feeStructures.map((f) => (
            <label key={f.id} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm transition-colors hover:bg-muted/40">
              <input type="checkbox" checked={selectedFees[f.id] ?? false} onChange={(e) => setSelectedFees((prev) => ({ ...prev, [f.id]: e.target.checked }))} className="size-4 rounded border-input accent-primary" />
              <span className="flex-1">{f.name}</span>
              <span className="font-medium tabular-nums">{formatCurrency(Number(f.amount))}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end rounded-lg bg-muted/30 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">Total:</span>
          <span className="ml-2 text-lg font-semibold tabular-nums">
            {formatCurrency(Number(feeStructures.filter((f) => selectedFees[f.id]).reduce((sum, f) => sum + Number(f.amount), 0)))}
          </span>
        </div>
      </div>
      <Field error={errors.notes}>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional notes" />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}{submitLabel}</Button>
      </div>
    </form>
  )
}
