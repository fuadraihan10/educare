'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Bell, Check, CheckCheck, Trash2,
  Info, CheckCircle, AlertTriangle, XCircle, ChevronRight,
  Loader2, BellOff, Monitor,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from '@/lib/notifications/actions'
import type { Notification, NotificationDelivery } from '@/generated/prisma/client'

type NotificationWithDeliveries = Notification & { deliveries: Pick<NotificationDelivery, 'channel' | 'status' | 'sentAt'>[] }

type Props = {
  notifications: NotificationWithDeliveries[]
  total: number
  unreadCount: number
}

const typeIcon: Record<string, typeof Bell> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

const typeColor: Record<string, string> = {
  info: 'text-blue-500 bg-blue-500/10',
  success: 'text-emerald-500 bg-emerald-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  error: 'text-red-500 bg-red-500/10',
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export function NotificationsClient({ notifications: initial, total, unreadCount: initialUnread }: Props) {
  const [notifications, setNotifications] = useState<NotificationWithDeliveries[]>(initial)
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.readAt) : notifications

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })))
      setUnreadCount(0)
    })
  }

  function handleDelete(id: string) {
    setDeleting(id)
    startTransition(async () => {
      await deleteNotification(id)
      setNotifications((prev) => {
        const n = prev.find((x) => x.id === id)
        const next = prev.filter((x) => x.id !== id)
        if (n && !n.readAt) setUnreadCount((c) => Math.max(0, c - 1))
        return next
      })
      setDeleting(null)
    })
  }

  function handleDeleteAllRead() {
    startTransition(async () => {
      await deleteAllReadNotifications()
      setNotifications((prev) => prev.filter((n) => !n.readAt))
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Bell className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? (
                <span className="font-semibold text-foreground">{unreadCount} unread</span>
              ) : (
                'All caught up'
              )}
              {' '}&middot; {total} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/50 bg-background/50 p-0.5">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isPending} className="text-xs gap-1.5">
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDeleteAllRead} disabled={isPending} className="text-xs gap-1.5 text-muted-foreground">
            <Trash2 className="size-3.5" />
            Clear read
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <BellOff className="mx-auto size-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {filter === 'unread' ? 'You\'re all caught up!' : 'Notifications will appear here when there\'s activity.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = typeIcon[n.type] ?? Info
            const colors = typeColor[n.type] ?? typeColor.info
            const isUnread = !n.readAt
            return (
              <div
                key={n.id}
                className={`glass-card rounded-xl px-4 py-3 flex items-start gap-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] ${
                  isUnread ? 'border-l-2 border-l-primary' : 'opacity-70'
                }`}
              >
                <div className={`mt-0.5 rounded-lg p-1.5 shrink-0 ${colors}`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${isUnread ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    {isUnread && <span className="shrink-0 size-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground/60">{timeAgo(n.createdAt)}</span>
                    {n.entity && (
                      <span className="text-[10px] rounded-md bg-muted/50 px-1.5 py-0.5 text-muted-foreground">
                        {n.entity}
                      </span>
                    )}
                    {n.link && (
                      <Link href={n.link} className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                        View <ChevronRight className="size-2.5" />
                      </Link>
                    )}
                  </div>
                  {n.deliveries.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {n.deliveries.map((d, i) => {
                        const chipColor = d.status === 'sent' ? 'text-emerald-600 bg-emerald-500/10' : d.status === 'failed' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground bg-muted/50'
                        return (
                          <span key={`${d.channel}-${i}`} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${chipColor}`}>
                            <Monitor className="size-2.5" />
                            In-app
                            {d.status === 'failed' && ' (failed)'}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(n.id)}
                      disabled={isPending}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title="Mark as read"
                    >
                      <Check className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(n.id)}
                    disabled={deleting === n.id}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    {deleting === n.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
