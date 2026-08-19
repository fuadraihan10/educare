import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id || !session.user.sessionId) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  await prisma.userSession
    .updateMany({
      where: { id: session.user.sessionId as string, userId: session.user.id },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {})

  return NextResponse.json({ ok: true })
}
