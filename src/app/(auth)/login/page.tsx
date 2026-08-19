import { BookOpen, CalendarCheck, Wallet, ShieldCheck } from 'lucide-react'
import Image from 'next/image'

import { LoginForm } from './login-form'
import { prisma } from '@/lib/db'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, school] = await Promise.all([
    searchParams,
    prisma.school.findFirst({ select: { name: true } }),
  ])
  const schoolName = school?.name ?? process.env.SCHOOL_NAME ?? 'School'
  const callbackUrl =
    typeof params.callbackUrl === 'string' &&
    params.callbackUrl.startsWith('/') &&
    !params.callbackUrl.startsWith('//')
      ? params.callbackUrl
      : '/'
  const error = params.error === 'CredentialsSignin'

  return (
    <div className="flex min-h-svh animate-fade-in">
      <div className="hidden w-1/2 items-center justify-center lg:flex relative overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="relative z-10 max-w-md space-y-12 px-12">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl shadow-[var(--shadow-subtle)] overflow-hidden">
              <Image src="/educareLogo.png" alt="Logo" width={56} height={56} className="size-14 object-contain" priority />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{schoolName}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Student Management System</p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', title: 'Comprehensive academics', desc: 'Manage classes, subjects, exams, and student grades all in one place.' },
              { icon: CalendarCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', title: 'Real-time attendance', desc: 'Track student and staff attendance with instant reporting.' },
              { icon: Wallet, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', title: 'Fee management', desc: 'Automated fee tracking, invoices, and payment history.' },
              { icon: ShieldCheck, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', title: 'Role-based access', desc: 'Secure dashboards for admins, teachers, students, and parents.' },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`flex items-start gap-4 animate-slide-up stagger-${i + 1}`}
              >
                <div className={`mt-0.5 shrink-0 rounded-xl ${item.bg} p-2.5`}>
                  <item.icon className={`size-5 ${item.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-[15px]">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/50 tracking-wide">Powered by {schoolName}</p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-4 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex size-14 items-center justify-center rounded-2xl shadow-[var(--shadow-subtle)] overflow-hidden">
              <Image src="/educareLogo.png" alt="Logo" width={56} height={56} className="size-14 object-contain" priority />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
              <p className="mt-1 text-sm text-muted-foreground">{schoolName}</p>
            </div>
          </div>
          <div className="hidden text-left lg:block space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue.</p>
          </div>
          <div className="glass-strong rounded-2xl p-8">
            <LoginForm callbackUrl={callbackUrl} showError={error} />
          </div>
        </div>
      </div>
    </div>
  )
}
