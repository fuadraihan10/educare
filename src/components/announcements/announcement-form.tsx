'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'

import type { AnnouncementFormState } from '@/lib/announcements/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, selectClass } from '@/components/form-helpers'

export function AnnouncementForm({
  action, submitLabel, classes,
}: {
  action: (prev: AnnouncementFormState, formData: FormData) => Promise<AnnouncementFormState>
  submitLabel: string
  classes: { id: string; name: string; section: string; code: string }[]
}) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' })
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="space-y-6 animate-fade-in">
      {state.message && state.status === 'error' && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.message}</p>}
      <Field error={errors.title}>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" placeholder="Announcement title" required maxLength={200} />
      </Field>
      <Field error={errors.body}>
        <Label htmlFor="body">Body *</Label>
        <textarea id="body" name="body" rows={6} required maxLength={5000} className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none" placeholder="Write the announcement content…" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field error={errors.audience}>
          <Label htmlFor="audience">Audience *</Label>
          <select id="audience" name="audience" className={selectClass} defaultValue="ALL" required>
            <option value="ALL">All</option>
            <option value="ADMIN">Admins</option>
            <option value="TEACHER">Teachers</option>
            <option value="STUDENT">Students</option>
            <option value="PARENT">Parents</option>
          </select>
        </Field>
        <Field error={errors.classId}>
          <Label htmlFor="classId">Class (optional)</Label>
          <select id="classId" name="classId" className={selectClass}>
            <option value="__all__">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · Section {c.section}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}{submitLabel}</Button>
      </div>
    </form>
  )
}
