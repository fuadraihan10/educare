import type { Role } from '@/generated/prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      regNo: string
      role: Role
      sessionId: string
    }
  }

  interface User {
    role: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    regNo: string
    sessionId: string
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: Role
    regNo: string
    sessionId: string
  }
}
