'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Loader2, Hash, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type LoginFormProps = {
  callbackUrl: string
  showError: boolean
}

export function LoginForm({ callbackUrl, showError }: LoginFormProps) {
  const router = useRouter()
  const [regNo, setRegNo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(showError)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const res = await signIn('credentials', {
      regNo,
      password,
      redirect: false,
    })

    setLoading(false)
    if (res?.error) {
      setError(true)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="regNo" className="text-sm font-medium">Registration Number</Label>
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
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-11 rounded-xl glass-input pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>
      {error && (
        <div role="alert" className="animate-shake flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>Invalid registration number or password. Please try again.</span>
        </div>
      )}
      <Button
        type="submit"
        className="w-full h-11 text-sm font-semibold rounded-xl"
        disabled={loading}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? 'Signing in\u2026' : 'Sign in'}
      </Button>
    </form>
  )
}
