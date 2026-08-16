'use client'

import { UserMinus } from 'lucide-react'

import { deactivateStudent } from '@/lib/students/actions'
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

export function DeactivateButton({ studentId, disabled }: { studentId: string; disabled?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" disabled={disabled}><UserMinus /> Withdraw</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw this student?</AlertDialogTitle>
          <AlertDialogDescription>
            The student is marked as withdrawn. Their records are kept for history, but they stop
            appearing in active rosters.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={deactivateStudent.bind(null, studentId)}>
            <AlertDialogAction type="submit" variant="destructive">
              Withdraw student
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
