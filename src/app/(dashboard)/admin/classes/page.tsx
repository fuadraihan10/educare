import Link from 'next/link'
import { Search, Plus } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listClasses, listAcademicYears } from '@/lib/classes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

const PAGE_SIZE = 20

const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground">{total} class{total === 1 ? '' : 'es'}{year ? '' : activeYear ? ` in ${activeYear.name}` : ''}</p>
        </div>
        <Button render={<Link href="/admin/classes/new" />}>
          <Plus /> Add class
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <form action="/admin/classes" method="GET" className="flex gap-2">
          {year && <input type="hidden" name="year" value={year} />}
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by name, section, code or room…"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>

        <form action="/admin/classes" method="GET" className="flex gap-2">
          {q && <input type="hidden" name="q" value={q} />}
          <select name="year" className={selectClass} defaultValue={year}>
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}{y.isActive ? ' (active)' : ''}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class list</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
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
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No classes found.
                  </TableCell>
                </TableRow>
              )}
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.code}</TableCell>
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
