'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, GlobeOff, Trash2, Loader2, MoreHorizontal, Eye } from 'lucide-react'
import { publishAssessment, unpublishAssessment, deleteAssessment } from '@/lib/exams/actions'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export function TeacherAssessmentActions({
  assessmentId,
  isPublished,
  markCount,
}: {
  assessmentId: string
  isPublished: boolean
  markCount: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)

  async function handlePublish() {
    startTransition(async () => {
      await publishAssessment(assessmentId)
      router.refresh()
    })
  }

  function handleUnpublishClick() {
    setConfirmUnpublish(true)
  }

  async function handleUnpublishConfirm() {
    setConfirmUnpublish(false)
    startTransition(async () => {
      await unpublishAssessment(assessmentId)
      router.refresh()
    })
  }

  async function handleDelete() {
    await deleteAssessment(assessmentId)
    setConfirmDelete(false)
    router.refresh()
  }

  return (
    <>
      {isPublished ? (
        <Button
          variant="outline"
          size="xs"
          disabled={pending}
          onClick={handleUnpublishClick}
          className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
        >
          {pending ? <Loader2 className="animate-spin" /> : <GlobeOff className="size-3" />}
          Unpublish
        </Button>
      ) : (
        <Button
          variant="default"
          size="xs"
          disabled={pending}
          onClick={handlePublish}
          className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          {pending ? <Loader2 className="animate-spin" /> : <Globe className="size-3" />}
          Publish
        </Button>
      )}

      <div className="relative group">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-border p-1 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
        <div className="absolute right-0 top-full z-10 mt-1 hidden group-hover:block">
          <div className="min-w-[140px] rounded-xl border border-border bg-background shadow-lg p-1 space-y-0.5">
            <a
              href={`/teacher/exams/${assessmentId}/marks`}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors"
            >
              <Eye className="size-3.5" />
              View Marks
            </a>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={markCount > 0}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmUnpublish} onOpenChange={setConfirmUnpublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish this assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              This assessment will be hidden from students and parents. They will no longer see it in their grades. You can publish it again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleUnpublishConfirm} className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <GlobeOff className="size-3.5" />
              Unpublish
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assessment?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The assessment will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
