import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getAssessment } from '@/lib/exams'
import { deleteAssessment, publishAssessment, unpublishAssessment } from '@/lib/exams/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export const metadata: Metadata = { title: 'Assessment Details' }

export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params
  const a = await getAssessment(id)
  if (!a) notFound()
  const canDelete = a.marks.length === 0

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={a.name}
        subtitle={<div className="flex items-center gap-2 mt-1"><span className="text-xs">{a.class.name}</span> <Badge variant="secondary" className="text-xs">{a.class.section}</Badge> <span className="text-xs">{a.subject.name} — {a.term.name}</span></div>}
        breadcrumb={
          <Link href="/admin/exams" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Exams
          </Link>
        }
      >
        <Badge variant={a.isPublished ? 'default' : 'outline'} className="text-xs">{a.isPublished ? 'Published' : 'Draft'}</Badge>
        <Button variant="outline" size="sm" render={<Link href={`/admin/exams/${id}/marks`}>Enter marks</Link>}>Enter marks</Button>
        {!a.isPublished ? (
          <form action={publishAssessment.bind(null, id)}><Button variant="outline" size="sm" type="submit"><Eye /> Publish</Button></form>
        ) : (
          <form action={unpublishAssessment.bind(null, id)}><Button variant="outline" size="sm" type="submit"><EyeOff /> Unpublish</Button></form>
        )}
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" size="sm"><Trash2 /> Delete</Button>} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this assessment?</AlertDialogTitle>
                <AlertDialogDescription>This assessment has no marks and can be safely removed.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <form action={deleteAssessment.bind(null, id)}><AlertDialogAction type="submit" variant="destructive">Delete</AlertDialogAction></form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Type', value: a.type, large: false },
          { label: 'Max Marks', value: String(a.maxMarks), large: true },
          { label: 'Weight', value: String(a.weight), large: false },
          { label: 'Marks Entered', value: String(a.marks.length), large: true },
        ].map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={stat.large ? 'text-2xl font-bold' : 'text-sm font-medium'}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {a.marks.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-semibold">Marks</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="glass-table rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Roll</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Student</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Marks</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Grade</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Grade Point</th>
                  </tr>
                </thead>
                <tbody>
                  {a.marks.map((m) => (
                    <tr key={m.id} className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{m.student.rollNo ?? '—'}</td>
                      <td className="px-4 py-3 font-medium">{m.student.firstName} {m.student.lastName}</td>
                      <td className="px-4 py-3">{String(m.marksObtained)} / {String(a.maxMarks)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={m.grade === 'F' ? 'destructive' : m.grade === 'A+' || m.grade === 'A' ? 'default' : 'secondary'} className="text-xs">{m.grade ?? '—'}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">{m.gradePoint != null ? Number(m.gradePoint).toFixed(1) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {a.marks.length > 1 && (
              <div className="flex flex-wrap items-center gap-4 border-t border-border/30 bg-muted/20 px-6 py-3 text-xs text-muted-foreground">
                <span>{a.marks.length} students</span>
                <span className="tabular-nums">Avg GPA: <strong className="text-foreground">{(a.marks.reduce((s, m) => s + (m.gradePoint != null ? Number(m.gradePoint) : 0), 0) / a.marks.length).toFixed(2)}</strong></span>
                {a.marks.filter((m) => m.grade === 'A+').length > 0 && <span className="text-emerald-600 dark:text-emerald-400">{a.marks.filter((m) => m.grade === 'A+').length}× A+</span>}
                {a.marks.filter((m) => m.grade === 'F').length > 0 && <span className="text-destructive">{a.marks.filter((m) => m.grade === 'F').length}× F</span>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
