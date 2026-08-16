import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import type { Role } from '@/generated/prisma/client'

// Optimistic route protection. Real authorization always happens again in
// Server Actions and data access code close to the data source.

const roleHome: Record<Role, string> = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
  PARENT: '/parent',
}

const rolePrefixes: { prefix: string; roles: Role[] }[] = [
  { prefix: '/admin', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { prefix: '/teacher', roles: ['TEACHER'] },
  { prefix: '/student', roles: ['STUDENT'] },
  { prefix: '/parent', roles: ['PARENT'] },
]

export default auth((req: NextRequest & { auth?: { user?: { role?: Role } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isPublic = pathname === '/login' || pathname === '/' || pathname.startsWith('/api/auth')

  if (isPublic) {
    if (session?.user?.role && pathname === '/login') {
      const home = roleHome[session.user.role]
      return NextResponse.redirect(new URL(home, req.nextUrl))
    }
    return NextResponse.next()
  }

  if (!session?.user?.role) {
    const url = new URL('/login', req.nextUrl)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  for (const { prefix, roles } of rolePrefixes) {
    if (pathname.startsWith(prefix) && !roles.includes(session.user.role)) {
      return NextResponse.redirect(new URL(roleHome[session.user.role], req.nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
