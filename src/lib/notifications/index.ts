import { prisma } from '@/lib/db'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export type NotificationCategory =
  | 'admissions'
  | 'fees'
  | 'attendance'
  | 'exams'
  | 'announcements'
  | 'staff'
  | 'system'
  | 'security'
  | 'reports'

type CreateNotificationOpts = {
  userId: string
  title: string
  body: string
  type?: NotificationType
  category?: NotificationCategory
  entity?: string
  entityId?: string
  link?: string
}

export async function createNotification(opts: CreateNotificationOpts) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      title: opts.title,
      body: opts.body,
      type: opts.type ?? 'info',
      category: opts.category ?? 'system',
      entity: opts.entity ?? null,
      entityId: opts.entityId ?? null,
      link: opts.link ?? null,
    },
  })
}

export async function createNotificationsForRole(
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT',
  opts: Omit<CreateNotificationOpts, 'userId'>,
  classId?: string,
) {
  const where: Record<string, unknown> = { role, status: 'ACTIVE' }
  if (classId && (role === 'STUDENT' || role === 'PARENT')) {
    if (role === 'STUDENT') {
      where.student = { classId, enrollments: { some: { status: 'ACTIVE' } } }
    } else {
      where.parentStudents = { some: { student: { classId, enrollments: { some: { status: 'ACTIVE' } } } } }
    }
  }
  const users = await prisma.user.findMany({ where, select: { id: true } })
  if (users.length === 0) return
  return prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title: opts.title,
      body: opts.body,
      type: opts.type ?? 'info',
      category: opts.category ?? 'system',
      entity: opts.entity ?? null,
      entityId: opts.entityId ?? null,
      link: opts.link ?? null,
    })),
  })
}

export async function createNotificationsForAll(
  opts: Omit<CreateNotificationOpts, 'userId'>,
  audience?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ALL',
) {
  const where: Record<string, unknown> = { status: 'ACTIVE' }
  if (audience && audience !== 'ALL') where.role = audience
  const users = await prisma.user.findMany({ where, select: { id: true } })
  if (users.length === 0) return
  return prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      title: opts.title,
      body: opts.body,
      type: opts.type ?? 'info',
      category: opts.category ?? 'system',
      entity: opts.entity ?? null,
      entityId: opts.entityId ?? null,
      link: opts.link ?? null,
    })),
  })
}

export async function getNotifications(userId: string, opts?: { unreadOnly?: boolean; limit?: number; offset?: number }) {
  const where: Record<string, unknown> = { userId }
  if (opts?.unreadOnly) where.readAt = null
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: opts?.offset ?? 0,
      take: opts?.limit ?? 50,
      include: { deliveries: { select: { channel: true, status: true, sentAt: true } } },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ])
  return { notifications, total, unreadCount }
}

export async function markAsRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date() },
  })
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}

export async function deleteNotification(userId: string, notificationId: string) {
  return prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  })
}

export async function deleteAllRead(userId: string) {
  return prisma.notification.deleteMany({
    where: { userId, readAt: { not: null } },
  })
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } })
}

export { deliverNotification, deliverNotificationToRole, deliverNotificationToAll } from '@/lib/notifications/deliver'
