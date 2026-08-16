import 'server-only'

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { headers } from 'next/headers'

import { prisma } from '@/lib/db'
import { z } from 'zod'
import { clearAttempts, isRateLimited, loginRateLimitKey, recordAttempt } from '@/lib/rate-limit'
import type { Role } from '@/generated/prisma/client'

const credentialsSchema = z.object({
  email: z.string().email().max(255).transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(255),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const forwardedFor = (await headers()).get('x-forwarded-for')
        const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined
        const limitKey = loginRateLimitKey(ip, email)

        if (isRateLimited(limitKey)) {
          return null
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || user.status !== 'ACTIVE') {
          recordAttempt(limitKey)
          return null
        }

        const valid = await compare(password, user.passwordHash)
        if (!valid) {
          recordAttempt(limitKey)
          return null
        }

        clearAttempts(limitKey)
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as Role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
})
