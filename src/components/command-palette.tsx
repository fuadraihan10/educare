'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import {
  Search,
  ArrowRight,
  GraduationCap,
  Users,
  UserRound,
  School,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Settings,
  FileText,
  Wallet,
  CalendarDays,
  Megaphone,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type CommandItem = {
  id: string
  label: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  shortcut?: string
  roles?: string[]
}

const commandItems: CommandItem[] = [
  { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to dashboard', href: '/admin', icon: LayoutDashboard, category: 'Navigation', shortcut: 'G D', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-students', label: 'Students', description: 'Manage students', href: '/admin/students', icon: Users, category: 'Navigation', shortcut: 'G S', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-staff', label: 'Staff', description: 'Manage staff members', href: '/admin/staff', icon: UserRound, category: 'Navigation', shortcut: 'G T', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-classes', label: 'Classes', description: 'Manage classes', href: '/admin/classes', icon: School, category: 'Navigation', shortcut: 'G C', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-subjects', label: 'Subjects', description: 'Manage subjects', href: '/admin/subjects', icon: BookOpen, category: 'Navigation', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-attendance', label: 'Attendance', description: 'Track attendance', href: '/admin/attendance', icon: CalendarCheck, category: 'Navigation', shortcut: 'G A', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-exams', label: 'Exams & Grades', description: 'Manage exams and grades', href: '/admin/exams', icon: FileText, category: 'Navigation', shortcut: 'G E', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-timetable', label: 'Timetable', description: 'View timetable', href: '/admin/timetable', icon: CalendarDays, category: 'Navigation', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-fees', label: 'Fees', description: 'Manage fees and payments', href: '/admin/fees', icon: Wallet, category: 'Navigation', shortcut: 'G F', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-admissions', label: 'Admissions', description: 'Manage admissions', href: '/admin/admissions', icon: ClipboardList, category: 'Navigation', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-announcements', label: 'Announcements', description: 'Manage announcements', href: '/admin/announcements', icon: Megaphone, category: 'Navigation', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-analytics', label: 'Analytics', description: 'View analytics', href: '/admin/analytics', icon: BarChart3, category: 'Navigation', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-settings', label: 'Settings', description: 'App settings', href: '/admin/settings', icon: Settings, category: 'Navigation', shortcut: 'G ,', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { id: 'nav-teacher-dashboard', label: 'Teacher Dashboard', description: 'Go to teacher view', href: '/teacher', icon: GraduationCap, category: 'Navigation', roles: ['TEACHER'] },
  { id: 'nav-teacher-attendance', label: 'Attendance', description: 'Mark attendance', href: '/teacher/attendance', icon: CalendarCheck, category: 'Navigation', roles: ['TEACHER'] },
  { id: 'nav-teacher-exams', label: 'Exams', description: 'Manage exams', href: '/teacher/exams', icon: FileText, category: 'Navigation', roles: ['TEACHER'] },
  { id: 'nav-student-dashboard', label: 'Student Dashboard', description: 'Go to student view', href: '/student', icon: GraduationCap, category: 'Navigation', roles: ['STUDENT'] },
  { id: 'nav-student-attendance', label: 'Attendance', description: 'View attendance', href: '/student/attendance', icon: CalendarCheck, category: 'Navigation', roles: ['STUDENT'] },
  { id: 'nav-student-grades', label: 'Results', description: 'View grades', href: '/student/grades', icon: GraduationCap, category: 'Navigation', roles: ['STUDENT'] },
  { id: 'nav-parent-dashboard', label: 'Parent Dashboard', description: 'Go to parent view', href: '/parent', icon: GraduationCap, category: 'Navigation', roles: ['PARENT'] },
  { id: 'nav-parent-attendance', label: 'Attendance', description: "View child's attendance", href: '/parent/attendance', icon: CalendarCheck, category: 'Navigation', roles: ['PARENT'] },
  { id: 'nav-parent-grades', label: 'Results', description: "View child's grades", href: '/parent/grades', icon: GraduationCap, category: 'Navigation', roles: ['PARENT'] },
]

function CommandPaletteInner() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'

  const currentRole = useMemo(() => {
    if (pathname.startsWith('/teacher')) return 'TEACHER'
    if (pathname.startsWith('/student')) return 'STUDENT'
    if (pathname.startsWith('/parent')) return 'PARENT'
    return 'ADMIN'
  }, [pathname])

  const filtered = useMemo(() => {
    const roleItems = commandItems.filter((item) => !item.roles || item.roles.includes(currentRole))
    if (!query.trim()) return roleItems
    const lower = query.toLowerCase()
    return roleItems.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
    )
  }, [query, currentRole])

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const item of filtered) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [filtered])

  const flatItems = useMemo(() => filtered, [filtered])

  const handleOpen = useCallback(() => {
    setOpen(true)
    setQuery('')
    setActiveIndex(0)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }, [])

  const selectItem = useCallback(
    (item: CommandItem) => {
      handleClose()
      router.push(item.href)
    },
    [handleClose, router]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) {
          handleClose()
        } else {
          handleOpen()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, handleOpen, handleClose])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % flatItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = flatItems[activeIndex]
        if (item) selectItem(item)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [flatItems, activeIndex, selectItem, handleClose]
  )

  if (typeof window === 'undefined') return null

  return createPortal(
    <>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div
            className="fixed inset-0 bg-black/30 animate-fade-in"
            onClick={handleClose}
          />
          <div
            role="dialog"
            aria-label="Command palette"
            className={cn(
              'relative z-[101] w-full max-w-lg',
              'rounded-2xl bg-popover shadow-[var(--shadow-raised-lg)]',
              'ring-1 ring-foreground/10',
              'animate-scale-in origin-top',
              'max-h-[70vh] flex flex-col overflow-hidden'
            )}
          >
            <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, actions..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
            <div ref={listRef} className="overflow-y-auto overscroll-contain p-2">
              {flatItems.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No results found.
                </div>
              )}
              {Array.from(grouped.entries()).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {category}
                  </div>
                  {items.map((item) => {
                    const globalIndex = flatItems.indexOf(item)
                    const isActive = globalIndex === activeIndex
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-active={isActive}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted/60'
                        )}
                      >
                        <div
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                            isActive
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <item.icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.shortcut && (
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {item.shortcut}
                            </kbd>
                          )}
                          <ArrowRight className={cn('size-3.5 transition-opacity', isActive ? 'opacity-100' : 'opacity-0')} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 border-t border-border/30 px-4 py-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 font-medium">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 font-medium">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border/50 bg-muted/50 px-1 py-0.5 font-medium">esc</kbd>
                close
              </span>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}

export function CommandPalette() {
  return <CommandPaletteInner />
}
