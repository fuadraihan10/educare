'use client'

import { useState, useMemo } from 'react'
import { Search, Download, Trash2, ChevronDown, ChevronRight, LogIn, LogOut, Shield, Settings, Bell, User, Key, Clock } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Activity = {
  id: string
  action: string
  category: string
  details: Record<string, unknown> | null
  ipAddress: string | null
  device: string | null
  result: string
  createdAt: string
}

const categoryColors: Record<string, string> = {
  auth: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  security: 'bg-red-500/10 text-red-600 ring-red-500/20',
  profile: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  academic: 'bg-violet-500/10 text-violet-600 ring-violet-500/20',
  general: 'bg-muted text-muted-foreground ring-border',
}

const actionIcons: Record<string, typeof LogIn> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  LOGIN_FAILED: Shield,
  UPDATE_PROFILE: User,
  UPDATE_NOTIFICATIONS: Bell,
  UPDATE_APPEARANCE: Settings,
  CHANGE_PASSWORD: Key,
  PASSWORD_CHANGED: Key,
  REVOKE_SESSION: Trash2,
  REVOKE_ALL_SESSIONS: Trash2,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function ActivityFilter({ activities }: { activities: Activity[] }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const categories = useMemo(() => Array.from(new Set(activities.map((a) => a.category))), [activities])

  const filtered = useMemo(() => activities.filter((a) => {
    const matchesSearch = search === '' ||
      a.action.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    const matchesCat = catFilter === 'all' || a.category === catFilter
    const matchesResult = resultFilter === 'all' || a.result === resultFilter
    return matchesSearch && matchesCat && matchesResult
  }), [activities, search, catFilter, resultFilter])

  const stats = useMemo(() => {
    const logins = activities.filter((a) => a.action === 'LOGIN').length
    const failures = activities.filter((a) => a.action === 'LOGIN_FAILED').length
    const changes = activities.filter((a) => a.action.startsWith('UPDATE_') || a.action.startsWith('CHANGE_')).length
    return { total: activities.length, logins, failures, changes }
  }, [activities])

  function exportCSV() {
    const header = 'Action,Category,Result,IP,Time\n'
    const rows = filtered.map((a) =>
      `"${a.action}","${a.category}","${a.result}","${a.ipAddress ?? ''}","${new Date(a.createdAt).toISOString()}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="glass rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Events</p>
        </div>
        <div className="glass rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.logins}</p>
          <p className="text-xs text-muted-foreground">Logins</p>
        </div>
        <div className="glass rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.failures}</p>
          <p className="text-xs text-muted-foreground">Failed Attempts</p>
        </div>
        <div className="glass rounded-xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.changes}</p>
          <p className="text-xs text-muted-foreground">Profile Changes</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities..." className="pl-10 rounded-xl" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCatFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter === 'all' ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>All</button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCatFilter(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter === cat ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>{cat}</button>
          ))}
          <span className="w-px h-6 bg-border/50 self-center" />
          <button onClick={() => setResultFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${resultFilter === 'all' ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>All results</button>
          <button onClick={() => setResultFilter('success')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${resultFilter === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>Success</button>
          <button onClick={() => setResultFilter('failure')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${resultFilter === 'failure' ? 'bg-red-500/10 text-red-600' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>Failed</button>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="size-3.5" /> CSV
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map((activity) => {
          const Icon = actionIcons[activity.action] ?? Clock
          const isExpanded = expandedId === activity.id
          return (
            <div key={activity.id} className="glass rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                className="flex items-center gap-4 w-full px-4 py-3 text-left cursor-pointer"
              >
                <div className={`rounded-lg p-2 ${activity.result === 'failure' ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                  <Icon className={`size-4 ${activity.result === 'failure' ? 'text-red-600' : 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{activity.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${categoryColors[activity.category] ?? categoryColors.general}`}>{activity.category}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${activity.result === 'failure' ? 'bg-red-500/10 text-red-600 ring-red-500/20' : 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20'}`}>{activity.result}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(activity.createdAt)}
                    {activity.ipAddress && <> · {activity.ipAddress}</>}
                  </p>
                </div>
                {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              </button>
              {isExpanded && activity.details && Object.keys(activity.details).length > 0 && (
                <div className="border-t border-border/30 px-4 py-3 bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">Details</p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {Object.entries(activity.details).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <span className="text-muted-foreground font-medium">{k}:</span>
                        <span className="text-foreground">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            <Clock className="size-10 mx-auto mb-3 opacity-30" />
            <p>No activities found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
