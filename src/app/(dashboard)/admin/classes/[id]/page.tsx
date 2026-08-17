import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil, Trash2, Users, BookOpen } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getClass } from '@/lib/classes'
import { deleteClass } from '@/lib/classes/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params

  const cls = await getClass(id)
  if (!cls) notFound()

  const canDelete = cls._count.students === 0 && cls._count.enrollments === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {cls.name} — Section {cls.section}
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{cls.code}</span>
            {cls.room ? ` · ${cls.room}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/classes/${id}/edit`} />}>
            <Pencil /> Edit
          </Button>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm"><Trash2 /> Delete</Button>} />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this class?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This class has no students or enrollments and can be safely removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <form action={deleteClass.bind(null, id)}>
                    <AlertDialogAction type="submit" variant="destructive">
                      Delete
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Code</dt>
                  <dd className="text-sm font-medium font-mono">{cls.code}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Room</dt>
                  <dd className="text-sm font-medium">{cls.room ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Academic year</dt>
                  <dd className="text-sm font-medium">{cls.academicYear.name}{cls.academicYear.isActive ? ' (active)' : ''}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Class teacher</dt>
                  <dd className="text-sm font-medium">
                    {cls.classTeacher ? (
                      <Link href={`/admin/staff/${cls.classTeacher.id}`} className="underline underline-offset-2 hover:text-primary">
                        {cls.classTeacher.name} <span className="font-mono text-xs text-muted-foreground">({cls.classTeacher.employeeId})</span>
                      </Link>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" /> Students ({cls._count.students})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cls.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students enrolled.</p>
              ) : (
                <ul className="space-y-2">
                  {cls.enrollments.map((e) => (
                    <li key={e.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                          {e.student.rollNo ?? '—'}
                        </div>
                        <div>
                          <Link href={`/admin/students/${e.student.id}`} className="font-medium underline underline-offset-2 hover:text-primary">
                            {e.student.firstName} {e.student.lastName}
                          </Link>
                          <span className="ml-2 text-xs text-muted-foreground font-mono">{e.student.admissionNo}</span>
                        </div>
                      </div>
                      {e.student.rollNo != null && (
                        <span className="text-xs text-muted-foreground">Roll {e.student.rollNo}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {cls._count.students > 5 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Showing first 5 of {cls._count.students} students.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4" /> Teaching assignments ({cls._count.assignments})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cls.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {cls.assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                    <span>{a.subject.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.teacher.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
