'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/permissions'
import {
  markAsRead as dbMarkAsRead,
  markAllAsRead as dbMarkAllAsRead,
  deleteNotification as dbDeleteNotification,
  deleteAllRead as dbDeleteAllRead,
  getUnreadCount as dbGetUnreadCount,
} from '@/lib/notifications'

export async function markNotificationRead(id: string) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  await dbMarkAsRead(user.id, id)
  revalidatePath('/notifications')
  revalidatePath('/')
}

export async function markAllNotificationsRead() {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  await dbMarkAllAsRead(user.id)
  revalidatePath('/notifications')
  revalidatePath('/')
}

export async function deleteNotification(id: string) {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  await dbDeleteNotification(user.id, id)
  revalidatePath('/notifications')
}

export async function deleteAllReadNotifications() {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  await dbDeleteAllRead(user.id)
  revalidatePath('/notifications')
}

export async function getNotificationUnreadCount() {
  const user = await requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  return dbGetUnreadCount(user.id)
}
