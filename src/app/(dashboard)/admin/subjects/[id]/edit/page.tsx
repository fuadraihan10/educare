import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getSubject } from '@/lib/subjects'
import { updateSubject } from '@/lib/subjects/actions'
import { SubjectForm, type SubjectFormInitial } from '@/components/subjects/subject-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = { title: 'Edit Subject' }

export default async function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params
  const subject = await getSubject(id)
  if (!subject) notFound()

  const initial: SubjectFormInitial = { name: subject.name, code: subject.code, description: subject.description }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Edit ${subject.name}`}
        subtitle={<span className="font-mono text-xs">{subject.code}</span>}
        breadcrumb={
          <Link href={`/admin/subjects/${id}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> {subject.name}
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Subject Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <SubjectForm action={updateSubject.bind(null, id)} initial={initial} submitLabel="Save changes" />
        </CardContent>
      </Card>
    </div>
  )
}
