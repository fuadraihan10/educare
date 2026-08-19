'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Hash, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordResetByPin } from '@/lib/password-reset-actions'

export function ForgotPasswordForm() {
  const [regNo, setRegNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set('regNo', regNo)
      const result = await requestPasswordResetByPin(formData)

      if (result.success) {
        setSuccess(true)
        setMessage(result.message)
      } else {
        setError(result.message)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="size-4 shrink-0" />
          <span>{message}</span>
        </div>
        <div className="space-y-3">
          <Link
            href="/verify-pin?type=forgot"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-border bg-background text-sm font-medium hover:bg-accent transition-colors"
          >
            Enter verification PIN
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="regNo" className="text-sm font-medium">
          Registration Number
        </Label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="regNo"
            name="regNo"
            type="text"
            autoComplete="username"
            required
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            placeholder="e.g. ADM-0001"
            className="h-11 rounded-xl glass-input pl-10 uppercase"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          A password reset request will be sent to the administrator. They will generate a 6-digit PIN for you.
        </p>
      </div>
      {error && (
        <div role="alert" className="animate-shake flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? 'Sending request...' : 'Request password reset'}
      </Button>
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </form>
  )
}
