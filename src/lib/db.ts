import '@/lib/env'

import 'server-only'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export type {
  User,
  Student,
  Teacher,
  Class,
  Subject,
  AcademicYear,
  Term,
  Enrollment,
  Attendance,
  Assessment,
  Mark,
  Invoice,
  Payment,
  Announcement,
} from '@/generated/prisma/client'

export async function disconnect(): Promise<void> {
  await prisma.$disconnect()
}

export {
  Role,
  UserStatus,
  Gender,
  StudentStatus,
  AdmissionStatus,
  EnrollmentStatus,
  AttendanceStatus,
  AssessmentType,
  DayOfWeek,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  AnnouncementAudience,
} from '@/generated/prisma/client'
