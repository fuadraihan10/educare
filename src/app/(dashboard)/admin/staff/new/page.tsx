import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { createStaff } from '@/lib/staff/actions'
import { StaffForm } from '@/components/staff/staff-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'New Staff' }

export default async function NewStaffPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Add Teacher"
        subtitle="An employee ID and a teacher login account are created automatically."
        breadcrumb={
          <Link href="/admin/staff" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Staff
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Staff Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <StaffForm action={createStaff} submitLabel="Create Teacher" passwordLabel="Temporary password *" />
        </CardContent>
      </Card>
    </div>
  )
}
