'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

import { getNotificationUnreadCount } from '@/lib/notifications/actions'

export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    getNotificationUnreadCount().then((c) => {
      if (!cancelled) setCount(c)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <Link
      href="/notifications"
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-150"
      title="Notifications"
    >
      <Bell className="size-4" />
      {count !== null && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-sm">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
