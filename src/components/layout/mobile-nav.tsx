'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navByRole } from '@/components/layout/nav'

export function MobileNav({ role = 'ADMIN' }: { role?: string }) {
  const pathname = usePathname()
  const nav = navByRole[role] ?? navByRole['ADMIN'] ?? { groups: [] }

  const allItems = nav.groups.flatMap((g) => g.items)
  const homeHref = allItems[0]?.href ?? '/admin'
  const navItems = allItems.length > 4
    ? [...allItems.slice(0, 3), allItems[allItems.length - 1]]
    : allItems.slice(0, 4)

  const isActive = (href: string) => {
    if (href === homeHref) return pathname === homeHref
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 md:hidden',
        'glass-strong border-t border-border/30',
        'pb-[env(safe-area-inset-bottom)]'
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-all duration-150 min-h-[44px] justify-center',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-lg transition-all duration-150',
                  active && 'bg-primary/10 shadow-[var(--shadow-pressed)]',
                  !active && 'hover:bg-muted/50'
                )}
              >
                <Icon className="size-4.5" />
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
