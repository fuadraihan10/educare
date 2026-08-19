'use client'

import { useSessionPing } from '@/hooks/use-session-ping'

export function SessionPing() {
  useSessionPing(60_000)
  return null
}
