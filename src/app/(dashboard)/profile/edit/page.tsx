import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/page-header'
import { EditProfileForm } from './edit-profile-form'

export const metadata: Metadata = { title: 'Edit Profile' }

export default async function EditProfilePage() {
  const user = await requirePage('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')

  const [student, teacher] = await Promise.all([
    user.role === 'STUDENT' ? prisma.student.findUnique({
      where: { userId: user.id },
      select: { firstName: true, lastName: true, admissionNo: true, rollNo: true, dob: true, gender: true, phone: true, address: true, class: { select: { name: true, section: true, code: true } } },
    }) : null,
    user.role === 'TEACHER' ? prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { employeeId: true, designation: true, specialization: true, qualification: true },
    }) : null,
  ])

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Edit Profile"
        subtitle="Update your personal information"
      >
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back to profile
        </Link>
      </PageHeader>
      <EditProfileForm user={user} student={student} teacher={teacher} />
    </div>
  )
}
