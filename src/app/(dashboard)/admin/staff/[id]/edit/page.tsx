import { notFound } from 'next/navigation'

import { requirePage } from '@/lib/permissions'
import { getTeacher } from '@/lib/staff'
import { updateStaff } from '@/lib/staff/actions'
import { StaffForm, type StaffFormInitial } from '@/components/staff/staff-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit teacher</h1>
        <p className="text-sm text-muted-foreground">
          {teacher.name} · <span className="font-mono">{teacher.employeeId}</span>
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Staff details</CardTitle>
        </CardHeader>
        <CardContent>
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
