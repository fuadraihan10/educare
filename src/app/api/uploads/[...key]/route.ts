import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getCurrentUser, getSessionUser } from '@/lib/permissions'
import { canViewStudent } from '@/lib/students'
import { readFile } from '@/lib/storage'

const allowedCategories = new Set(['photo', 'document', 'id_card', 'other'])

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  const storageKey = key.join('/')
  const category = key[0]
  if (!allowedCategories.has(category) || key.length > 3) {
    return NextResponse.json({ error: 'Invalid file key.' }, { status: 400 })
  }

  const sessionUser = await getSessionUser()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const file = await prisma.studentFile.findUnique({ where: { storageKey } })
  if (!file) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  if (!(await canViewStudent(user, file.studentId))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const { data, mimeType } = await readFile(storageKey)
    const body = new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength)
    const safeName = file.originalName.replace(/[\r\n\x00-\x1f"]/g, '_').slice(0, 200)
    return new Response(body, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': `inline; filename="${safeName}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'File is missing.' }, { status: 404 })
  }
}
