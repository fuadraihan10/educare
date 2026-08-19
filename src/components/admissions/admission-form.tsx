'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { AdmissionFormState } from '@/lib/admissions/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'

export type AdmissionFormInitial = {
  applicantName?: string
  dob?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  guardianName?: string
  guardianRelation?: string
  guardianPhone?: string
  guardianEmail?: string
  appliedClassId?: string
  academicYearId?: string
}

export function AdmissionForm({
  action,
  initial,
  submitLabel,
  classes,
  years,
}: {
  action: (prev: AdmissionFormState, formData: FormData) => Promise<AdmissionFormState>
  initial?: AdmissionFormInitial
  submitLabel: string
  classes: { id: string; name: string; section: string; code: string }[]
  years: { id: string; name: string; isActive: boolean }[]
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
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applicant details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.applicantName}>
            <Label htmlFor="applicantName">Full name *</Label>
            <Input id="applicantName" name="applicantName" defaultValue={initial?.applicantName} placeholder="e.g. John Doe" required />
          </Field>
          <Field error={errors.dob}>
            <Label htmlFor="dob">Date of birth *</Label>
            <Input id="dob" name="dob" type="date" defaultValue={initial?.dob} required />
          </Field>
          <Field error={errors.gender}>
            <Label htmlFor="gender">Gender *</Label>
            <select id="gender" name="gender" className={selectClass} defaultValue={initial?.gender || ''} required>
              <option value="" disabled>Select…</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field error={errors.phone}>
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" name="phone" defaultValue={initial?.phone} placeholder="e.g. +880 1712345678" required />
          </Field>
          <Field error={errors.email}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ''} placeholder="Optional" />
          </Field>
          <Field error={errors.address}>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={initial?.address ?? ''} placeholder="Optional" />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guardian details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.guardianName}>
            <Label htmlFor="guardianName">Guardian name *</Label>
            <Input id="guardianName" name="guardianName" defaultValue={initial?.guardianName} placeholder="e.g. A. Rahman" required />
          </Field>
          <Field error={errors.guardianRelation}>
            <Label htmlFor="guardianRelation">Relation *</Label>
            <Input id="guardianRelation" name="guardianRelation" defaultValue={initial?.guardianRelation} placeholder="e.g. Father" required />
          </Field>
          <Field error={errors.guardianPhone}>
            <Label htmlFor="guardianPhone">Guardian phone *</Label>
            <Input id="guardianPhone" name="guardianPhone" defaultValue={initial?.guardianPhone} placeholder="e.g. +880 1812345678" required />
          </Field>
          <Field error={errors.guardianEmail}>
            <Label htmlFor="guardianEmail">Guardian email</Label>
            <Input id="guardianEmail" name="guardianEmail" type="email" defaultValue={initial?.guardianEmail ?? ''} placeholder="Optional" />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class assignment</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.appliedClassId}>
            <Label htmlFor="appliedClassId">Applied class *</Label>
            <select id="appliedClassId" name="appliedClassId" className={selectClass} defaultValue={initial?.appliedClassId || ''} required>
              <option value="" disabled>Select class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name} {c.section}</option>
              ))}
            </select>
          </Field>
          <Field error={errors.academicYearId}>
            <Label htmlFor="academicYearId">Academic year *</Label>
            <select id="academicYearId" name="academicYearId" className={selectClass} defaultValue={initial?.academicYearId || years.find((y) => y.isActive)?.id || ''} required>
              <option value="" disabled>Select year…</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (active)' : ''}</option>
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
