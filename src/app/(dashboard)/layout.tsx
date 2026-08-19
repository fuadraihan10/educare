import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { requirePage } from '@/lib/permissions'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { Role } from '@/generated/prisma/client'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { CommandTrigger } from '@/components/layout/command-trigger'
import { UserAvatar } from '@/components/layout/user-avatar'
import { NotificationBell } from '@/components/layout/notification-bell'
import { SessionPing } from '@/components/layout/session-ping'

const allRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, session, school] = await Promise.all([
    requirePage(...allRoles),
    auth(),
    prisma.school.findFirst({ select: { name: true } }),
  ])

  return (
    <SidebarLayout>
      <SessionPing />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <AppSidebar
        role={user.role}
        schoolName={school?.name ?? 'School'}
        userName={user.name}
        userEmail={user.email}
      />
      <SidebarInset>
        <header className="glass-header sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 px-4 md:px-6 border-b border-border/30">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 h-8 w-8 hover:bg-accent/50 transition-all duration-200 rounded-lg" />
          </div>
          <div className="flex items-center gap-1">
            <CommandTrigger />
            <NotificationBell />
            <ThemeToggle />
            <UserAvatar
              name={user.name}
              email={user.email}
              regNo={user.regNo}
              role={user.role}
              sessionId={session?.user?.sessionId ?? ''}
            />
          </div>
        </header>
        <main id="main-content" className="flex flex-1 flex-col gap-6 p-4 pb-24 md:pb-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
      <MobileNav role={user.role} />
    </SidebarLayout>
  )
}
