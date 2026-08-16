import { notFound } from 'next/navigation'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { getStudent, fullName } from '@/lib/students'
import { updateStudent } from '@/lib/students/actions'
import { StudentForm, type StudentFormInitial } from '@/components/students/student-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params

  const student = await getStudent(id)
  if (!student) notFound()

  const classes = await prisma.class.findMany({
    where: { academicYear: { isActive: true } },
    select: { id: true, name: true, section: true },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  })

  const initial: StudentFormInitial = {
    firstName: student.firstName,
    middleName: student.middleName,
    lastName: student.lastName,
    dob: student.dob,
    gender: student.gender,
    bloodGroup: student.bloodGroup,
    religion: student.religion,
    nationality: student.nationality,
    address: student.address,
    city: student.city,
    phone: student.phone,
    email: student.email,
    guardianName: student.guardianName,
    guardianRelation: student.guardianRelation,
    guardianPhone: student.guardianPhone,
    guardianEmail: student.guardianEmail,
    classId: student.classId,
    photoUrl: student.photoUrl,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit student</h1>
        <p className="text-sm text-muted-foreground">
          {fullName(student)} · <span className="font-mono">{student.admissionNo}</span>
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student details</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm
            action={updateStudent.bind(null, id)}
            classes={classes}
            initial={initial}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>
    </div>
  )
}
