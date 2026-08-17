'use client'

import { UserMinus, UserCheck } from 'lucide-react'

import { deactivateStaff, reactivateStaff } from '@/lib/staff/actions'
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

export function StaffStatusButton({
  staffId,
  active,
}: {
  staffId: string
  active: boolean
}) {
  if (active) {
    return (
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive"><UserMinus /> Deactivate</Button>} />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this teacher?</AlertDialogTitle>
            <AlertDialogDescription>
              The teacher&apos;s login is disabled and they stop appearing in active rosters. Their
              history is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={deactivateStaff.bind(null, staffId)}>
              <AlertDialogAction type="submit" variant="destructive">
                Deactivate
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <form action={reactivateStaff.bind(null, staffId)}>
      <Button type="submit">
        <UserCheck /> Reactivate
      </Button>
    </form>
  )
}
