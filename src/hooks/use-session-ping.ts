'use client'

import { useEffect } from 'react'

export function useSessionPing(intervalMs = 60_000) {
  useEffect(() => {
    let active = true

    async function ping() {
      if (!active) return
      try {
        await fetch('/api/session/ping', { method: 'POST' })
      } catch {}
    }

    ping()
    const id = setInterval(ping, intervalMs)

    function handleVisibility() {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    function handleBeforeUnload() {
      navigator.sendBeacon('/api/session/ping')
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      active = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [intervalMs])
}
