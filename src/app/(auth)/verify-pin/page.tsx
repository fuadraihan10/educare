import type { Metadata } from 'next'
import { VerifyPinForm } from './verify-pin-form'

export const metadata: Metadata = { title: 'Verify PIN' }

export default async function VerifyPinPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams
  const mode = params.type === 'change' ? 'change' : 'forgot'

  return (
    <div className="flex min-h-svh items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'change' ? 'Verify to change password' : 'Reset your password'}
          </h1>
          <p className="text-muted-foreground text-base">
            {mode === 'change'
              ? 'Enter the 6-digit PIN from your administrator to proceed.'
              : 'Enter the 6-digit PIN from your administrator to create a new password.'}
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-8 shadow-[var(--shadow-raised-lg)]">
          <VerifyPinForm mode={mode} />
        </div>
      </div>
    </div>
  )
}
