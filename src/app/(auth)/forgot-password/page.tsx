import { ForgotPasswordForm } from './forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Forgot password?</h1>
          <p className="text-muted-foreground text-base">
            Enter your registration number to request a password reset.
          </p>
        </div>
        <div className="glass-strong rounded-2xl p-8 shadow-[var(--shadow-raised-lg)]">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
