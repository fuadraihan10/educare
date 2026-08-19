import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, UserPlus, Users } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listStaff } from '@/lib/staff'
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
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { staffStatusVariant } from '@/lib/status-variants'

export const metadata: Metadata = { title: 'Staff' }

const PAGE_SIZE = 20

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const page = Math.max(1, Number(params.page) || 1)

  const { staff, total } = await listStaff({ q, page, pageSize: PAGE_SIZE })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function href(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/staff${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Staff"
        subtitle={`${total} teacher${total === 1 ? '' : 's'}`}
        action={
          <Button render={<Link href="/admin/staff/new" />}>
            <UserPlus /> Add teacher
          </Button>
        }
      />

      <form action="/admin/staff" method="GET" className="flex flex-wrap items-end gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by name, employee id or designation…"
            className="pl-9"
            aria-label="Search staff"
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Staff list</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Login email</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    <EmptyState
                      icon={Users}
                      title="No teachers found"
                      description="There are no teachers matching your criteria."
                    />
                  </TableCell>
                </TableRow>
              )}
              {staff.map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {s.name.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
                      </div>
                      <div className="font-medium">{s.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.employeeId}</TableCell>
                  <TableCell>{s.designation ?? '—'}</TableCell>
                  <TableCell className="text-xs">{s.email ?? '—'}</TableCell>
                  <TableCell>
                    {s.classesTaught.length === 0
                      ? '—'
                      : s.classesTaught.map((c) => `${c.name} ${c.section}`).join(', ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={staffStatusVariant[s.status] ?? 'secondary'}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/staff/${s.id}`} />}>
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
