import { requirePage } from '@/lib/permissions'
import { createStaff } from '@/lib/staff/actions'
import { StaffForm } from '@/components/staff/staff-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewStaffPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add teacher</h1>
        <p className="text-sm text-muted-foreground">
          An employee ID and a teacher login account are created automatically.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Staff details</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffForm action={createStaff} submitLabel="Create teacher" passwordLabel="Temporary password *" />
        </CardContent>
      </Card>
    </div>
  )
}
