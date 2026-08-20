import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, UserPlus, GraduationCap } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listStudents, fullName } from '@/lib/students'
import { listClasses } from '@/lib/classes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { userStatusVariant } from '@/lib/status-variants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { StudentPhoto } from '@/components/students/student-photo'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { selectClass } from '@/components/form-helpers'

export const metadata: Metadata = { title: 'Students' }

const PAGE_SIZE = 20

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; gender?: string; classId?: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const page = Math.max(1, Number(params.page) || 1)
  const status = typeof params.status === 'string' ? params.status : ''
  const gender = typeof params.gender === 'string' ? params.gender : ''
  const classId = typeof params.classId === 'string' ? params.classId : ''

  const [{ students, total }, { classes }] = await Promise.all([
    listStudents({ q, page, pageSize: PAGE_SIZE, status: status || undefined, gender: gender || undefined, classId: classId || undefined }),
    listClasses({ pageSize: 200 }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function href(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (gender) sp.set('gender', gender)
    if (classId) sp.set('classId', classId)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/students${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Students"
        subtitle={`${total} students enrolled`}
        action={
          <Button render={<Link href="/admin/students/new" />}>
            <UserPlus /> Add student
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <form action="/admin/students" method="GET" className="flex items-end gap-3">
          {status && <input type="hidden" name="status" value={status} />}
          {gender && <input type="hidden" name="gender" value={gender} />}
          {classId && <input type="hidden" name="classId" value={classId} />}
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by name or admission no…"
              className="pl-9 glass-input rounded-xl"
              aria-label="Search students"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <form action="/admin/students" method="GET" className="flex flex-wrap items-end gap-3">
          {q && <input type="hidden" name="q" value={q} />}
          <div>
            <Label htmlFor="stu-status">Status</Label>
            <select id="stu-status" name="status" className={selectClass} defaultValue={status}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="GRADUATED">Graduated</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
          <div>
            <Label htmlFor="stu-gender">Gender</Label>
            <select id="stu-gender" name="gender" className={selectClass} defaultValue={gender}>
              <option value="">All genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="stu-class">Class</Label>
            <select id="stu-class" name="classId" className={selectClass} defaultValue={classId}>
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} · Section {c.section}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Student list</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Student</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <EmptyState
                      icon={GraduationCap}
                      title="No students found"
                      description="There are no students matching your criteria."
                    />
                  </TableCell>
                </TableRow>
              )}
              {students.map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <StudentPhoto storageKey={null} name={fullName(s)} size={32} />
                      <div className="font-medium">{fullName(s)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                  <TableCell>
                    {s.class ? `${s.class.name} · Section ${s.class.section}` : '—'}
                  </TableCell>
                  <TableCell>{s.rollNo ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={userStatusVariant[s.status] ?? 'secondary'}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/students/${s.id}`} />}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={href(page - 1)} />
              </PaginationItem>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink href={href(p)} isActive={p === page}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={href(page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
