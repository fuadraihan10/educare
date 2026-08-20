import 'server-only'

import { Prisma } from '@/generated/prisma/client'

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

const entityCategoryMap: Record<string, string> = {
  User: 'auth',
  UserSession: 'security',
  UserPreference: 'profile',
  Teacher: 'staff',
  Student: 'students',
  StudentFile: 'students',
  Class: 'academics',
  Subject: 'academics',
  TeacherAssignment: 'academics',
  Assessment: 'academics',
  Attendance: 'academics',
  TimetableEntry: 'academics',
  AcademicYear: 'admin',
  Term: 'admin',
  GradeScale: 'admin',
  School: 'admin',
  Invoice: 'finance',
  Payment: 'finance',
  FeeStructure: 'finance',
  AdmissionApplication: 'admissions',
  Announcement: 'general',
}

const actionResultMap: Record<string, string> = {
  LOGIN_FAILED: 'failure',
  DELETE: 'success',
  DEACTIVATE: 'warning',
  INACTIVATE: 'warning',
  REJECT: 'warning',
  REJECT_PAYMENT: 'warning',
}

export interface AuditParams {
  actorId?: string | null
  actorRole?: string | null
  action: string
  entity: string
  entityId?: string | null
  details?: Prisma.InputJsonValue
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
  beforeState?: Prisma.InputJsonValue | null
  afterState?: Prisma.InputJsonValue | null
  category?: string
  result?: string
  device?: string
}

export function auditLog(params: AuditParams): void {
  const {
    actorId,
    action,
    entity,
    entityId,
    details,
    ipAddress,
    userAgent,
    requestId,
    beforeState,
    afterState,
    category: categoryOverride,
    result: resultOverride,
    device,
  } = params

  const merged: Record<string, unknown> = {
    ...(details && typeof details === 'object' ? (details as Record<string, unknown>) : {}),
    ...(ipAddress ? { ipAddress } : {}),
    ...(userAgent ? { userAgent } : {}),
    ...(requestId ? { requestId } : {}),
    ...(beforeState ? { beforeState } : {}),
    ...(afterState ? { afterState } : {}),
  }

  prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      details: Object.keys(merged).length > 0
        ? merged as unknown as Prisma.InputJsonValue
        : Prisma.JsonNull,
    },
  }).catch((err) => {
    logger.error({ err }, 'Failed to write audit log')
  })

  if (actorId) {
    let category = categoryOverride
    if (!category) {
      if (entity === 'User') {
        category = action.startsWith('UPDATE_') || action.startsWith('CHANGE_') ? 'profile' : 'auth'
      } else {
        category = entityCategoryMap[entity] ?? 'general'
      }
    }
    const result = resultOverride ?? actionResultMap[action] ?? 'success'
    const activityDetails: Record<string, unknown> = {
      ...(details && typeof details === 'object' ? (details as Record<string, unknown>) : {}),
      entity,
      entityId: entityId ?? null,
    }

    prisma.userActivityLog.create({
      data: {
        userId: actorId,
        action,
        category,
        details: Object.keys(activityDetails).length > 0
          ? activityDetails as unknown as Prisma.InputJsonValue
          : Prisma.JsonNull,
        ipAddress: ipAddress ?? null,
        device: device ?? null,
        result,
      },
    }).catch((err) => {
      logger.error({ err }, 'Failed to write user activity log')
    })
  }

  logger.info({
    msg: 'audit',
    auditAction: action,
    auditEntity: entity,
    auditEntityId: entityId,
    actorId,
  })
}
