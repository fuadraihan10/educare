'use client'

import { Trash2 } from 'lucide-react'

import { deleteFeeStructure } from '@/lib/fees/actions'
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

export function DeleteFeeStructureButton({
  feeStructureId,
  feeStructureName,
  hasLinkedInvoices,
}: {
  feeStructureId: string
  feeStructureName: string
  hasLinkedInvoices: boolean
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon" aria-label="Delete fee structure"><Trash2 className="text-destructive size-4" /></Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasLinkedInvoices ? 'Deactivate' : 'Delete'} fee structure?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasLinkedInvoices ? (
              <>
                <strong>{feeStructureName}</strong> has linked invoices and cannot be deleted.
                It will be marked as inactive and hidden from new invoice creation.
              </>
            ) : (
              <>
                This will permanently delete <strong>{feeStructureName}</strong>. This action
                cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={deleteFeeStructure.bind(null, feeStructureId)}>
            <AlertDialogAction type="submit" variant="destructive">
              {hasLinkedInvoices ? 'Deactivate' : 'Delete'}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
