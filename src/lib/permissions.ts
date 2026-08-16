import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import type { Role, User } from '@/generated/prisma/client'
import { prisma } from '@/lib/db'

export const roleHome: Record<Role, string> = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
  PARENT: '/parent',
}

export class AuthorizationError extends Error {
  constructor(message = 'You are not authorized to perform this action.') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
}

// Returns the session user (no DB hit) or null when unauthenticated.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth()
  return session?.user ?? null
})

// Loads the full User row for the session user, or null.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return null
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } })
  if (!user || user.status !== 'ACTIVE') return null
  return user
})

// Page-level guard: redirects unauthenticated users to /login and
// wrong-role users to their own dashboard.
export const requirePage = cache(async (...roles: Role[]): Promise<User> => {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!roles.includes(user.role)) redirect(roleHome[user.role])
  return user
})

// Action-level guard: throws so mutations fail loudly rather than silently
// redirecting. Returns the full User row.
export const requireRole = cache(async (...roles: Role[]): Promise<User> => {
  const user = await getCurrentUser()
  if (!user) throw new AuthorizationError('You must be signed in.')
  if (!roles.includes(user.role)) {
    throw new AuthorizationError('You are not authorized to perform this action.')
  }
  return user
})

export function isRole(user: User | null | undefined, roles: Role[]): boolean {
  return !!user && roles.includes(user.role)
}
