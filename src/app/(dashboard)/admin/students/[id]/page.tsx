import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Pencil, FileBadge, Download, Trash2, ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getStudent } from '@/lib/students'
import { deleteStudentFile } from '@/lib/students/actions'
import { fullName, formatDate, formatSize } from '@/lib/format'
import { AdminPasswordReset } from '@/components/users/admin-password-reset'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StudentPhoto } from '@/components/students/student-photo'
import { DocumentUpload } from '@/components/students/document-upload'
import { DeactivateButton } from '@/components/students/deactivate-button'
import { DeleteButton } from '@/components/students/delete-button'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = { title: 'Student Profile' }

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
    ['Class', student.class ? `${student.class.name} · Section ${student.class.section}` : '—'],
    ['Roll number', student.rollNo != null ? String(student.rollNo) : '—'],
    ['Phone', student.phone ?? '—'],
    ['Email', student.email ?? '—'],
    ['Date of birth', formatDate(student.dob)],
    ['Gender', student.gender.toLowerCase()],
    ['Blood group', student.bloodGroup ?? '—'],
    ['Religion', student.religion ?? '—'],
    ['Nationality', student.nationality ?? '—'],
    ['Address', [student.address, student.city].filter(Boolean).join(', ') || '—'],
    ['Admission date', formatDate(student.admissionDate)],
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={name}
        subtitle={
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs">{student.admissionNo}</span>
            {student.class && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-xs">
                  {student.class.name} · Section {student.class.section}
                  {student.rollNo ? ` · Roll ${student.rollNo}` : ''}
                </span>
              </>
            )}
          </div>
        }
        breadcrumb={
          <Link href="/admin/students" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Students
          </Link>
        }
      >
        <Badge variant={isActive ? 'default' : 'destructive'} className="text-xs">{student.status}</Badge>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/students/${id}/edit`} />}>
          <Pencil /> Edit
        </Button>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/students/${id}/id-card`} />}>
          <FileBadge /> ID Card
        </Button>
        <DeactivateButton studentId={id} disabled={!isActive} />
        <DeleteButton studentId={id} studentName={name} />
      </PageHeader>

      <div className="flex items-start gap-4">
        <StudentPhoto storageKey={student.photoUrl} name={name} size={64} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {student.class ? `${student.class.name} · Section ${student.class.section}` : 'No class assigned'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList variant="line" className="w-full justify-start border-b rounded-none pb-0">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="guardian">Guardian</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollment History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="pt-4 space-y-4">
            <div className="glass-card rounded-2xl overflow-hidden border border-border/50 p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Personal Information</h3>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {info.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-border/50 p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Login Account</h3>
              {student.user ? (
                <div className="space-y-3">
                  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Registration No</dt>
                      <dd className="text-sm font-medium mt-0.5 font-mono">{student.user.regNo}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</dt>
                      <dd className="text-sm font-medium mt-0.5">{student.user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</dt>
                      <dd className="mt-0.5">
                        <Badge variant={student.user.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">{student.user.status}</Badge>
                      </dd>
                    </div>
                  </dl>
                  <div className="pt-2 border-t border-border/30">
                    <AdminPasswordReset userId={student.user.id} userName={name} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No login account linked.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="guardian">
          <div className="pt-4">
            <div className="glass-card rounded-2xl overflow-hidden border border-border/50 p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Guardian Information</h3>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {(
                  [
                    ['Name', student.guardianName],
                    ['Relation', student.guardianRelation],
                    ['Phone', student.guardianPhone],
                    ['Email', student.guardianEmail ?? '—'],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium mt-0.5">{value ?? '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="enrollments">
          <div className="pt-4 space-y-4">
            {student.enrollments.length === 0 ? (
              <div className="glass-card rounded-2xl overflow-hidden border border-border/50 p-6">
                <p className="text-sm text-muted-foreground text-center py-4">No enrollment history found.</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden border border-border/50 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Enrollment History</h3>
                {student.enrollments.map((en) => (
                  <div
                    key={en.id}
                    className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <span className="font-medium">{en.class.name} · Section {en.class.section}</span>
                      <span className="text-muted-foreground ml-2">— {en.academicYear.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{en.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="pt-4">
            <div className="glass-card rounded-2xl overflow-hidden border border-border/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Documents</h3>
                <DocumentUpload studentId={id} />
              </div>
              {student.files.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {student.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/30 bg-muted/20 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{file.originalName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
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
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
