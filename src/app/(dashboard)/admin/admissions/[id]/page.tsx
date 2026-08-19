import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getAdmission } from '@/lib/admissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ApproveButton, RejectForm } from '@/components/admissions/admission-actions'
import { admissionStatusVariant } from '@/lib/status-variants'

import dayjs from 'dayjs'

export const metadata: Metadata = { title: 'Application Details' }

export default async function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params
  const app = await getAdmission(id)
  if (!app) notFound()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={app.applicantName}
        subtitle={<div className="flex items-center gap-2 mt-1"><span className="text-xs">Applied to</span> <span className="text-xs font-medium">{app.appliedClass.name}</span> <Badge variant="secondary" className="text-xs">{app.appliedClass.section}</Badge></div>}
        breadcrumb={
          <Link href="/admin/admissions" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Admissions
          </Link>
        }
      >
        <Badge variant={admissionStatusVariant[app.status] ?? 'outline'} className="text-xs">{app.status}</Badge>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-semibold">Applicant Info</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Date of Birth</dt>
                <dd className="text-sm font-medium mt-0.5">{dayjs(app.dob).format('DD MMM YYYY')}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Gender</dt>
                <dd className="text-sm font-medium mt-0.5">{app.gender}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Phone</dt>
                <dd className="text-sm font-medium mt-0.5">{app.phone}</dd>
              </div>
              {app.email && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</dt>
                  <dd className="text-sm font-medium mt-0.5">{app.email}</dd>
                </div>
              )}
              {app.address && (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Address</dt>
                  <dd className="text-sm font-medium mt-0.5">{app.address}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-semibold">Guardian Info</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Name</dt>
                <dd className="text-sm font-medium mt-0.5">{app.guardianName}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Relation</dt>
                <dd className="text-sm font-medium mt-0.5">{app.guardianRelation}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Phone</dt>
                <dd className="text-sm font-medium mt-0.5">{app.guardianPhone}</dd>
              </div>
              {app.guardianEmail && (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</dt>
                  <dd className="text-sm font-medium mt-0.5">{app.guardianEmail}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Application Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Academic Year</dt>
              <dd className="text-sm font-medium mt-0.5">{app.academicYear.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Applied On</dt>
              <dd className="text-sm font-medium mt-0.5">{dayjs(app.createdAt).format('DD MMM YYYY')}</dd>
            </div>
            {app.reviewedBy && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Reviewed By</dt>
                <dd className="text-sm font-medium mt-0.5">{app.reviewedBy.name}</dd>
              </div>
            )}
            {app.reviewedAt && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Reviewed On</dt>
                <dd className="text-sm font-medium mt-0.5">{dayjs(app.reviewedAt).format('DD MMM YYYY')}</dd>
              </div>
            )}
            {app.remarks && (
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Remarks</dt>
                <dd className="text-sm font-medium mt-0.5">{app.remarks}</dd>
              </div>
            )}
            {app.studentId && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Student</dt>
                <dd className="text-sm font-medium mt-0.5"><Link href={`/admin/students/${app.studentId}`} className="underline underline-offset-2 hover:text-primary">View student record</Link></dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {app.status === 'PENDING' && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-semibold">Review Application</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <ApproveButton id={id} />
            <Separator className="opacity-50" />
            <RejectForm id={id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
