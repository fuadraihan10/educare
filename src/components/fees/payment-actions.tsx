'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { confirmPayment, rejectPayment } from '@/lib/fees/actions'
import { Button } from '@/components/ui/button'

export function ConfirmPaymentButton({ paymentId }: { paymentId: string }) {
  const [state, action, pending] = useActionState(confirmPayment.bind(null, paymentId), { status: 'idle' })
  return (
    <form action={action} className="inline">
      {state.status === 'error' && state.message && <p role="alert" className="mb-1 text-xs text-destructive">{state.message}</p>}
      <Button variant="outline" size="sm" type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Confirm</Button>
    </form>
  )
}

export function RejectPaymentButton({ paymentId }: { paymentId: string }) {
  const [, action, pending] = useActionState(rejectPayment.bind(null, paymentId), { status: 'idle' })
  return (
    <form action={action} className="inline">
      <Button variant="destructive" size="sm" type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />}Reject</Button>
    </form>
  )
}
