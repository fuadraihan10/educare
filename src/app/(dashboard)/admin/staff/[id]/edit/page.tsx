import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getTeacher } from '@/lib/staff'
import { updateStaff } from '@/lib/staff/actions'
import { StaffForm, type StaffFormInitial } from '@/components/staff/staff-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = { title: 'Edit Staff' }

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params

  const teacher = await getTeacher(id)
  if (!teacher) notFound()

  const initial: StaffFormInitial = {
    name: teacher.name,
    email: teacher.email ?? '',
    phone: teacher.phone,
    gender: teacher.gender,
    dob: teacher.dob,
    qualification: teacher.qualification,
    designation: teacher.designation,
    specialization: teacher.specialization,
    joinDate: teacher.joinDate,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Edit Teacher"
        subtitle={<>{teacher.name} · <span className="font-mono text-xs">{teacher.employeeId}</span></>}
        breadcrumb={
          <Link href={`/admin/staff/${id}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> {teacher.name}
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Staff Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <StaffForm
            action={updateStaff.bind(null, id)}
            initial={initial}
            submitLabel="Save changes"
            passwordLabel="Reset password"
          />
        </CardContent>
      </Card>
    </div>
  )
}
