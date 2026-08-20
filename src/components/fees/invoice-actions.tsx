'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Ban, Trash2 } from 'lucide-react'

import { cancelInvoice, deleteInvoice } from '@/lib/fees/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function CancelInvoiceButton({ invoiceId, invoiceNo }: { invoiceId: string; invoiceNo: string }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(cancelInvoice.bind(null, invoiceId), { status: 'idle' })
  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [state.status, router])

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline" size="sm"><Ban /> Cancel</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this invoice?</AlertDialogTitle>
          <AlertDialogDescription>
            Invoice <strong>{invoiceNo}</strong> will be marked as cancelled. Students will be
            notified. This action can be reversed by an admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep invoice</AlertDialogCancel>
          <form action={action}>
            {state.status === 'error' && state.message && (
              <p role="alert" className="mb-2 text-xs text-destructive">{state.message}</p>
            )}
            <AlertDialogAction type="submit" variant="destructive" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Cancel invoice
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteInvoiceButton({ invoiceId, invoiceNo }: { invoiceId: string; invoiceNo: string }) {
  const router = useRouter()

  async function handleDelete() {
    'use server'
    await deleteInvoice(invoiceId)
    router.push('/admin/fees')
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" size="sm"><Trash2 /> Delete</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete invoice <strong>{invoiceNo}</strong> and all its line items.
            Only invoices without pending or confirmed payments can be deleted. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={handleDelete}>
            <AlertDialogAction type="submit" variant="destructive">
              Delete invoice
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
