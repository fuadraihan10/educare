'use client'

import { useActionState } from 'react'
import { Loader2, Copy, Check, KeyRound, Wand2 } from 'lucide-react'
import { useState } from 'react'

import { approveApplication, rejectApplication, type AdmissionApprovalState } from '@/lib/admissions/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function PasswordCopy({ password }: { password: string }) {
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

export function ApproveButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(approveApplication.bind(null, id), { status: 'idle' } as AdmissionApprovalState)
  const [mode, setMode] = useState<'auto' | 'custom'>('auto')
  const [customPassword, setCustomPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={action} className="space-y-3">
      {state.status === 'error' && state.message && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{state.message}</p>
      )}
      {state.status === 'success' && state.message && (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-800">
          <p>{state.message}</p>
          {state.tempPassword && (
            <div className="mt-1.5">
              <p className="font-medium text-amber-700">Password (share with student):</p>
              <PasswordCopy password={state.tempPassword} />
              <p className="mt-1 text-[10px] text-muted-foreground">Student will be required to change this password on first login.</p>
            </div>
          )}
        </div>
      )}

      {state.status !== 'success' && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Student Password</p>
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
                  placeholder="Enter a password for the student"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
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
        </div>
      )}

      {state.status !== 'success' && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Roll Number (optional)</p>
          <div>
            <Input
              name="rollNo"
              type="number"
              min={0}
              placeholder="Leave empty to auto-assign"
              className="text-xs"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">Set a specific roll number or leave empty for auto-assignment.</p>
          </div>
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Approve &amp; Enroll
      </Button>
    </form>
  )
}

export function RejectForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(rejectApplication.bind(null, id), { status: 'idle' })
  return (
    <form action={action} className="space-y-2">
      {state.status === 'error' && state.message && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{state.message}</p>
      )}
      {state.status === 'success' && state.message && (
        <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-800">{state.message}</p>
      )}
      <div>
        <label htmlFor="remarks" className="text-sm font-medium">Rejection reason (optional)</label>
        <textarea id="remarks" name="remarks" rows={2} className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="Reason for rejection…" />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Reject
      </Button>
    </form>
  )
}
