'use client'

import { useState, useCallback, useEffect } from 'react'
import { Loader2, Key, XCircle, Clock, User, Hash, Copy, CheckCircle, Shield, RefreshCw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/empty-state'
import { listPasswordResetRequests, generateResetPin, rejectResetRequest } from '@/lib/password-reset-actions'

type ResetRequest = {
  id: string
  type: string
  status: string
  pinPlain: string | null
  expiresAt: Date | null
  requestedAt: Date
  user: { id: string; name: string; regNo: string; role: string; email: string }
  processedBy: { name: string } | null
}

export function PasswordResetsManager() {
  const [requests, setRequests] = useState<ResetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [generatedPin, setGeneratedPin] = useState<{ requestId: string; pin: string; expiresAt: Date } | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchRequests = useCallback(async () => {
    const { requests: data } = await listPasswordResetRequests()
    setRequests(data as ResetRequest[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  async function handleGenerate(requestId: string) {
    setGeneratingId(requestId)
    setGeneratedPin(null)
    const result = await generateResetPin(requestId)
    if (result.success && result.pin) {
      setGeneratedPin({ requestId, pin: result.pin, expiresAt: result.expiresAt! })
      fetchRequests()
    }
    setGeneratingId(null)
  }

  async function handleReject(requestId: string) {
    setRejectingId(requestId)
    await rejectResetRequest(requestId)
    fetchRequests()
    setRejectingId(null)
  }

  function copyPin() {
    if (!generatedPin) return
    navigator.clipboard.writeText(generatedPin.pin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-6 animate-fade-in">
      {generatedPin && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
          <CardHeader className="border-b border-emerald-500/20 bg-emerald-500/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Key className="size-4 text-emerald-600" />
                Generated PIN
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setGeneratedPin(null); setCopied(false) }}>
                <XCircle className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/10 px-8 py-5">
                  <p className="text-4xl font-mono font-bold tracking-[0.3em] text-emerald-700 dark:text-emerald-300">
                    {generatedPin.pin}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Expires: {new Date(generatedPin.expiresAt).toLocaleString()}
                </span>
                <Button size="sm" onClick={copyPin} variant={copied ? 'default' : 'outline'}>
                  {copied ? <CheckCircle className="size-3 mr-1" /> : <Copy className="size-3 mr-1" />}
                  {copied ? 'Copied!' : 'Copy PIN'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Share this PIN with the user. It can only be used once and expires in 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pendingCount} pending request{pendingCount === 1 ? '' : 's'}
        </p>
        <Button variant="outline" size="sm" onClick={() => fetchRequests()}>
          <RefreshCw className="size-3 mr-1" /> Refresh
        </Button>
      </div>

      {requests.length === 0 ? (
        <EmptyState icon={Shield} title="No pending requests" description="There are no pending password reset requests." />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{req.user.name}</span>
                      <Badge variant="outline" className="text-xs">{req.user.role}</Badge>
                      <Badge variant={req.type === 'FORGOT' ? 'destructive' : 'secondary'} className="text-xs">
                        {req.type === 'FORGOT' ? 'Forgot Password' : 'Change Password'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Hash className="size-3" /> {req.user.regNo}</span>
                      <span className="flex items-center gap-1"><User className="size-3" /> {req.user.email}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {new Date(req.requestedAt).toLocaleString()}</span>
                    </div>
                    {req.pinPlain && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">PIN:</span>
                        <code className="font-mono text-sm font-semibold bg-muted px-2 py-0.5 rounded">{req.pinPlain}</code>
                        {req.expiresAt && <span className="text-xs text-muted-foreground">(expires {new Date(req.expiresAt).toLocaleString()})</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleGenerate(req.id)}
                      disabled={generatingId === req.id || req.pinPlain !== null}
                    >
                      {generatingId === req.id ? <Loader2 className="size-3 animate-spin mr-1" /> : <Key className="size-3 mr-1" />}
                      {req.pinPlain ? 'PIN Generated' : 'Generate PIN'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(req.id)}
                      disabled={rejectingId === req.id}
                    >
                      {rejectingId === req.id ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
