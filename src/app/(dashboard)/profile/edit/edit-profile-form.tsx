'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Hash, BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateProfile, type ProfileFormState } from '@/lib/profile/actions'

type EditProfileFormProps = {
  user: {
    role: string
    name: string
    email: string
    regNo: string
    displayName?: string | null
    phone?: string | null
    bio?: string | null
    designation?: string | null
    department?: string | null
  }
  student: {
    firstName: string
    lastName: string
    admissionNo: string
    rollNo: number | null
    class: { name: string; section: string; code: string } | null
  } | null
  teacher: {
    employeeId: string
    designation: string | null
    specialization: string | null
    qualification: string | null
  } | null
}

export function EditProfileForm({ user, student, teacher }: EditProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, { status: 'idle' } as ProfileFormState)

  if (state.status === 'success') {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="size-4 shrink-0" />
          <span>{state.message}</span>
        </div>
        <Button variant="outline" render={<Link href="/profile" />}>
          <ArrowLeft className="size-4" /> Back to profile
        </Button>
      </div>
    )
  }

  const showBio = user.role === 'TEACHER' || user.role === 'STUDENT'
  const showWorkDetails = user.role === 'TEACHER'
  const showStudentInfo = user.role === 'STUDENT' && student
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

  return (
    <form action={formAction} className="space-y-6">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Personal Information</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Update your personal details</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full name *</Label>
              <Input id="name" name="name" defaultValue={user.name} required className="rounded-xl" />
              {state.errors?.name && <p className="text-xs text-destructive">{state.errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">Display name</Label>
              <Input id="displayName" name="displayName" defaultValue={user.displayName ?? ''} placeholder="How you'd like to be called" className="rounded-xl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} className="rounded-xl" />
              <p className="text-xs text-muted-foreground">Notifications will be sent to this address.</p>
              {state.errors?.email && <p className="text-xs text-destructive">{state.errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone number</Label>
              <Input id="phone" name="phone" defaultValue={user.phone ?? ''} placeholder="+880 1XXXXXXXXX" className="rounded-xl" />
            </div>
          </div>
          {showBio && (
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Bio / About</Label>
              <Textarea id="bio" name="bio" defaultValue={user.bio ?? ''} placeholder="A short bio about yourself" rows={3} className="rounded-xl" />
            </div>
          )}
        </div>
      </div>

      {showWorkDetails && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <h2 className="text-lg font-semibold tracking-tight">Work Details</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Your professional information</p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="designation" className="text-sm font-medium">Designation</Label>
                <Input id="designation" name="designation" defaultValue={user.designation ?? ''} placeholder="e.g. Senior Teacher" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                <Input id="department" name="department" defaultValue={user.department ?? ''} placeholder="e.g. Science" className="rounded-xl" />
              </div>
            </div>
            {teacher && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="text-sm font-medium flex items-center gap-1.5"><Hash className="size-3.5 text-muted-foreground" />{teacher.employeeId}</p>
                </div>
                {teacher.qualification && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Qualification</p>
                    <p className="text-sm font-medium flex items-center gap-1.5"><BookOpen className="size-3.5 text-muted-foreground" />{teacher.qualification}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showStudentInfo && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <h2 className="text-lg font-semibold tracking-tight">Academic Information</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Your enrollment details (read only)</p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Registration ID</p>
                <p className="text-sm font-mono font-semibold">{user.regNo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Admission No.</p>
                <p className="text-sm font-mono font-medium">{student.admissionNo}</p>
              </div>
              {student.class && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="text-sm font-medium">{student.class.name} · Section {student.class.section}</p>
                </div>
              )}
              {student.rollNo && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Roll No.</p>
                  <p className="text-sm font-medium">{student.rollNo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <h2 className="text-lg font-semibold tracking-tight">Account Details</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium">{user.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Registration ID</p>
                <p className="text-sm font-mono font-semibold">{user.regNo}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <div role="alert" className="animate-shake flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-10 px-6">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? 'Saving...' : 'Save changes'}
        </Button>
        <Button variant="outline" render={<Link href="/profile" />}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
