import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { createStudent } from '@/lib/students/actions'
import { StudentForm } from '@/components/students/student-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewStudentPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  const classes = await prisma.class.findMany({
    where: { academicYear: { isActive: true } },
    select: { id: true, name: true, section: true },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add student</h1>
        <p className="text-sm text-muted-foreground">
          A unique admission number is generated automatically.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student details</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm action={createStudent} classes={classes} submitLabel="Create student" />
        </CardContent>
      </Card>
    </div>
  )
}
