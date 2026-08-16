import 'server-only'

import { Prisma } from '@/generated/prisma/client'

import { prisma } from '@/lib/db'

export interface AuditParams {
  actorId?: string | null
  action: string
  entity: string
  entityId?: string | null
  details?: Prisma.InputJsonValue
}

// Audit trail for sensitive actions (role changes, grade overrides,
// attendance corrections, fee/payment status changes, admission
// approval/rejection). Never put passwords, secrets, or unnecessary PII in
// `details` — callers must pass only identifiers and safe values.
export async function auditLog({ actorId, action, entity, entityId, details }: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entity,
      entityId: entityId ?? null,
      details: details ?? Prisma.JsonNull,
    },
  })
}
