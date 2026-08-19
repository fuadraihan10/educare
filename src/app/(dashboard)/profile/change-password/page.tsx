import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

import { ChangePasswordForm } from './change-password-form'

export default async function ChangePasswordPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex min-h-svh items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Change password</h1>
          <p className="text-muted-foreground text-base">
            Update your account password.
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-8 shadow-[var(--shadow-raised-lg)]">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
