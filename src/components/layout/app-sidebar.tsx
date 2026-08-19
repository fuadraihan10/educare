'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { GripVertical } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { useSidebarResize } from '@/hooks/use-sidebar-resize'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { navByRole, type NavItem } from '@/components/layout/nav'
import { UserMenu } from '@/components/layout/user-menu'

type AppSidebarProps = {
  role: string
  schoolName: string
  userName: string
  userEmail: string
}

export function AppSidebar({ role, schoolName, userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname()
  const nav = navByRole[role] ?? { groups: [] }
  const { isResizing, onPointerDown } = useSidebarResize()
  const { state } = useSidebar()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="h-svh rounded-none border-none glass-sidebar"
      >
        <SidebarHeader className="px-3 pt-4 pb-3">
          {/* Expanded header */}
          <div className={`flex items-center gap-3 ${state === 'collapsed' ? 'hidden' : ''}`}>
            <Link href="/" className="flex shrink-0">
              <div className="flex size-10 items-center justify-center rounded-xl overflow-hidden">
                <Image
                  src="/educareLogo.png"
                  alt="Educare Logo"
                  width={40}
                  height={40}
                  className="size-10 object-contain"
                  priority
                />
              </div>
            </Link>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="font-bold tracking-tight leading-snug break-words">{schoolName}</span>
              <span className="text-[11px] text-muted-foreground/60 font-medium">School Management</span>
            </div>
          </div>
          {/* Collapsed header — logo only, centered */}
          <div className={`flex items-center justify-center ${state === 'collapsed' ? '' : 'hidden'}`}>
            <Link href="/" className="flex shrink-0">
              <div className="flex size-9 items-center justify-center rounded-lg overflow-hidden">
                <Image
                  src="/educareLogo.png"
                  alt="Educare"
                  width={36}
                  height={36}
                  className="size-9 object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          {nav.groups.map((group, gi) => (
            <SidebarGroup key={group.label} className="pt-4 pb-1 first:pt-2">
              {gi > 0 && <div className="mx-3 border-t border-border/30 my-2" />}
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 px-2 h-6 mb-1">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item: NavItem) => {
                    const active = isActive(item.href)
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.label}
                          render={<Link href={item.href} />}
                          className={`relative h-10 rounded-lg px-2 text-sm transition-all duration-150 ${
                            active
                              ? 'bg-accent/50 font-semibold text-primary shadow-[var(--shadow-pressed)]'
                              : 'font-medium hover:bg-muted/50 hover:shadow-[var(--shadow-subtle)]'
                          }`}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
                          )}
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="p-3 border-t border-border/40">
          <div className={`rounded-xl bg-muted/20 p-1 ${state === 'collapsed' ? 'flex justify-center p-1' : ''}`}>
            <UserMenu name={userName} email={userEmail} role={role} compact={state === 'collapsed'} />
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      {/* Resize handle */}
      {state === 'expanded' && (
        <div
          onPointerDown={onPointerDown}
          className={`hidden md:flex fixed top-0 bottom-0 z-40 items-center justify-center w-1.5 cursor-col-resize group/resize
            hover:bg-primary/20 transition-colors duration-150
            ${isResizing ? 'bg-primary/30' : ''}`}
          style={{ left: 'var(--sidebar-width, 256px)', transform: 'translateX(-50%)' }}
        >
          <GripVertical className="size-3.5 text-muted-foreground/40 group-hover/resize:text-primary/70 transition-colors" />
        </div>
      )}
    </>
  )
}
