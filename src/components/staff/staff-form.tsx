'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { StaffFormState } from '@/lib/staff/actions'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type StaffFormInitial = {
  name: string
  email: string
  phone: string | null
  gender: string | null
  dob: Date | null
  qualification: string | null
  designation: string | null
  specialization: string | null
  joinDate: Date
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

export function StaffForm({
  action,
  initial,
  submitLabel,
  passwordLabel,
}: {
  action: (prev: StaffFormState, formData: FormData) => Promise<StaffFormState>
  initial?: StaffFormInitial
  submitLabel: string
  passwordLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="space-y-6">
      {state.message && state.status === 'error' && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.name}>
            <Label htmlFor="name">Full name *</Label>
            <Input id="name" name="name" defaultValue={initial?.name} required />
          </Field>
          <Field error={errors.email}>
            <Label htmlFor="email">Login email *</Label>
            <Input id="email" name="email" type="email" defaultValue={initial?.email} required />
          </Field>
          <Field error={errors.phone}>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={initial?.phone ?? ''} placeholder="+880 …" />
          </Field>
          <Field error={errors.gender}>
            <Label htmlFor="gender">Gender</Label>
            <select id="gender" name="gender" className={selectClass} defaultValue={initial?.gender ?? ''}>
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field error={errors.dob}>
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" name="dob" type="date" defaultValue={initial?.dob ? formatDate(initial.dob) : ''} />
          </Field>
          <Field error={errors.qualification}>
            <Label htmlFor="qualification">Qualification</Label>
            <Input id="qualification" name="qualification" defaultValue={initial?.qualification ?? ''} placeholder="e.g. B.Ed / M.Sc" />
          </Field>
          <Field error={errors.designation}>
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" name="designation" defaultValue={initial?.designation ?? ''} placeholder="e.g. Senior Teacher" />
          </Field>
          <Field error={errors.specialization}>
            <Label htmlFor="specialization">Specialization</Label>
            <Input id="specialization" name="specialization" defaultValue={initial?.specialization ?? ''} placeholder="e.g. Mathematics" />
          </Field>
          <Field error={errors.joinDate}>
            <Label htmlFor="joinDate">Join date</Label>
            <Input id="joinDate" name="joinDate" type="date" defaultValue={initial ? formatDate(initial.joinDate) : ''} />
          </Field>
          <Field error={errors.password}>
            <Label htmlFor="password">{passwordLabel}</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required={!initial} placeholder={initial ? 'Leave blank to keep current' : 'Min. 8 characters'} />
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
