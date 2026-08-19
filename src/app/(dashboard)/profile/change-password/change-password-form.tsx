'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, Key } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyPinAndChangePassword, requestPasswordChangeByPin } from '@/lib/password-reset-actions'

export function ChangePasswordForm() {
  const router = useRouter()
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [pin, setPin] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const passwordValid = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  }

  async function handleRequestPin() {
    setLoading(true)
    setError(null)
    try {
      const result = await requestPasswordChangeByPin()
      if (result.success) {
        setStep('verify')
      } else {
        setError(result.message)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function validateClient(): string | null {
    if (pin.length !== 6) return 'PIN must be exactly 6 digits.'
    if (!currentPassword) return 'Current password is required.'
    if (!passwordValid.length) return 'New password must be at least 8 characters.'
    if (!passwordValid.uppercase) return 'New password must contain an uppercase letter.'
    if (!passwordValid.lowercase) return 'New password must contain a lowercase letter.'
    if (!passwordValid.number) return 'New password must contain a number.'
    if (newPassword !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const clientError = validateClient()
    if (clientError) { setError(clientError); return }

    setLoading(true)
    try {
      const result = await verifyPinAndChangePassword(pin, currentPassword, newPassword, confirmPassword)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 2000)
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
          <span>Password updated! Please sign in again.</span>
        </div>
      </div>
    )
  }

  if (step === 'request') {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            To change your password, you need a verification PIN from the administrator.
          </p>
          <p className="text-sm text-muted-foreground">
            Click the button below to send a request. The administrator will generate a PIN for you.
          </p>
        </div>
        {error && (
          <div role="alert" className="animate-shake flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <Button type="button" className="w-full h-11" onClick={handleRequestPin} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Sending request...' : 'Request verification PIN'}
        </Button>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 animate-fade-in">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pin" className="text-sm font-medium">Verification PIN</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="pin"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit PIN"
              className="h-11 rounded-xl glass-input pl-10 font-mono text-lg tracking-[0.3em] text-center"
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-sm font-medium">Current password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="h-11 rounded-xl glass-input pl-10 pr-10"
            />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showCurrent ? 'Hide' : 'Show'}>
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-sm font-medium">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="h-11 rounded-xl glass-input pl-10 pr-10"
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showNew ? 'Hide' : 'Show'}>
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {newPassword.length > 0 && (
            <div className="grid grid-cols-2 gap-1 text-xs">
              {(['length', 'uppercase', 'lowercase', 'number'] as const).map((key) => (
                <span key={key} className={passwordValid[key] ? 'text-emerald-500' : 'text-muted-foreground'}>
                  {passwordValid[key] ? '\u2713' : '\u25CB'}{' '}
                  {key === 'length' ? '8+ chars' : key === 'uppercase' ? 'Uppercase' : key === 'lowercase' ? 'Lowercase' : 'Number'}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm new password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="h-11 rounded-xl glass-input pl-10 pr-10"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirm ? 'Hide' : 'Show'}>
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>
      {error && (
        <div role="alert" className="animate-shake flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? 'Updating...' : 'Update password'}
      </Button>
      <Link
        href="/"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
    </form>
  )
}
