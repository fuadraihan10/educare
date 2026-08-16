'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { StudentFormState } from '@/lib/students/actions'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ClassOption = { id: string; name: string; section: string }

export type StudentFormInitial = {
  firstName: string
  middleName: string | null
  lastName: string
  dob: Date
  gender: string
  bloodGroup: string | null
  religion: string | null
  nationality: string | null
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  guardianEmail: string | null
  classId: string | null
  photoUrl: string | null
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

export function StudentForm({
  action,
  classes,
  initial,
  submitLabel,
}: {
  action: (prev: StudentFormState, formData: FormData) => Promise<StudentFormState>
  classes: ClassOption[]
  initial?: StudentFormInitial
  submitLabel: string
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
        <h2 className="text-sm font-semibold text-muted-foreground">Personal information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.firstName}>
            <Label htmlFor="firstName">First name *</Label>
            <Input id="firstName" name="firstName" defaultValue={initial?.firstName} required />
          </Field>
          <Field error={errors.middleName}>
            <Label htmlFor="middleName">Middle name</Label>
            <Input id="middleName" name="middleName" defaultValue={initial?.middleName ?? ''} />
          </Field>
          <Field error={errors.lastName}>
            <Label htmlFor="lastName">Last name *</Label>
            <Input id="lastName" name="lastName" defaultValue={initial?.lastName} required />
          </Field>
          <Field error={errors.dob}>
            <Label htmlFor="dob">Date of birth *</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              defaultValue={initial ? formatDate(initial.dob) : undefined}
              required
            />
          </Field>
          <Field error={errors.gender}>
            <Label htmlFor="gender">Gender *</Label>
            <select id="gender" name="gender" className={selectClass} defaultValue={initial?.gender ?? 'MALE'} required>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field error={errors.bloodGroup}>
            <Label htmlFor="bloodGroup">Blood group</Label>
            <Input id="bloodGroup" name="bloodGroup" defaultValue={initial?.bloodGroup ?? ''} placeholder="e.g. O+" />
          </Field>
          <Field error={errors.religion}>
            <Label htmlFor="religion">Religion</Label>
            <Input id="religion" name="religion" defaultValue={initial?.religion ?? ''} />
          </Field>
          <Field error={errors.nationality}>
            <Label htmlFor="nationality">Nationality</Label>
            <Input id="nationality" name="nationality" defaultValue={initial?.nationality ?? ''} />
          </Field>
          <Field error={errors.phone}>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={initial?.phone ?? ''} />
          </Field>
          <Field error={errors.email}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ''} />
          </Field>
          <Field error={errors.address}>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={initial?.address ?? ''} />
          </Field>
          <Field error={errors.city}>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={initial?.city ?? ''} />
          </Field>
          <Field error={errors.classId}>
            <Label htmlFor="classId">Class</Label>
            <select id="classId" name="classId" className={selectClass} defaultValue={initial?.classId ?? ''}>
              <option value="">Unassigned</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>
          </Field>
          <Field error={errors.photo}>
            <Label htmlFor="photo">Photo</Label>
            <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Guardian information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.guardianName}>
            <Label htmlFor="guardianName">Guardian name *</Label>
            <Input id="guardianName" name="guardianName" defaultValue={initial?.guardianName} required />
          </Field>
          <Field error={errors.guardianRelation}>
            <Label htmlFor="guardianRelation">Relation *</Label>
            <Input id="guardianRelation" name="guardianRelation" defaultValue={initial?.guardianRelation} required placeholder="Father / Mother / Guardian" />
          </Field>
          <Field error={errors.guardianPhone}>
            <Label htmlFor="guardianPhone">Guardian phone *</Label>
            <Input id="guardianPhone" name="guardianPhone" defaultValue={initial?.guardianPhone} required />
          </Field>
          <Field error={errors.guardianEmail}>
            <Label htmlFor="guardianEmail">Guardian email</Label>
            <Input id="guardianEmail" name="guardianEmail" type="email" defaultValue={initial?.guardianEmail ?? ''} />
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
