import 'server-only'

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { headers } from 'next/headers'

import { prisma } from '@/lib/db'
import { clearAttempts, isRateLimited, loginRateLimitKey, recordAttempt } from '@/lib/rate-limit'
import type { Role } from '@/generated/prisma/client'
import { credentialsSchema, resolveIp } from '@/lib/auth-helpers'
import { auditLog } from '@/lib/audit'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        regNo: { label: 'Registration Number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { regNo, password } = parsed.data

        const hdrs = await headers()
        const ip = resolveIp(hdrs)
        const userAgent = hdrs.get('user-agent') ?? 'unknown'
        const limitKey = loginRateLimitKey(ip, regNo)

        if (await isRateLimited(limitKey)) {
          return null
        }

        const user = await prisma.user.findUnique({ where: { regNo } })
        if (!user || user.status !== 'ACTIVE') {
          await recordAttempt(limitKey)
          auditLog({ action: 'LOGIN_FAILED', entity: 'User', details: { regNo, reason: !user ? 'not_found' : 'inactive' }, ipAddress: ip, userAgent })
          return null
        }

        const valid = await compare(password, user.passwordHash)
        if (!valid) {
          await recordAttempt(limitKey)
          auditLog({ actorId: user.id, action: 'LOGIN_FAILED', entity: 'User', entityId: user.id, details: { reason: 'wrong_password' }, ipAddress: ip, userAgent })
          return null
        }

        await clearAttempts(limitKey)

        // Update last login info
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), lastLoginIp: ip },
        })

        // Create session record
        const sessionId = crypto.randomUUID()

        const ua = userAgent.toLowerCase()
        let browser = 'Unknown'
        if (ua.includes('edg/')) browser = 'Edge'
        else if (ua.includes('chrome/')) browser = 'Chrome'
        else if (ua.includes('firefox/')) browser = 'Firefox'
        else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Safari'

        let os = 'Unknown'
        if (ua.includes('windows')) os = 'Windows'
        else if (ua.includes('mac os')) os = 'macOS'
        else if (ua.includes('linux') && !ua.includes('android')) os = 'Linux'
        else if (ua.includes('android')) os = 'Android'
        else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

        const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')
        const isTablet = ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'))
        const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

        const sessionRecord = await prisma.userSession.create({
          data: {
            userId: user.id,
            tokenHash: sessionId,
            browser,
            os,
            device: deviceType,
            ipAddress: ip,
            isCurrent: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        }).catch(() => null)

        // Log activity
        auditLog({ actorId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, ipAddress: ip, userAgent })

        return { id: user.id, name: user.name, email: user.email, role: user.role, sessionId: sessionRecord?.id ?? sessionId }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as Role
        token.sessionId = (user as unknown as Record<string, unknown>).sessionId as string
      }
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, status: true, regNo: true },
        })
        if (!dbUser || dbUser.status !== 'ACTIVE') {
          return null
        }
        token.regNo = dbUser.regNo
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.regNo = token.regNo as string
      session.user.sessionId = token.sessionId as string
      return session
    },
  },
})
