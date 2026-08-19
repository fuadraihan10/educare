'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { LogOut, ChevronsUpDown, User, Sun, Moon, Monitor, KeyRound } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton } from '@/components/ui/sidebar'

type UserMenuProps = {
  name: string
  email: string
  role: string
  compact?: boolean
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

const roleConfig: Record<string, { badge: 'default' | 'secondary' | 'outline' | 'destructive'; gradient: string }> = {
  ADMIN: { badge: 'default', gradient: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  SUPER_ADMIN: { badge: 'default', gradient: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  TEACHER: { badge: 'secondary', gradient: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  STUDENT: { badge: 'outline', gradient: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  PARENT: { badge: 'outline', gradient: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
}

function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')} className="gap-2 cursor-pointer">
      {theme === 'dark' ? <Moon className="size-4" /> : theme === 'light' ? <Sun className="size-4" /> : <Monitor className="size-4" />}
      <span>Theme: {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}</span>
    </DropdownMenuItem>
  )
}

export function UserMenu({ name, email, role, compact }: UserMenuProps) {
  const config = roleConfig[role] ?? { badge: 'outline' as const, gradient: 'bg-muted/30' }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-center rounded-lg p-1 hover:bg-accent/50 transition-all duration-150 outline-none cursor-pointer">
          <Avatar className="h-7 w-7 rounded-lg ring-1 ring-border/30">
            <AvatarFallback className={`rounded-lg ${config.gradient} font-semibold text-[10px]`}>{initials(name)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 rounded-xl bg-popover shadow-[var(--shadow-raised-lg)] ring-1 ring-foreground/10 p-1.5" side="right" align="start" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-2 py-2.5 text-left text-sm">
                <Avatar className="h-9 w-9 rounded-xl ring-2 ring-border/30">
                  <AvatarFallback className={`rounded-xl ${config.gradient} font-semibold text-sm`}>{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
                <Badge variant={config.badge} className="uppercase text-[10px] shrink-0">{role.replace('_', ' ')}</Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" render={<Link href="/profile" />}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" render={<Link href="/profile/change-password" />}>
              <KeyRound className="size-4" />
              Change password
            </DropdownMenuItem>
            <ThemeToggleDropdown />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-destructive focus:text-destructive gap-2 rounded-lg cursor-pointer"
            >
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            type="button"
            className="flex w-full items-center gap-2.5 justify-start rounded-xl px-2 py-2.5 h-auto hover:bg-accent/50 transition-all duration-150"
          />
        }
      >
        <Avatar className="h-9 w-9 rounded-xl ring-2 ring-border/30">
          <AvatarFallback className={`rounded-xl ${config.gradient} font-semibold text-sm`}>{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left leading-tight">
          <span className="truncate font-semibold text-sm">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/menu-button:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-xl bg-popover shadow-[var(--shadow-raised-lg)] ring-1 ring-foreground/10 p-1.5" align="end" sideOffset={4}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2.5 px-2 py-2.5 text-left text-sm">
              <Avatar className="h-9 w-9 rounded-xl ring-2 ring-border/30">
          <AvatarFallback className={`rounded-xl ${config.gradient} font-semibold text-sm`}>{initials(name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
              <Badge variant={config.badge} className="uppercase text-[10px] shrink-0">{role.replace('_', ' ')}</Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" render={<Link href="/profile" />}>
            <User className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 rounded-lg cursor-pointer" render={<Link href="/profile/change-password" />}>
            <KeyRound className="size-4" />
            Change password
          </DropdownMenuItem>
          <ThemeToggleDropdown />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-destructive focus:text-destructive gap-2 rounded-lg cursor-pointer"
          >
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
