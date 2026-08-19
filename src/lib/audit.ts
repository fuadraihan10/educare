import 'server-only'

import { Prisma } from '@/generated/prisma/client'

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

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

  logger.info({
    msg: 'audit',
    auditAction: action,
    auditEntity: entity,
    auditEntityId: entityId,
    actorId,
  })
}
