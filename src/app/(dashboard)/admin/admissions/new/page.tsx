import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listAcademicYears } from '@/lib/classes'
import { prisma } from '@/lib/db'
import { submitApplication } from '@/lib/admissions/actions'
import { AdmissionForm } from '@/components/admissions/admission-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'New Admission' }

export default async function NewAdmissionPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const [years, classes] = await Promise.all([
    listAcademicYears(),
    prisma.class.findMany({
      where: { academicYear: { isActive: true } },
      select: { id: true, name: true, section: true, code: true },
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
    }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="New Admission Application"
        subtitle="Submit a new student admission application."
        breadcrumb={
          <Link href="/admin/admissions" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Admissions
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Application Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AdmissionForm action={submitApplication} submitLabel="Submit Application" classes={classes} years={years} />
        </CardContent>
      </Card>
    </div>
  )
}
