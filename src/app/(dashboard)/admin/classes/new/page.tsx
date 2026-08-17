import { requirePage } from '@/lib/permissions'
import { listAcademicYears } from '@/lib/classes'
import { createClass } from '@/lib/classes/actions'
import { prisma } from '@/lib/db'
import { ClassForm } from '@/components/classes/class-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewClassPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  const [years, teachers] = await Promise.all([
    listAcademicYears(),
    prisma.teacher.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, employeeId: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add class</h1>
        <p className="text-sm text-muted-foreground">
          Create a new class section for an academic year.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Class details</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassForm
            action={createClass}
            submitLabel="Create class"
            years={years}
            teachers={teachers}
          />
        </CardContent>
      </Card>
    </div>
  )
}
