import Link from 'next/link'
import type { Metadata } from 'next'
import { Plus, Search, Bell } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listAnnouncements } from '@/lib/announcements'
import { deleteAnnouncement } from '@/lib/announcements/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AnnouncementCard } from '@/components/announcements/announcement-card'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Announcements' }

const PAGE_SIZE = 20

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const page = Math.max(1, Number(params.page) || 1)
  const { announcements, total } = await listAnnouncements({ q, page, pageSize: PAGE_SIZE })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function href(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/announcements${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Announcements"
        subtitle={`${total} announcement${total === 1 ? '' : 's'}`}
        action={<Button render={<Link href="/admin/announcements/new" />}><Plus /> New announcement</Button>}
      />
      <form action="/admin/announcements" method="GET" className="flex flex-wrap items-end gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search announcements…" className="pl-9" aria-label="Search announcements" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">All announcements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {announcements.length === 0 && (
            <EmptyState
              icon={Bell}
              title="No announcements"
              description="There are no announcements at this time."
            />
          )}
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              showDeleteAction={true}
              deleteAction={deleteAnnouncement.bind(null, a.id)}
            />
          ))}
        </CardContent>
      </Card>
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && <PaginationItem><PaginationPrevious href={href(page - 1)} /></PaginationItem>}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <PaginationItem key={p}><PaginationLink href={href(p)} isActive={p === page}>{p}</PaginationLink></PaginationItem>)}
            {page < totalPages && <PaginationItem><PaginationNext href={href(page + 1)} /></PaginationItem>}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
