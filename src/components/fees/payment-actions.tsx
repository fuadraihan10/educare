'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { confirmPayment, rejectPayment } from '@/lib/fees/actions'
import { Button } from '@/components/ui/button'

export function ConfirmPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(confirmPayment.bind(null, paymentId), { status: 'idle' })
  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [state.status, router])
  return (
    <form action={action} className="inline">
      {state.status === 'error' && state.message && <p role="alert" className="mb-1 text-xs text-destructive">{state.message}</p>}
      <Button variant="outline" size="sm" type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Confirm</Button>
    </form>
  )
}

export function RejectPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(rejectPayment.bind(null, paymentId), { status: 'idle' })
  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [state.status, router])
  return (
    <form action={action} className="inline">
      {state.status === 'error' && state.message && <p role="alert" className="mb-1 text-xs text-destructive">{state.message}</p>}
      <Button variant="destructive" size="sm" type="submit" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Reject</Button>
    </form>
  )
}
