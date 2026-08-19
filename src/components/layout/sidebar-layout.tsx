'use client'

import { SidebarProvider } from '@/components/ui/sidebar'
import { useSidebarResize } from '@/hooks/use-sidebar-resize'

type SidebarLayoutProps = {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const { width } = useSidebarResize()
  return (
    <SidebarProvider sidebarWidth={`${width}px`}>
      {children}
    </SidebarProvider>
  )
}
