'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  LogOut, User, KeyRound, Bell, Shield, Activity,
  Clock, Settings, ChevronRight, Loader2
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { revokeCurrentSession, logLogout } from '@/lib/profile/actions'

type UserAvatarProps = {
  name: string
  email: string
  regNo: string
  role: string
  sessionId: string
}

const roleGradient: Record<string, string> = {
  ADMIN: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  SUPER_ADMIN: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  TEACHER: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  STUDENT: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  PARENT: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
}

export function UserAvatar({ name, email, regNo, role, sessionId }: UserAvatarProps) {
  const [loggingOut, setLoggingOut] = useState(false)
  const gradient = roleGradient[role] ?? 'bg-muted/30 text-muted-foreground'

  async function handleLogout() {
    setLoggingOut(true)
    try {
      if (sessionId) await revokeCurrentSession(sessionId)
      await logLogout()
    } catch {
      // best effort
    }
    signOut({ callbackUrl: '/login' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-accent/50 transition-all duration-150 outline-none cursor-pointer"
          />
        }
      >
        <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border/40">
          <AvatarFallback className={`rounded-lg text-xs font-semibold ${gradient}`}>
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64 rounded-xl bg-popover shadow-[var(--shadow-raised-lg)] ring-1 ring-foreground/10 p-1.5" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <div className="px-2.5 py-2.5 border-b border-border/30 mb-1">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            <p className="text-[11px] font-mono text-muted-foreground truncate">{regNo}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2.5">My Account</DropdownMenuLabel>
          <DropdownMenuItem className="gap-2.5 rounded-lg cursor-pointer px-2.5" render={<Link href="/profile" />}>
            <User className="size-4" />
            <span>Profile</span>
            <ChevronRight className="size-3 ml-auto text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2.5 rounded-lg cursor-pointer px-2.5" render={<Link href="/profile/edit" />}>
            <Settings className="size-4" />
            <span>Edit Profile</span>
            <ChevronRight className="size-3 ml-auto text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2.5">Preferences</DropdownMenuLabel>
          <DropdownMenuItem className="gap-2.5 rounded-lg cursor-pointer px-2.5" render={<Link href="/profile/notifications" />}>
            <Bell className="size-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2.5">Security</DropdownMenuLabel>
          <DropdownMenuItem className="gap-2.5 rounded-lg cursor-pointer px-2.5" render={<Link href="/profile/security" />}>
            <KeyRound className="size-4" />
            <span>Password & Security</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2.5 rounded-lg cursor-pointer px-2.5" render={<Link href="/profile/sessions" />}>
            <Clock className="size-4" />
            <span>Active Sessions</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2.5 rounded-lg cursor-pointer px-2.5" render={<Link href="/profile/activity" />}>
            <Activity className="size-4" />
            <span>Activity Log</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="gap-2.5 rounded-lg cursor-pointer px-2.5" render={<Link href="/profile/permissions" />}>
            <Shield className="size-4" />
            <span>Roles & Permissions</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-destructive focus:text-destructive gap-2.5 rounded-lg cursor-pointer px-2.5"
          >
            {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            <span>{loggingOut ? 'Signing out\u2026' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
