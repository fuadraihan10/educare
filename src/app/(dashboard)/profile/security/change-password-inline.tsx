'use client'

import { useState } from 'react'
import { Loader2, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/lib/auth/actions'

const passwordValid = (pw: string) => ({
  length: pw.length >= 8,
  uppercase: /[A-Z]/.test(pw),
  lowercase: /[a-z]/.test(pw),
  number: /[0-9]/.test(pw),
})

export function ChangePasswordInline() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const valid = passwordValid(newPassword)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!currentPassword) { setError('Current password is required.'); return }
    if (!valid.length) { setError('Password must be at least 8 characters.'); return }
    if (!valid.uppercase) { setError('Must contain an uppercase letter.'); return }
    if (!valid.lowercase) { setError('Must contain a lowercase letter.'); return }
    if (!valid.number) { setError('Must contain a number.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.set('currentPassword', currentPassword)
      fd.set('newPassword', newPassword)
      fd.set('confirmPassword', confirmPassword)
      const result = await changePassword(fd)
      if (result.success) {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(result.message)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="border-b border-border/50 px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Change Password</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Update your account password</p>
      </div>
      <div className="p-6">
        {success && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 mb-4">
            <CheckCircle className="size-4 shrink-0" />
            <span>Password updated successfully.</span>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="h-10 rounded-xl pl-10 pr-10" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password">
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="h-10 rounded-xl pl-10 pr-10" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password">
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="grid grid-cols-2 gap-1 text-xs">
                {(['length', 'uppercase', 'lowercase', 'number'] as const).map((key) => (
                  <span key={key} className={valid[key] ? 'text-emerald-500' : 'text-muted-foreground'}>
                    {valid[key] ? '✓' : '○'} {key === 'length' ? '8+ chars' : key === 'uppercase' ? 'Uppercase' : key === 'lowercase' ? 'Lowercase' : 'Number'}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="h-10 rounded-xl pl-10" />
            </div>
          </div>
          {error && (
            <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" disabled={loading} className="h-10 px-6">
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
