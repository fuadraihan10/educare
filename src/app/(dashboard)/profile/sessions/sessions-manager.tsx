'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Smartphone, Tablet, Trash2, LogOut, Shield, Clock, MapPin, Globe, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
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

function DeviceIcon({ device, className }: { device: string | null; className?: string }) {
  if (device === 'mobile') return <Smartphone className={className ?? 'size-5'} />
  if (device === 'tablet') return <Tablet className={className ?? 'size-5'} />
  return <Monitor className={className ?? 'size-5'} />
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

function sessionDuration(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min`
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" title="Copy IP">
      <span className="font-mono text-[11px]">{text}</span>
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
    </button>
  )
}

function SessionCard({ session, isCurrent, onRevoke }: { session: Session; isCurrent: boolean; onRevoke: (id: string) => void }) {
  const active = isActiveRecently(session.lastActiveAt)
  const expired = isExpired(session.expiresAt)

  return (
    <div className={`relative flex items-start gap-4 rounded-xl px-4 py-3.5 transition-all border ${
      isCurrent ? 'border-emerald-500/25 bg-emerald-500/[0.03]' : 'border-border/30 hover:bg-muted/20'
    }`}>
      <div className={`rounded-lg p-2.5 shrink-0 mt-0.5 ${
        isCurrent ? 'bg-emerald-500/10' : active ? 'bg-blue-500/10' : 'bg-muted/50'
      }`}>
        <DeviceIcon device={session.device} className={`size-5 ${
          isCurrent ? 'text-emerald-600' : active ? 'text-blue-600' : 'text-muted-foreground'
        }`} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{session.browser} on {session.os}</p>
          {isCurrent && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ring-emerald-500/20">
              <span className="relative flex h-1.5 w-1.5 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
              This device
            </span>
          )}
          {!isCurrent && active && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          {expired && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
          {!isCurrent && !active && !expired && <Badge variant="outline" className="text-[10px]">Idle</Badge>}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {session.ipAddress && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              <CopyButton text={session.ipAddress} />
            </span>
          )}
          <span className="flex items-center gap-1"><Clock className="size-3" />Active {timeAgo(session.lastActiveAt)}</span>
          <span className="text-muted-foreground/60">·</span>
          <span>Session: {sessionDuration(session.createdAt)}</span>
          <span className="text-muted-foreground/60">·</span>
          <span>Expires: {sessionDuration(session.expiresAt)}</span>
        </div>
      </div>

      {!isCurrent && (
        <Button variant="ghost" size="icon-sm" onClick={() => onRevoke(session.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 mt-1" title="Revoke session">
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

export function SessionsManager({ sessions, currentSessionId }: { sessions: Session[]; currentSessionId?: string }) {
  const router = useRouter()
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)
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

  async function handleRevokeAll() {
    await revokeAllSessions(currentSession?.id)
    setConfirmRevokeAll(false)
    refresh()
  }

  async function handleRevoke(id: string) {
    await revokeSession(id)
    setConfirmRevokeId(null)
    refresh()
  }

  const currentSession = sessions.find((s) => s.isCurrent || s.id === currentSessionId)
  const otherSessions = sessions.filter((s) => s.id !== currentSession?.id)
  const activeOthers = otherSessions.filter((s) => isActiveRecently(s.lastActiveAt) && !isExpired(s.expiresAt))
  const inactiveOthers = otherSessions.filter((s) => !isActiveRecently(s.lastActiveAt) || isExpired(s.expiresAt))

  const totalActive = activeOthers.length + (currentSession ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sessions</span>
          </div>
          <p className="text-2xl font-bold">{sessions.length}</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
            <span className="text-xs text-muted-foreground">Active Now</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalActive}</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Idle / Expired</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{inactiveOthers.length}</p>
        </div>
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Monitor className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Devices</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{new Set(sessions.map((s) => `${s.browser}-${s.os}-${s.device}`).filter(Boolean)).size}</p>
        </div>
      </div>

      {/* Current session */}
      {currentSession && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="size-4 text-emerald-500" /> Current Session
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto-refreshes every 30s</span>
              <button onClick={refresh} className="text-muted-foreground hover:text-foreground transition-colors" title="Refresh now">
                <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <div className="p-3">
            <SessionCard session={currentSession} isCurrent={true} onRevoke={() => {}} />
          </div>
        </div>
      )}

      {/* Other active sessions */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              Other Sessions
              {activeOthers.length > 0 && <Badge variant="secondary" className="text-[10px]">{activeOthers.length} active</Badge>}
            </h3>
            {otherSessions.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setConfirmRevokeAll(true)}>
                <LogOut className="size-3.5" /> Sign out all others
              </Button>
            )}
          </div>
        </div>
        <div className="p-3 space-y-2">
          {activeOthers.length > 0 && (
            <div className="space-y-2">
              {activeOthers.map((session) => (
                <SessionCard key={session.id} session={session} isCurrent={false} onRevoke={setConfirmRevokeId} />
              ))}
            </div>
          )}

          {inactiveOthers.length > 0 && (
            <div className="space-y-2">
              {activeOthers.length > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Older</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
              )}
              {inactiveOthers.map((session) => (
                <SessionCard key={session.id} session={session} isCurrent={false} onRevoke={setConfirmRevokeId} />
              ))}
            </div>
          )}

          {otherSessions.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Shield className="size-8 mx-auto mb-2 opacity-30" />
              <p>No other sessions. You&apos;re only signed in on this device.</p>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <Monitor className="size-10 mx-auto mb-3 opacity-30" />
          <p>No sessions found.</p>
        </div>
      )}

      {/* Security tips */}
      {sessions.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" /> Security Tips
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
              <li>If you see a session you don&apos;t recognize, revoke it immediately and change your password.</li>
              <li>Regularly review your active sessions for any suspicious activity.</li>
              <li>Use &quot;Sign out all others&quot; if you&apos;ve logged in on a shared or public computer.</li>
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
            <Button onClick={handleRevokeAll}>Sign out all</Button>
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
            <Button variant="destructive" onClick={() => confirmRevokeId && handleRevoke(confirmRevokeId)}>Revoke</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
