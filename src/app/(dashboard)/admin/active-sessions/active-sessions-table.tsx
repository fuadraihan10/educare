'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Smartphone, Tablet, Trash2, Users, Search, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { revokeSession } from '@/lib/profile/actions'

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

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
  ADMIN: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  TEACHER: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  STUDENT: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  PARENT: 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
}

function deviceIcon(session: SessionWithUser) {
  if (session.device === 'mobile') return Smartphone
  if (session.device === 'tablet') return Tablet
  return Monitor
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'Just now'
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

export function ActiveSessionsTable({ sessions }: { sessions: SessionWithUser[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)

  async function handleRevoke(id: string) {
    await revokeSession(id)
    setConfirmRevokeId(null)
    router.refresh()
  }

  const filtered = sessions.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.userName.toLowerCase().includes(q) ||
      s.userRegNo.toLowerCase().includes(q) ||
      s.userEmail.toLowerCase().includes(q) ||
      s.userRole.toLowerCase().includes(q) ||
      (s.ipAddress ?? '').toLowerCase().includes(q)
    )
  })

  const grouped = filtered.reduce<Record<string, SessionWithUser[]>>((acc, s) => {
    if (!acc[s.userId]) acc[s.userId] = []
    acc[s.userId].push(s)
    return acc
  }, {})

  const activeCount = sessions.filter((s) => isActiveRecently(s.lastActiveAt)).length
  const uniqueIps = new Set(sessions.map((s) => s.ipAddress).filter(Boolean)).size

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold">{sessions.length}</p>
          <p className="text-xs text-muted-foreground">Total Sessions</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Active (5min)</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{Object.keys(grouped).length}</p>
          <p className="text-xs text-muted-foreground">Unique Users</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-violet-600">{uniqueIps}</p>
          <p className="text-xs text-muted-foreground">Unique IPs</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, reg no, role, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => router.refresh()}>
          <RefreshCw className="size-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Sessions by user */}
      {Object.entries(grouped).length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <Users className="size-10 mx-auto mb-3 opacity-30" />
          <p>No active sessions found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([userId, userSessions]) => {
            const first = userSessions[0]
            const hasActive = userSessions.some((s) => isActiveRecently(s.lastActiveAt))
            return (
              <div key={userId} className="glass-card rounded-2xl overflow-hidden">
                <div className="border-b border-border/50 px-6 py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{first.userName}</span>
                        <span className="text-xs text-muted-foreground">{first.userRegNo}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${roleBadge[first.userRole] ?? ''}`}>{first.userRole}</span>
                      </div>
                      {hasActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px]">{userSessions.length} session{userSessions.length !== 1 ? 's' : ''}</Badge>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {userSessions.map((session) => {
                    const Icon = deviceIcon(session)
                    const active = isActiveRecently(session.lastActiveAt)
                    return (
                      <div key={session.id} className="flex items-center gap-4 rounded-xl px-4 py-3 transition-all hover:bg-muted/30">
                        <div className={`rounded-lg p-2 shrink-0 ${active ? 'bg-emerald-500/10' : 'bg-muted/50'}`}>
                          <Icon className={`size-4 ${active ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{session.browser} on {session.os}</p>
                            {active && <Badge variant="default" className="text-[10px]">Active</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            {session.ipAddress && <span>{session.ipAddress}</span>}
                            <span>Last active {timeAgo(session.lastActiveAt)}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => setConfirmRevokeId(session.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
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
            <AlertDialogAction onClick={() => confirmRevokeId && handleRevoke(confirmRevokeId)}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
