import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import type { Role } from '@/generated/prisma/client'

const allRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePage(...allRoles)

  const school = await prisma.school.findFirst({
    select: { name: true },
  })

  return (
    <SidebarProvider>
      <AppSidebar
        role={user.role}
        schoolName={school?.name ?? 'School'}
        userName={user.name}
        userEmail={user.email}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
