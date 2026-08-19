import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Pencil, Trash2, Users, BookOpen, ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getClass } from '@/lib/classes'
import { deleteClass } from '@/lib/classes/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
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

export const metadata: Metadata = { title: 'Class Details' }

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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={cls.name}
        subtitle={<>Section {cls.section}{cls.room ? ` · ${cls.room}` : ''}</>}
        breadcrumb={
          <Link href="/admin/classes" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Classes
          </Link>
        }
      >
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
                  <AlertDialogAction type="submit" variant="destructive">Delete</AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-semibold">Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Code</dt>
                  <dd className="text-sm font-medium font-mono mt-0.5">{cls.code}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Room</dt>
                  <dd className="text-sm font-medium mt-0.5">{cls.room ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Academic Year</dt>
                  <dd className="text-sm font-medium mt-0.5">{cls.academicYear.name}{cls.academicYear.isActive ? ' (active)' : ''}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Class Teacher</dt>
                  <dd className="text-sm font-medium mt-0.5">
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

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="size-4" /> Students ({cls._count.students})
              </CardTitle>
              {cls._count.students > 0 && (
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/classes/${id}/students`}>View All</Link>} />
              )}
            </CardHeader>
            <CardContent className="p-6">
              {cls.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No students enrolled.</p>
              ) : (
                <ul className="space-y-2">
                  {cls.enrollments.map((e) => (
                    <li key={e.id} className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 px-4 py-3 text-sm transition-colors hover:bg-muted/40">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
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
                <p className="mt-3 text-xs text-muted-foreground text-center">
                  Showing first 5 of {cls._count.students} students.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden h-fit">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="size-4" /> Teaching Assignments ({cls._count.assignments})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            {cls.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No assignments yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {cls.assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40">
                    <span className="font-medium">{a.subject.name}</span>
                    <span className="text-xs text-muted-foreground">{a.teacher.name}</span>
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
