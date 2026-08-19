import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, Plus, BookOpen } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listClasses, listAcademicYears } from '@/lib/classes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { PageHeader } from '@/components/page-header'
import { Label } from '@/components/ui/label'
import { selectClass } from '@/components/form-helpers'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Classes' }

const PAGE_SIZE = 20

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; year?: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const page = Math.max(1, Number(params.page) || 1)
  const year = typeof params.year === 'string' ? params.year : ''

  const [years, { classes, total }] = await Promise.all([
    listAcademicYears(),
    listClasses({ q, page, pageSize: PAGE_SIZE, academicYearId: year || undefined }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeYear = years.find((y) => y.isActive)

  function href(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (year) sp.set('year', year)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/classes${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Classes"
        subtitle={`${total} class${total === 1 ? '' : 'es'}${year ? '' : activeYear ? ` in ${activeYear.name}` : ''}`}
        action={
          <Button render={<Link href="/admin/classes/new" />}>
            <Plus /> Add class
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <form action="/admin/classes" method="GET" className="flex items-end gap-3">
          {year && <input type="hidden" name="year" value={year} />}
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by name, section, code or room…"
              className="pl-9"
              aria-label="Search classes"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>

        <form action="/admin/classes" method="GET" className="flex items-end gap-3">
          {q && <input type="hidden" name="q" value={q} />}
          <div>
            <Label htmlFor="year">Academic year</Label>
            <select id="year" name="year" className={selectClass} defaultValue={year}>
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}{y.isActive ? ' (active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Class list</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    <EmptyState
                      icon={BookOpen}
                      title="No classes found"
                      description="There are no classes matching your criteria."
                    />
                  </TableCell>
                </TableRow>
              )}
              {classes.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.section}</TableCell>
                  <TableCell className="text-xs">{c.room ?? '—'}</TableCell>
                  <TableCell className="text-xs">
                    {c.classTeacher ? c.classTeacher.name : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>{c._count.students}</TableCell>
                  <TableCell className="text-xs">{c.academicYear.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/classes/${c.id}`} />}>
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
