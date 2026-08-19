import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

type NotificationType = 'info' | 'success' | 'warning' | 'error'
type NotificationCategory = 'admissions' | 'fees' | 'attendance' | 'exams' | 'announcements' | 'staff' | 'system' | 'security' | 'reports'

const categoryPrefMap: Record<string, string> = {
  admissions: 'notifAdmissions',
  fees: 'notifFeeAlerts',
  attendance: 'notifAttendanceAlerts',
  exams: 'notifExamResults',
  announcements: 'notifSystem',
  staff: 'notifStaffUpdates',
  system: 'notifSystem',
  security: 'notifSecurity',
  reports: 'notifReports',
}

type DeliverOpts = {
  userId: string
  title: string
  body: string
  type?: NotificationType
  category?: NotificationCategory
  entity?: string
  entityId?: string
  link?: string
}

export async function deliverNotification(opts: DeliverOpts) {
  const category = opts.category ?? 'system'

  const [user, prefs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: opts.userId },
      select: { id: true, role: true },
    }),
    prisma.userPreference.findUnique({
      where: { userId: opts.userId },
      select: {
        inAppNotifications: true,
        [categoryPrefMap[category] ?? 'notifSystem']: true,
      },
    }),
  ])

  if (!user) return

  const pref = prefs ?? {
    inAppNotifications: true,
    notifSystem: true,
  }

  const categoryEnabled = (pref as Record<string, boolean>)[categoryPrefMap[category] ?? 'notifSystem'] ?? true
  if (!categoryEnabled) {
    logger.debug({ userId: user.id, category }, '[notify] category disabled, skipping')
    return
  }

  if (!pref.inAppNotifications) return

  const notification = await prisma.notification.create({
    data: {
      userId: user.id,
      title: opts.title,
      body: opts.body,
      type: opts.type ?? 'info',
      category,
      entity: opts.entity ?? null,
      entityId: opts.entityId ?? null,
      link: opts.link ?? null,
    },
  })

  await prisma.notificationDelivery.create({
    data: { notificationId: notification.id, channel: 'in_app', status: 'sent', sentAt: new Date() },
  })
}

type BulkDeliverOpts = Omit<DeliverOpts, 'userId'>

export async function deliverNotificationToRole(
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT',
  opts: BulkDeliverOpts,
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
  await Promise.all(users.map((u) => deliverNotification({ ...opts, userId: u.id })))
}

export async function deliverNotificationToAll(
  opts: BulkDeliverOpts,
  audience?: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ALL',
) {
  const where: Record<string, unknown> = { status: 'ACTIVE' }
  if (audience && audience !== 'ALL') where.role = audience
  const users = await prisma.user.findMany({ where, select: { id: true } })
  await Promise.all(users.map((u) => deliverNotification({ ...opts, userId: u.id })))
}
