import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil, FileBadge, Download, Trash2 } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getStudent } from '@/lib/students'
import { deleteStudentFile } from '@/lib/students/actions'
import { fullName, formatDate, formatSize } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StudentPhoto } from '@/components/students/student-photo'
import { DocumentUpload } from '@/components/students/document-upload'
import { DeactivateButton } from '@/components/students/deactivate-button'

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params

  const student = await getStudent(id)
  if (!student) notFound()

  const name = fullName(student)
  const isActive = student.status === 'ACTIVE'

  const info: [string, string][] = [
    ['Date of birth', formatDate(student.dob)],
    ['Gender', student.gender.toLowerCase()],
    ['Blood group', student.bloodGroup ?? '—'],
    ['Religion', student.religion ?? '—'],
    ['Nationality', student.nationality ?? '—'],
    ['Phone', student.phone ?? '—'],
    ['Email', student.email ?? '—'],
    ['Address', [student.address, student.city].filter(Boolean).join(', ') || '—'],
    ['Admission date', formatDate(student.admissionDate)],
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <StudentPhoto storageKey={student.photoUrl} name={name} size={56} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{student.admissionNo}</span>
              {student.class && (
                <>
                  <Separator orientation="vertical" className="h-3" />
                  <span>
                    {student.class.name} {student.class.section}
                    {student.rollNo ? ` · Roll ${student.rollNo}` : ''}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isActive ? 'default' : 'destructive'}>{student.status}</Badge>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/students/${id}/edit`} />}>
            <Pencil /> Edit
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/students/${id}/id-card`} />}>
            <FileBadge /> ID card
          </Button>
          <DeactivateButton studentId={id} disabled={!isActive} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {info.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guardian</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {(
                  [
                    ['Name', student.guardianName],
                    ['Relation', student.guardianRelation],
                    ['Phone', student.guardianPhone],
                    ['Email', student.guardianEmail ?? '—'],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {student.enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Enrollment history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {student.enrollments.map((en) => (
                  <div
                    key={en.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>
                      {en.class.name} {en.class.section} — {en.academicYear.name}
                    </span>
                    <Badge variant="outline">{en.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DocumentUpload studentId={id} />
            {student.files.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            )}
            <ul className="space-y-2">
              {student.files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{file.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.category.replace('_', ' ').toLowerCase()} · {formatSize(file.size)} ·{' '}
                      {file.uploadedBy.name} · {formatDate(file.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      nativeButton={false}
                      render={<a href={`/api/uploads/${file.storageKey}`} target="_blank" rel="noreferrer" />}
                    >
                      <Download />
                    </Button>
                    <form action={deleteStudentFile.bind(null, file.id)}>
                      <Button variant="ghost" size="icon" type="submit" aria-label="Delete file">
                        <Trash2 className="text-destructive" />
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
