'use client'

import { useActionState, useState } from 'react'
import { Loader2, Copy, Check, KeyRound, Wand2, ShieldCheck } from 'lucide-react'

import { resetUserPassword, type ResetPasswordState } from '@/lib/users/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

function PasswordDisplay({ password }: { password: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-2 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
      <code className="flex-1 font-mono text-xs text-amber-800 select-all">{password}</code>
      <button type="button" onClick={handleCopy} className="shrink-0 rounded p-1 text-amber-700 hover:bg-amber-100 transition-colors">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

export function AdminPasswordReset({ userId, userName }: { userId: string; userName: string }) {
  const [state, formAction, pending] = useActionState(resetUserPassword.bind(null, userId), { status: 'idle' } as ResetPasswordState)
  const [mode, setMode] = useState<'auto' | 'custom'>('auto')
  const [showPassword, setShowPassword] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setMode('auto'); setShowPassword(false) } }}>
      <AlertDialogTrigger
        render={
          <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-muted/50 transition-colors" />
        }
      >
        <KeyRound className="size-3" />
        Reset Password
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset password for {userName}</AlertDialogTitle>
          <AlertDialogDescription>
            Set a new password. The user will be required to change it on next login.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state.status === 'success' && state.newPassword ? (
          <div className="space-y-3">
            <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-800">
              <p>{state.message}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-amber-700 mb-1">New password (share with user):</p>
              <PasswordDisplay password={state.newPassword} />
            </div>
            <p className="text-[11px] text-muted-foreground">The user will be required to change this password on first login.</p>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            {state.status === 'error' && state.message && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{state.message}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'auto'
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Wand2 className="size-3" />
                Auto-generate
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'custom'
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <KeyRound className="size-3" />
                Set password
              </button>
            </div>

            {mode === 'auto' && (
              <p className="text-[11px] text-muted-foreground">A strong 12-character password will be generated automatically.</p>
            )}

            {mode === 'custom' && (
              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter a new password"
                    minLength={8}
                    required
                    className="pr-20 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Min 8 characters. Must include uppercase, lowercase, and a number.</p>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />}
                <ShieldCheck className="size-3.5" />
                Reset Password
              </Button>
            </AlertDialogFooter>
          </form>
        )}

        {state.status === 'success' && (
          <AlertDialogFooter>
            <AlertDialogCancel>Done</AlertDialogCancel>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
