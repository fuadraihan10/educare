'use client'

import { Trash2 } from 'lucide-react'

import { deleteStudent } from '@/lib/students/actions'
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

export function DeleteButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" size="sm"><Trash2 /> Delete</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this student?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{studentName}</strong> and all associated records
            including enrollments, attendance, marks, invoices, and uploaded files. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={deleteStudent.bind(null, studentId)}>
            <AlertDialogAction type="submit" variant="destructive">
              Delete student
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
