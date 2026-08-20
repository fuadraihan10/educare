import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import type { Role } from '@/generated/prisma/client'
import { generateRequestId, createRequestLogger } from '@/lib/logger'
import { initApp } from '@/lib/startup'

const globalForInit = globalThis as unknown as { __appInitialized?: boolean }

if (!globalForInit.__appInitialized) {
  globalForInit.__appInitialized = true
  initApp()
}

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

const isDev = process.env.NODE_ENV !== 'production'

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  // Content Security Policy — restrict sources to prevent XSS.
  // NOTE: 'unsafe-inline' for scripts is required by Next.js inlined script chunks.
  //   To remove it, migrate to a nonce-based CSP. See:
  //   https://nextjs.org/docs/app/building-your-application/security/content-security-policy
  //   After migration, replace 'unsafe-inline' with 'nonce-<dynamic>'.
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))

  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  return response
}

export default auth((req: NextRequest & { auth?: { user?: { role?: Role } } | null }) => {
  const requestId = generateRequestId()
  const start = Date.now()
  const { pathname } = req.nextUrl
  const session = req.auth
  const log = createRequestLogger(requestId, { method: req.method, path: pathname })

  log.debug('request started')

  const isPublic = pathname === '/login' || pathname === '/' || pathname.startsWith('/api/auth') || pathname === '/forgot-password' || pathname.startsWith('/reset-password') || pathname.startsWith('/verify-pin') || pathname.startsWith('/api/v1/health') || pathname.startsWith('/api/v1/ready')

  let response: NextResponse = NextResponse.next()

  if (isPublic) {
    if (session?.user?.role && pathname === '/login') {
      const home = roleHome[session.user.role]
      response = NextResponse.redirect(new URL(home, req.nextUrl))
      log.info({ redirectTo: home }, 'authenticated user redirected from login')
    } else {
      response = NextResponse.next()
    }
  } else if (!session?.user?.role) {
    const url = new URL('/login', req.nextUrl)
    url.searchParams.set('callbackUrl', pathname)
    response = NextResponse.redirect(url)
    log.info('unauthenticated user redirected to login')
  } else {
    for (const { prefix, roles } of rolePrefixes) {
      if (pathname.startsWith(prefix) && !roles.includes(session.user.role)) {
        const home = roleHome[session.user.role]
        response = NextResponse.redirect(new URL(home, req.nextUrl))
        log.info({ redirectTo: home, role: session.user.role }, 'wrong role redirected')
        break
      }
    }
  }

  addSecurityHeaders(response)
  response.headers.set('X-Request-Id', requestId)

  const duration = Date.now() - start
  response.headers.set('X-Response-Time', `${duration}ms`)
  log.info({ method: req.method, path: pathname, status: response.status, duration }, 'request completed')

  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
