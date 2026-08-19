'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Smartphone, Tablet, Trash2, LogOut, Shield, Clock, MapPin, Globe, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { revokeSession, revokeAllSessions } from '@/lib/profile/actions'

type Session = {
  id: string
  tokenHash: string
  device: string | null
  browser: string | null
  os: string | null
  ipAddress: string | null
  isCurrent: boolean
  lastActiveAt: string
  expiresAt: string
  createdAt: string
}

function deviceIcon(session: Session) {
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

function sessionDuration(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

function isActiveRecently(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 5 * 60 * 1000
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

export function SessionsManager({ sessions, currentSessionId }: { sessions: Session[]; currentSessionId?: string }) {
  const router = useRouter()
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)

  async function handleRevokeAll() {
    await revokeAllSessions()
    setConfirmRevokeAll(false)
    router.refresh()
  }

  async function handleRevoke(id: string) {
    await revokeSession(id)
    setConfirmRevokeId(null)
    router.refresh()
  }

  const currentSession = sessions.find((s) => s.isCurrent || s.id === currentSessionId)
  const otherSessions = sessions.filter((s) => s.id !== currentSession?.id)
  const activeOthers = otherSessions.filter((s) => isActiveRecently(s.lastActiveAt) && !isExpired(s.expiresAt))
  const inactiveOthers = otherSessions.filter((s) => !isActiveRecently(s.lastActiveAt) || isExpired(s.expiresAt))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold">{sessions.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{activeOthers.length + (currentSession ? 1 : 0)}</p>
          <p className="text-xs text-muted-foreground">Active Now</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{inactiveOthers.length}</p>
          <p className="text-xs text-muted-foreground">Idle / Expired</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{new Set(sessions.map((s) => s.os).filter(Boolean)).size}</p>
          <p className="text-xs text-muted-foreground">Devices</p>
        </div>
      </div>

      {/* Current session */}
      {currentSession && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="size-4 text-emerald-500" /> Current Session
              <Badge variant="default" className="ml-1 text-[10px]">This device</Badge>
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4">
              {(() => { const Icon = deviceIcon(currentSession); return <div className="rounded-lg bg-emerald-500/10 p-2.5"><Icon className="size-5 text-emerald-600" /></div> })()}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{currentSession.browser} on {currentSession.os}</p>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ring-emerald-500/20">Active</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                  {currentSession.ipAddress && <span className="flex items-center gap-1"><MapPin className="size-3" />{currentSession.ipAddress}</span>}
                  <span className="flex items-center gap-1"><Clock className="size-3" />Active {timeAgo(currentSession.lastActiveAt)}</span>
                  <span>Duration: {sessionDuration(currentSession.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other active sessions */}
      {activeOthers.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Globe className="size-4 text-blue-500" /> Other Active Sessions
                <Badge variant="secondary" className="text-[10px]">{activeOthers.length}</Badge>
              </h3>
              <Button variant="destructive" size="sm" onClick={() => setConfirmRevokeAll(true)}>
                <LogOut className="size-3.5" /> Sign out all others
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {activeOthers.map((session) => {
              const Icon = deviceIcon(session)
              return (
                <div key={session.id} className="flex items-center gap-4 rounded-xl px-4 py-3 transition-all hover:shadow-sm border border-border/30">
                  <div className="rounded-lg bg-blue-500/10 p-2.5 shrink-0">
                    <Icon className="size-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{session.browser} on {session.os}</p>
                      {isActiveRecently(session.lastActiveAt) && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      {session.ipAddress && <span className="flex items-center gap-1"><MapPin className="size-3" />{session.ipAddress}</span>}
                      <span className="flex items-center gap-1"><Clock className="size-3" />Active {timeAgo(session.lastActiveAt)}</span>
                      <span>Started {timeAgo(session.createdAt)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRevokeId(session.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                    <Trash2 className="size-3.5 mr-1" /> Revoke
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Inactive / expired sessions */}
      {inactiveOthers.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" /> Older Sessions
              <Badge variant="outline" className="text-[10px]">{inactiveOthers.length}</Badge>
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {inactiveOthers.map((session) => {
              const Icon = deviceIcon(session)
              const expired = isExpired(session.expiresAt)
              return (
                <div key={session.id} className="flex items-center gap-4 rounded-xl px-4 py-3 opacity-60 border border-border/30">
                  <div className="rounded-lg bg-muted/50 p-2.5 shrink-0">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-muted-foreground">{session.browser} on {session.os}</p>
                      {expired ? (
                        <Badge variant="destructive" className="text-[10px]">Expired</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Idle</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      {session.ipAddress && <span className="flex items-center gap-1"><MapPin className="size-3" />{session.ipAddress}</span>}
                      <span>Last active {timeAgo(session.lastActiveAt)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => setConfirmRevokeId(session.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <Monitor className="size-10 mx-auto mb-3 opacity-30" />
          <p>No active sessions found.</p>
        </div>
      )}

      {/* Security tips */}
      {sessions.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" /> Security Tips
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>&#8226; If you see a session you don&apos;t recognize, revoke it immediately and change your password.</li>
              <li>&#8226; Regularly review your active sessions for any suspicious activity.</li>
              <li>&#8226; Use &quot;Sign out all others&quot; if you&apos;ve logged in on a shared or public computer.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Revoke All Dialog */}
      <AlertDialog open={confirmRevokeAll} onOpenChange={setConfirmRevokeAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out all other sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from {otherSessions.length} other device{otherSessions.length !== 1 ? 's' : ''}.
              Your current session will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeAll}>Sign out all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Single Dialog */}
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
