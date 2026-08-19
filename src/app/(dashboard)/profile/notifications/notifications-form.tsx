'use client'

import { useActionState } from 'react'
import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, AlertCircle, Bell, MonitorSmartphone, BellRing } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { updateNotifications, type NotificationFormState } from '@/lib/profile/actions'

type Props = {
  preferences: {
    inAppNotifications: boolean
    pushNotifications: boolean
    notifStudentUpdates: boolean
    notifAttendanceAlerts: boolean
    notifFeeAlerts: boolean
    notifExamResults: boolean
    notifAdmissions: boolean
    notifStaffUpdates: boolean
    notifSystem: boolean
    notifSecurity: boolean
    notifReports: boolean
  } | null
}

export function NotificationsForm({ preferences: p }: Props) {
  const [state, formAction, pending] = useActionState(updateNotifications, { status: 'idle' } as NotificationFormState)
  const [saved, setSaved] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- transient UI feedback after server action */
  useEffect(() => {
    if (state.status === 'success') {
      setSaved(true)
      const timer = setTimeout(() => setSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [state.status])
  /* eslint-enable react-hooks/set-state-in-effect */

  const channels = [
    { name: 'inAppNotifications', label: 'In-app notifications', desc: 'Show notifications within the app', icon: MonitorSmartphone },
    { name: 'pushNotifications', label: 'Push notifications', desc: 'Browser push notifications', icon: BellRing },
  ]

  const categories = [
    { name: 'notifStudentUpdates', label: 'Student updates', desc: 'New students, enrollments, profile changes' },
    { name: 'notifAttendanceAlerts', label: 'Attendance alerts', desc: 'Absent students, attendance reports' },
    { name: 'notifFeeAlerts', label: 'Fee / Payment alerts', desc: 'Payment received, overdue invoices' },
    { name: 'notifExamResults', label: 'Examination & Results', desc: 'Exam schedules, published results' },
    { name: 'notifAdmissions', label: 'Admission updates', desc: 'New applications, admission status changes' },
    { name: 'notifStaffUpdates', label: 'Teacher / Staff updates', desc: 'Staff changes, assignments' },
    { name: 'notifSystem', label: 'System announcements', desc: 'System updates and maintenance notices' },
    { name: 'notifReports', label: 'Reports', desc: 'Generated reports and analytics summaries' },
  ]

  return (
    <form action={formAction} className="space-y-6">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Notification Channels</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Choose how you want to receive notifications</p>
        </div>
        <div className="p-6 space-y-3">
          {channels.map((ch) => (
            <label key={ch.name} className="flex items-center justify-between gap-4 glass rounded-xl px-4 py-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] transition-all">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <ch.icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{ch.label}</p>
                  <p className="text-xs text-muted-foreground">{ch.desc}</p>
                </div>
              </div>
              <Checkbox name={ch.name} defaultChecked={p ? (p as Record<string, boolean>)[ch.name] : ch.name === 'inAppNotifications'} />
            </label>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Notification Categories</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Select which types of notifications you want to receive</p>
        </div>
        <div className="p-6 space-y-3">
          {categories.map((cat) => (
            <label key={cat.name} className="flex items-center justify-between gap-4 glass rounded-xl px-4 py-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] transition-all">
              <div>
                <p className="text-sm font-medium">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.desc}</p>
              </div>
              <Checkbox name={cat.name} defaultChecked={p ? (p as Record<string, boolean>)[cat.name] : true} disabled={cat.name === 'notifSecurity'} />
            </label>
          ))}
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2">
            <Bell className="size-3" />
            Security notifications are always enabled and cannot be disabled.
          </p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in">
          <CheckCircle className="size-4 shrink-0" />
          <span>Notification preferences saved successfully.</span>
        </div>
      )}
      {state.status === 'error' && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-shake">
          <AlertCircle className="size-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <Button type="submit" disabled={pending} className="h-10 px-6">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? 'Saving...' : 'Save preferences'}
      </Button>
    </form>
  )
}
