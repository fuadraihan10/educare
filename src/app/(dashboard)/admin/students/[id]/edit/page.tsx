import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { getStudent, fullName } from '@/lib/students'
import { updateStudent } from '@/lib/students/actions'
import { StudentForm, type StudentFormInitial } from '@/components/students/student-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = { title: 'Edit Student' }

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params

  const [student, classes] = await Promise.all([
    getStudent(id),
    prisma.class.findMany({
      where: { academicYear: { isActive: true } },
      select: { id: true, name: true, section: true },
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
    }),
  ])
  if (!student) notFound()

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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Edit Student"
        subtitle={<>{fullName(student)} · <span className="font-mono text-xs">{student.admissionNo}</span></>}
        breadcrumb={
          <Link href={`/admin/students/${id}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> {fullName(student)}
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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
