import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const audienceVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  ALL: 'default', ADMIN: 'secondary', TEACHER: 'secondary', STUDENT: 'outline', PARENT: 'outline',
}

export function AnnouncementCard({ announcement, showDeleteAction, deleteAction }: {
  announcement: {
    id: string; title: string; body: string; audience: string; createdAt: Date
    createdBy: { name: string }
    class: { code: string; name: string; section: string } | null
  }
  showDeleteAction?: boolean
  deleteAction?: () => Promise<void>
}) {
  return (
    <div className="glass-card rounded-xl border-l-3 border-l-primary/40 p-4 space-y-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{announcement.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            by {announcement.createdBy.name} · {dayjs(announcement.createdAt).format('DD MMM YYYY, h:mm A')}
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Badge variant={audienceVariant[announcement.audience] ?? 'outline'}>{announcement.audience}</Badge>
          {announcement.class && <Badge variant="secondary">{announcement.class.name} · Section {announcement.class.section}</Badge>}
        </div>
      </div>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{announcement.body}</p>
      {showDeleteAction && deleteAction && (
        <form action={deleteAction} className="pt-1">
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="size-3" />
            Delete
          </Button>
        </form>
      )}
    </div>
  )
}
