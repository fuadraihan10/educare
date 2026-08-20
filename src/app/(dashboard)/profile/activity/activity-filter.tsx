'use client'

import { useState, useMemo } from 'react'
import {
  Search, Download, ChevronDown, LogIn, LogOut, Shield,
  Settings, Bell, User, Key, Clock, CalendarDays, Monitor, Globe, Filter,
  X, CheckCircle2, XCircle, AlertTriangle, UserPlus, GraduationCap, BookOpen,
  FileText, CreditCard, ClipboardCheck, LayoutGrid,
} from 'lucide-react'

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

const categoryMeta: Record<string, { label: string; color: string; icon: typeof LogIn }> = {
  auth: { label: 'Authentication', color: 'bg-blue-500/10 text-blue-600 ring-blue-500/20', icon: LogIn },
  security: { label: 'Security', color: 'bg-red-500/10 text-red-600 ring-red-500/20', icon: Shield },
  profile: { label: 'Profile', color: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20', icon: User },
  academics: { label: 'Academics', color: 'bg-violet-500/10 text-violet-600 ring-violet-500/20', icon: GraduationCap },
  staff: { label: 'Staff', color: 'bg-amber-500/10 text-amber-600 ring-amber-500/20', icon: UserPlus },
  students: { label: 'Students', color: 'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20', icon: BookOpen },
  finance: { label: 'Finance', color: 'bg-orange-500/10 text-orange-600 ring-orange-500/20', icon: CreditCard },
  admissions: { label: 'Admissions', color: 'bg-pink-500/10 text-pink-600 ring-pink-500/20', icon: FileText },
  admin: { label: 'Admin', color: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20', icon: Settings },
  general: { label: 'General', color: 'bg-muted text-muted-foreground ring-border', icon: Bell },
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
  REVOKE_SESSION: XCircle,
  REVOKE_ALL_SESSIONS: XCircle,
  ADMIN_REVOKE_SESSION: XCircle,
  ADMIN_REVOKE_ALL_SESSIONS: XCircle,
  CREATE: LayoutGrid,
  UPDATE: Settings,
  DELETE: XCircle,
  DELETE_FILE: XCircle,
  DEACTIVATE: AlertTriangle,
  INACTIVATE: AlertTriangle,
  ACTIVATE: CheckCircle2,
  SUBMIT: FileText,
  APPROVE: CheckCircle2,
  REJECT: XCircle,
  SUBMIT_PAYMENT: CreditCard,
  CONFIRM_PAYMENT: CheckCircle2,
  REJECT_PAYMENT: XCircle,
  ENTER_MARKS: ClipboardCheck,
  MARK: ClipboardCheck,
  PUBLISH: CheckCircle2,
  UNPUBLISH: AlertTriangle,
  ACTIVATE_YEAR: CheckCircle2,
  OVERDUE_UPDATE: AlertTriangle,
  UPLOAD: FileText,
  UPDATE_SCHOOL: Settings,
}

const actionLabels: Record<string, string> = {
  LOGIN: 'Signed in',
  LOGOUT: 'Signed out',
  LOGIN_FAILED: 'Failed sign-in',
  UPDATE_PROFILE: 'Updated profile',
  UPDATE_NOTIFICATIONS: 'Updated notifications',
  CHANGE_PASSWORD: 'Changed password',
  REVOKE_SESSION: 'Revoked session',
  REVOKE_ALL_SESSIONS: 'Revoked all sessions',
  ADMIN_REVOKE_SESSION: 'Admin revoked session',
  ADMIN_REVOKE_ALL_SESSIONS: 'Admin revoked all sessions',
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  DELETE_FILE: 'Deleted file',
  DEACTIVATE: 'Deactivated',
  INACTIVATE: 'Inactivated',
  ACTIVATE: 'Activated',
  SUBMIT: 'Submitted',
  APPROVE: 'Approved',
  REJECT: 'Rejected',
  SUBMIT_PAYMENT: 'Submitted payment',
  CONFIRM_PAYMENT: 'Confirmed payment',
  REJECT_PAYMENT: 'Rejected payment',
  ENTER_MARKS: 'Entered marks',
  MARK: 'Marked attendance',
  PUBLISH: 'Published',
  UNPUBLISH: 'Unpublished',
  ACTIVATE_YEAR: 'Activated academic year',
  OVERDUE_UPDATE: 'Updated overdue invoices',
  UPLOAD: 'Uploaded file',
  UPDATE_SCHOOL: 'Updated school settings',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'Just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function groupByDate(items: Activity[]): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>()
  for (const item of items) {
    const key = new Date(item.createdAt).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const existing = groups.get(key) ?? []
    existing.push(item)
    groups.set(key, existing)
  }
  return groups
}

export function ActivityFilter({
  activities,
  categoryCounts,
  totalSuccess,
  totalFailure,
}: {
  activities: Activity[]
  categoryCounts: Record<string, number>
  totalSuccess: number
  totalFailure: number
}) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('all')
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const allActions = useMemo(() => Array.from(new Set(activities.map((a) => a.action))).sort(), [activities])

  const filtered = useMemo(() => activities.filter((a) => {
    const matchesSearch = search === '' ||
      a.action.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      (a.device && a.device.toLowerCase().includes(search.toLowerCase())) ||
      (a.ipAddress && a.ipAddress.includes(search))
    const matchesCat = catFilter === 'all' || a.category === catFilter
    const matchesResult = resultFilter === 'all' || a.result === resultFilter
    const matchesAction = actionFilter === 'all' || a.action === actionFilter
    const matchesDateFrom = !dateFrom || new Date(a.createdAt) >= new Date(dateFrom)
    const matchesDateTo = !dateTo || new Date(a.createdAt) <= new Date(dateTo + 'T23:59:59')
    return matchesSearch && matchesCat && matchesResult && matchesAction && matchesDateFrom && matchesDateTo
  }), [activities, search, catFilter, resultFilter, actionFilter, dateFrom, dateTo])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const hasActiveFilters = catFilter !== 'all' || resultFilter !== 'all' || actionFilter !== 'all' || dateFrom || dateTo || search

  function clearFilters() {
    setSearch('')
    setCatFilter('all')
    setResultFilter('all')
    setActionFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  function exportCSV() {
    const header = 'Date,Time,Action,Category,Result,IP,Device\n'
    const rows = filtered.map((a) =>
      `"${new Date(a.createdAt).toISOString()}","${a.action}","${a.category}","${a.result}","${a.ipAddress ?? ''}","${a.device ?? ''}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href = url
    el.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`
    el.click()
    URL.revokeObjectURL(url)
  }

  const uniqueCategories = useMemo(() => {
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ cat, count }))
  }, [categoryCounts])

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
        <div className="glass rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold">{activities.length}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Success</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalSuccess}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="size-3.5 text-red-500" />
            <span className="text-xs text-muted-foreground">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{totalFailure}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <LogIn className="size-3.5 text-blue-500" />
            <span className="text-xs text-muted-foreground">Sign-ins</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{categoryCounts['auth'] ?? 0}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="size-3.5 text-red-500" />
            <span className="text-xs text-muted-foreground">Security</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{categoryCounts['security'] ?? 0}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="size-3.5 text-violet-500" />
            <span className="text-xs text-muted-foreground">Academic</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{categoryCounts['academics'] ?? 0}</p>
        </div>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, category, device, or IP..."
            className="pl-10 rounded-xl"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="size-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 size-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              !
            </span>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="glass rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Category Pills */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Category</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCatFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter === 'all' ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              >
                All ({activities.length})
              </button>
              {uniqueCategories.map(({ cat, count }) => {
                const meta = categoryMeta[cat] ?? categoryMeta.general
                return (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter === cat ? `${meta.color} ring-1` : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                  >
                    {meta.label} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Action</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${actionFilter === 'all' ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
              >
                All actions
              </button>
              {allActions.map((action) => (
                <button
                  key={action}
                  onClick={() => setActionFilter(action)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${actionFilter === action ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                >
                  {actionLabels[action] ?? action.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Result + Date Range Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Result</p>
              <div className="flex gap-2">
                <button onClick={() => setResultFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${resultFilter === 'all' ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>All</button>
                <button onClick={() => setResultFilter('success')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${resultFilter === 'success' ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>Success</button>
                <button onClick={() => setResultFilter('failure')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${resultFilter === 'failure' ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>Failed</button>
                <button onClick={() => setResultFilter('warning')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${resultFilter === 'warning' ? 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>Warning</button>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Date Range</p>
              <div className="flex gap-2 items-center">
                <CalendarDays className="size-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg text-xs w-40"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg text-xs w-40"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {activities.length} events
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-xs h-7">
                <X className="size-3" /> Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([dateLabel, items]) => (
          <div key={dateLabel}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{dateLabel}</h3>
              </div>
              <div className="flex-1 h-px bg-border/30" />
              <span className="text-[10px] text-muted-foreground">{items.length} event{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1.5 ml-1 pl-4 border-l-2 border-border/20">
              {items.map((activity) => {
                const Icon = actionIcons[activity.action] ?? Clock
                const catMeta = categoryMeta[activity.category] ?? categoryMeta.general
                const isExpanded = expandedId === activity.id
                const detailsObj = activity.details ?? {}
                const entityName = detailsObj.entity as string | undefined
                const entityLabel = entityName?.replace(/([A-Z])/g, ' $1').trim()

                return (
                  <div key={activity.id} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[21px] top-3.5 size-2.5 rounded-full ring-2 ring-background ${
                      activity.result === 'failure' ? 'bg-red-500' :
                      activity.result === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />

                    <div className="glass rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer"
                      >
                        <div className={`rounded-lg p-2 shrink-0 ${
                          activity.result === 'failure' ? 'bg-red-500/10' :
                          activity.result === 'warning' ? 'bg-amber-500/10' : 'bg-primary/10'
                        }`}>
                          <Icon className={`size-4 ${
                            activity.result === 'failure' ? 'text-red-600' :
                            activity.result === 'warning' ? 'text-amber-600' : 'text-primary'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">
                              {actionLabels[activity.action] ?? activity.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                              {entityLabel && <span className="text-muted-foreground font-normal"> · {entityLabel}</span>}
                            </p>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${catMeta.color}`}>
                              {catMeta.label}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                              activity.result === 'failure' ? 'bg-red-500/10 text-red-600 ring-red-500/20' :
                              activity.result === 'warning' ? 'bg-amber-500/10 text-amber-600 ring-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20'
                            }`}>
                              {activity.result}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground" title={formatDateTime(activity.createdAt)}>
                              {timeAgo(activity.createdAt)}
                            </span>
                            {activity.ipAddress && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Globe className="size-3" /> {activity.ipAddress}
                              </span>
                            )}
                            {activity.device && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[200px]" title={activity.device}>
                                <Monitor className="size-3" /> {activity.device}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronDown className={`size-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border/30 px-4 py-3 bg-muted/20 space-y-3">
                          {/* Full timestamp */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Clock className="size-3" /> {formatDateTime(activity.createdAt)}</span>
                            {activity.ipAddress && <span className="flex items-center gap-1.5"><Globe className="size-3" /> {activity.ipAddress}</span>}
                            {activity.device && <span className="flex items-center gap-1.5"><Monitor className="size-3" /> {activity.device}</span>}
                          </div>

                          {/* Details grid */}
                          {Object.keys(detailsObj).length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Details</p>
                              <div className="grid gap-1.5 sm:grid-cols-2">
                                {Object.entries(detailsObj).map(([k, v]) => (
                                  <div key={k} className="flex gap-2 text-xs rounded-md bg-background/50 px-2.5 py-1.5">
                                    <span className="text-muted-foreground font-medium whitespace-nowrap">{k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()}:</span>
                                    <span className="text-foreground truncate" title={typeof v === 'object' ? JSON.stringify(v) : String(v)}>
                                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            <Clock className="size-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No activities found</p>
            {hasActiveFilters ? (
              <p className="mt-1">Try adjusting your filters or <button onClick={clearFilters} className="text-primary hover:underline">clear all filters</button></p>
            ) : (
              <p className="mt-1">Your activity will appear here as you use the system</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
