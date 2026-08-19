'use client'

import { useActionState, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Loader2, CheckCircle, AlertCircle, Sun, Moon, Monitor } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateAppearance, type AppearanceFormState } from '@/lib/profile/actions'

type Props = {
  preferences: {
    theme: string
    sidebarBehavior: string
    density: string
    dateFormat: string
    timeFormat: string
  } | null
}

export function AppearanceForm({ preferences: p }: Props) {
  const { setTheme } = useTheme()
  const [state, formAction, pending] = useActionState(updateAppearance, { status: 'idle' } as AppearanceFormState)
  const [saved, setSaved] = useState(false)
  const [localTheme, setLocalTheme] = useState(p?.theme ?? 'system')

  /* eslint-disable react-hooks/set-state-in-effect -- transient UI feedback after server action */
  useEffect(() => {
    if (state.status === 'success') {
      setSaved(true)
      const timer = setTimeout(() => setSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [state.status])
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleThemeChange(value: string) {
    setLocalTheme(value)
    setTheme(value)
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Theme</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Select your preferred color theme</p>
        </div>
        <div className="p-6">
          <input type="hidden" name="theme" value={localTheme} />
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => handleThemeChange(t.value)}
                className={`glass flex flex-col items-center gap-2 rounded-xl px-4 py-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] ${localTheme === t.value ? 'ring-2 ring-primary bg-primary/5' : ''}`}
              >
                <t.icon className={`size-6 ${localTheme === t.value ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Layout</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Customize the sidebar and spacing</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sidebar behavior</Label>
              <select name="sidebarBehavior" defaultValue={p?.sidebarBehavior ?? 'expanded'} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="expanded">Expanded by default</option>
                <option value="collapsed">Collapsed by default</option>
                <option value="remember">Remember last state</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Density</Label>
              <select name="density" defaultValue={p?.density ?? 'comfortable'} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Date & Time</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date format</Label>
              <select name="dateFormat" defaultValue={p?.dateFormat ?? 'YYYY-MM-DD'} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Time format</Label>
              <select name="timeFormat" defaultValue={p?.timeFormat ?? '24h'} className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="24h">24-hour (14:30)</option>
                <option value="12h">12-hour (2:30 PM)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-in">
          <CheckCircle className="size-4 shrink-0" />
          <span>Appearance settings saved successfully.</span>
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
        {pending ? 'Saving...' : 'Save appearance'}
      </Button>
    </form>
  )
}
