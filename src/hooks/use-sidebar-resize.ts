'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'sidebar-width'
const MIN_WIDTH = 200
const MAX_WIDTH = 420
const DEFAULT_WIDTH = 256

export function useSidebarResize() {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  /* eslint-disable react-hooks/set-state-in-effect -- hydrating from localStorage on mount */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setWidth(parsed)
      }
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveWidth = useCallback((w: number) => {
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w))
    setWidth(clamped)
    localStorage.setItem(STORAGE_KEY, String(clamped))
    // Update --sidebar-width on all elements that set it
    document.documentElement.style.setProperty('--sidebar-width', `${clamped}px`)
    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]') as HTMLElement
    if (wrapper) {
      wrapper.style.setProperty('--sidebar-width', `${clamped}px`)
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onPointerMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX.current
      saveWidth(startWidth.current + delta)
    }

    const onPointerUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }, [width, saveWidth])

  useEffect(() => {
    // Apply stored width on mount
    const stored = localStorage.getItem(STORAGE_KEY)
    const initial = stored ? parseInt(stored, 10) : DEFAULT_WIDTH
    const clamped = !isNaN(initial) && initial >= MIN_WIDTH && initial <= MAX_WIDTH ? initial : DEFAULT_WIDTH
    document.documentElement.style.setProperty('--sidebar-width', `${clamped}px`)
    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]') as HTMLElement
    if (wrapper) {
      wrapper.style.setProperty('--sidebar-width', `${clamped}px`)
    }
  }, [])

  return { width, isResizing, onPointerDown, MIN_WIDTH, MAX_WIDTH }
}
