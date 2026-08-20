'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Smartphone, Tablet, Trash2, Users, Search, RefreshCw, LogOut, Clock, MapPin, ChevronDown, ChevronRight, Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { adminRevokeSession, adminRevokeAllUserSessions } from '@/lib/profile/actions'

type SessionWithUser = {
  id: string
  userId: string
  userName: string
  userRegNo: string
  userRole: string
  userEmail: string
  browser: string | null
  os: string | null
  device: string | null
  ipAddress: string | null
  lastActiveAt: string
  expiresAt: string
  createdAt: string
}

const roleConfig: Record<string, { label: string; className: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', className: 'bg-purple-500/10 text-purple-600 ring-purple-500/20', color: 'text-purple-600' },
  ADMIN: { label: 'Admin', className: 'bg-blue-500/10 text-blue-600 ring-blue-500/20', color: 'text-blue-600' },
  TEACHER: { label: 'Teacher', className: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20', color: 'text-emerald-600' },
  STUDENT: { label: 'Student', className: 'bg-amber-500/10 text-amber-600 ring-amber-500/20', color: 'text-amber-600' },
  PARENT: { label: 'Parent', className: 'bg-rose-500/10 text-rose-600 ring-rose-500/20', color: 'text-rose-600' },
}

function DeviceIcon({ device, className }: { device: string | null; className?: string }) {
  if (device === 'mobile') return <Smartphone className={className ?? 'size-4'} />
  if (device === 'tablet') return <Tablet className={className ?? 'size-4'} />
  return <Monitor className={className ?? 'size-4'} />
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m ago`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h ago`
}

function isActiveRecently(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 5 * 60 * 1000
}

const ALL_ROLES = ['ALL', 'SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']

export function ActiveSessionsTable({ sessions }: { sessions: SessionWithUser[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 500)
  }, [router])

  useEffect(() => {
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  async function handleRevoke(id: string) {
    await adminRevokeSession(id)
    setConfirmRevokeId(null)
    refresh()
  }

  const filtered = sessions.filter((s) => {
    const matchesRole = roleFilter === 'ALL' || s.userRole === roleFilter
    if (!search) return matchesRole
    const q = search.toLowerCase()
    return matchesRole && (
      s.userName.toLowerCase().includes(q) ||
      s.userRegNo.toLowerCase().includes(q) ||
      s.userEmail.toLowerCase().includes(q) ||
      s.userRole.toLowerCase().includes(q) ||
      (s.ipAddress ?? '').toLowerCase().includes(q) ||
      (s.browser ?? '').toLowerCase().includes(q) ||
      (s.os ?? '').toLowerCase().includes(q)
    )
  })

  const grouped = filtered.reduce<Record<string, SessionWithUser[]>>((acc, s) => {
    if (!acc[s.userId]) acc[s.userId] = []
    acc[s.userId].push(s)
    return acc
  }, {})

  const activeCount = sessions.filter((s) => isActiveRecently(s.lastActiveAt)).length
  const uniqueIps = new Set(sessions.map((s) => s.ipAddress).filter(Boolean)).size
  const uniqueUsers = new Set(sessions.map((s) => s.userId)).size

  function toggleUser(userId: string) {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  function expandAll() {
    const allIds = new Set(Object.keys(grouped))
    setExpandedUsers(allIds)
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Sessions</span>
          </div>
          <p className="text-2xl font-bold">{sessions.length}</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
            <span className="text-xs text-muted-foreground">Active (5min)</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Online Users</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{uniqueUsers}</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Unique IPs</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{uniqueIps}</p>
        </div>
      </div>

      {/* Search + Filters + Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name, reg no, IP, browser..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
                roleFilter === role
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {role === 'ALL' ? 'All' : roleConfig[role]?.label ?? role}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="size-3 mr-1" /> Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className={`size-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Sessions by user */}
      {Object.entries(grouped).length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <Users className="size-10 mx-auto mb-3 opacity-30" />
          <p>No active sessions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([userId, userSessions]) => {
            const first = userSessions[0]
            const hasActive = userSessions.some((s) => isActiveRecently(s.lastActiveAt))
            const isExpanded = expandedUsers.has(userId)
            const role = roleConfig[first.userRole] ?? { label: first.userRole, className: '', color: '' }

            return (
              <div key={userId} className="glass-card rounded-2xl overflow-hidden">
                {/* User header — clickable to expand/collapse */}
                <button
                  onClick={() => toggleUser(userId)}
                  className="w-full border-b border-border/50 px-6 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="size-4 text-muted-foreground shrink-0" /> : <ChevronRight className="size-4 text-muted-foreground shrink-0" />}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{first.userName}</span>
                      <span className="text-xs text-muted-foreground">{first.userRegNo}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${role.className}`}>{role.label}</span>
                    </div>
                    {hasActive && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px]">{userSessions.length} session{userSessions.length !== 1 ? 's' : ''}</Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        adminRevokeAllUserSessions(userId).then(refresh)
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title={`Sign out all sessions for ${first.userName}`}
                    >
                      <LogOut className="size-3.5" />
                    </Button>
                  </div>
                </button>

                {/* Sessions list */}
                {isExpanded && (
                  <div className="p-3 space-y-2">
                    {userSessions.map((session) => {
                      const active = isActiveRecently(session.lastActiveAt)
                      return (
                        <div key={session.id} className="flex items-center gap-4 rounded-xl px-4 py-3 transition-all hover:bg-muted/20 border border-border/30">
                          <div className={`rounded-lg p-2 shrink-0 ${active ? 'bg-emerald-500/10' : 'bg-muted/50'}`}>
                            <DeviceIcon device={session.device} className={`size-4 ${active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">{session.browser} on {session.os}</p>
                              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                                active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                              }`}>
                                {active ? 'Active' : 'Idle'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              {session.ipAddress && <span className="font-mono text-[11px]">{session.ipAddress}</span>}
                              <span className="flex items-center gap-1"><Clock className="size-3" />Active {timeAgo(session.lastActiveAt)}</span>
                              <span>· Started {timeAgo(session.createdAt)}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmRevokeId(session.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" title="Revoke">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!confirmRevokeId} onOpenChange={() => setConfirmRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
            <AlertDialogDescription>This session will be signed out immediately. The user will need to sign in again.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={() => confirmRevokeId && handleRevoke(confirmRevokeId)}>Revoke</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


