import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getSubject } from '@/lib/subjects'
import { deleteSubject } from '@/lib/subjects/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export const metadata: Metadata = { title: 'Subject Details' }

export default async function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params
  const subject = await getSubject(id)
  if (!subject) notFound()
  const canDelete = subject.assignments.length === 0

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={subject.name}
        subtitle={<span className="font-mono text-xs">{subject.code}</span>}
        breadcrumb={
          <Link href="/admin/subjects" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Subjects
          </Link>
        }
      >
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/subjects/${id}/edit`} />}><Pencil /> Edit</Button>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm"><Trash2 /> Delete</Button>} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this subject?</AlertDialogTitle>
                <AlertDialogDescription>This subject has no assignments and can be safely removed.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <form action={deleteSubject.bind(null, id)}>
                  <AlertDialogAction type="submit" variant="destructive">Delete</AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-semibold">Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Code</dt>
                  <dd className="text-sm font-medium font-mono mt-0.5">{subject.code}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Assignments</dt>
                  <dd className="text-sm font-medium mt-0.5">{subject.assignments.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>Teaching Assignments ({subject.assignments.length})</span>
                <Button size="sm" render={<Link href="/admin/subjects/assignments/new" />}><Plus /> Assign Teacher</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {subject.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No assignments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {subject.assignments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 px-4 py-3 text-sm transition-colors hover:bg-muted/40">
                      <div className="flex items-center gap-3">
                        <span className="text-xs">{a.class.name}</span> <Badge variant="secondary" className="text-xs">{a.class.section}</Badge>
                        <span className="font-medium">{a.teacher.name} <span className="text-xs text-muted-foreground">({a.teacher.employeeId})</span></span>
                      </div>
                      <span className="text-xs text-muted-foreground">{a.academicYear.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
