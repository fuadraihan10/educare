import type { Metadata } from 'next'
import { Bell } from 'lucide-react'

import { requireRole } from '@/lib/permissions'
import { getNotifications } from '@/lib/notifications'
import { NotificationsClient } from './notifications-client'

export const metadata: Metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  const { notifications, total, unreadCount } = await getNotifications(user.id, { limit: 100 })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Bell className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on school activity</p>
        </div>
      </div>

      <NotificationsClient notifications={notifications} total={total} unreadCount={unreadCount} />
    </div>
  )
}
