import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { createSubject } from '@/lib/subjects/actions'
import { SubjectForm } from '@/components/subjects/subject-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'New Subject' }

export default async function NewSubjectPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Add Subject"
        subtitle="Create a new subject course."
        breadcrumb={
          <Link href="/admin/subjects" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Subjects
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Subject Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <SubjectForm action={createSubject} submitLabel="Create Subject" />
        </CardContent>
      </Card>
    </div>
  )
}
