'use client'

import { useActionState } from 'react'
import { Loader2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

import { approveApplication, rejectApplication, type AdmissionApprovalState } from '@/lib/admissions/actions'
import { Button } from '@/components/ui/button'

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
  return (
    <form action={action}>
      {state.status === 'error' && state.message && (
        <p className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{state.message}</p>
      )}
      {state.status === 'success' && state.message && (
        <div className="mb-2 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-800">
          <p>{state.message}</p>
          {state.tempPassword && (
            <div className="mt-1.5">
              <p className="font-medium text-amber-700">Temp password (share with student):</p>
              <PasswordCopy password={state.tempPassword} />
              <p className="mt-1 text-[10px] text-muted-foreground">Student will be required to change this password on first login.</p>
            </div>
          )}
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
