'use client'

import { useEffect } from 'react'

export function useSessionPing(intervalMs = 60_000) {
  useEffect(() => {
    const ping = () => fetch('/api/session/ping', { method: 'POST' }).catch(() => {})
    ping()
    const id = setInterval(ping, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
