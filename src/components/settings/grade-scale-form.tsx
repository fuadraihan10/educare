'use client'

import { useActionState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'

import type { GradeScaleFormState } from '@/lib/settings/actions'
import { deleteGradeScale } from '@/lib/settings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'

export function GradeScaleForm({
  action, scales,
}: {
  action: (prev: GradeScaleFormState, formData: FormData) => Promise<GradeScaleFormState>
  scales: { id: string; label: string; minPercent: unknown; maxPercent: unknown; points: unknown; order: number }[]
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  return (
    <div className="space-y-4">
      {state.status === 'success' && <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400">{state.message}</p>}
      {state.status === 'error' && state.message && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>}

      {scales.length > 0 && (
        <div className="glass-table rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b">
            <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Label</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Range</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Points</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">Order</th>
            <th className="px-3 py-2 text-right font-medium text-muted-foreground" scope="col">Action</th>
          </tr></thead>
          <tbody>
            {scales.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-3 py-2 font-medium">{s.label}</td>
                <td className="px-3 py-2">{Number(s.minPercent)}% – {Number(s.maxPercent)}%</td>
                <td className="px-3 py-2">{Number(s.points)}</td>
                <td className="px-3 py-2">{s.order}</td>
                <td className="px-3 py-2 text-right">
                  <form action={deleteGradeScale.bind(null, s.id)} className="inline">
                    <Button variant="ghost" size="icon" type="submit"><Trash2 className="size-4 text-destructive" /></Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-3 pt-2 border-t animate-fade-in">
        <Field error={errors.label}>
          <Label htmlFor="gs-label">Label *</Label>
          <Input id="gs-label" name="label" placeholder="A+" className={selectClass} required />
        </Field>
        <Field error={errors.minPercent}>
          <Label htmlFor="gs-min">Min % *</Label>
          <Input id="gs-min" name="minPercent" type="number" step="0.01" className={selectClass} required />
        </Field>
        <Field error={errors.maxPercent}>
          <Label htmlFor="gs-max">Max % *</Label>
          <Input id="gs-max" name="maxPercent" type="number" step="0.01" className={selectClass} required />
        </Field>
        <Field error={errors.points}>
          <Label htmlFor="gs-points">Points *</Label>
          <Input id="gs-points" name="points" type="number" step="0.01" className={selectClass} required />
        </Field>
        <Field error={errors.order}>
          <Label htmlFor="gs-order">Order *</Label>
          <Input id="gs-order" name="order" type="number" className={selectClass} required />
        </Field>
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Add</Button>
      </form>
    </div>
  )
}
