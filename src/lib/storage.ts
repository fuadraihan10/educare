import 'server-only'

import { mkdir, writeFile, readFile as fsReadFile, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { FileCategory } from '@/generated/prisma/client'

const storageRoot = path.resolve(process.cwd(), process.env.UPLOAD_STORAGE_DIR ?? 'storage')

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

type MimeInfo = { ext: string; maxSize: number; sniff: (buf: Buffer) => boolean }

const mimeRegistry: Record<string, MimeInfo> = {
  'image/jpeg': { ext: 'jpg', maxSize: MAX_IMAGE_SIZE, sniff: (b) => b.length > 2 && b[0] === 0xff && b[1] === 0xd8 },
  'image/png': { ext: 'png', maxSize: MAX_IMAGE_SIZE, sniff: (b) => b.length > 7 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/gif': { ext: 'gif', maxSize: MAX_IMAGE_SIZE, sniff: (b) => b.length > 5 && (b.slice(0, 6).toString('ascii') === 'GIF87a' || b.slice(0, 6).toString('ascii') === 'GIF89a') },
  'image/webp': { ext: 'webp', maxSize: MAX_IMAGE_SIZE, sniff: (b) => b.length > 11 && b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP' },
  'application/pdf': { ext: 'pdf', maxSize: MAX_FILE_SIZE, sniff: (b) => b.length > 4 && b.slice(0, 5).toString('ascii') === '%PDF-' },
}

function extensionFor(originalName: string, mimeType: string): string | null {
  const mime = mimeRegistry[mimeType]
  if (mime) return mime.ext
  const ext = originalName.split('.').pop()?.toLowerCase()
  return ext && ext.length >= 1 && ext.length <= 5 && /^[a-z0-9]+$/.test(ext) ? ext : null
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

function validateMime(mimeType: string): MimeInfo {
  const info = mimeRegistry[mimeType]
  if (!info) throw new StorageError('Unsupported file type.')
  return info
}

function resolveSafePath(storageKey: string): string {
  const abs = path.resolve(storageRoot, storageKey)
  if (!abs.startsWith(path.resolve(storageRoot))) {
    throw new StorageError('Invalid storage key.')
  }
  return abs
}

export async function saveFile(input: {
  data: Buffer
  mimeType: string
  originalName: string
  category: FileCategory
}): Promise<{ storageKey: string; filename: string; mimeType: string; size: number }> {
  const info = validateMime(input.mimeType)
  if (input.data.length > info.maxSize) {
    throw new StorageError('File exceeds the allowed size.')
  }
  if (!info.sniff(input.data)) {
    throw new StorageError('File content does not match its declared type.')
  }
  const ext = extensionFor(input.originalName, input.mimeType)
  if (!ext) throw new StorageError('Could not determine a safe file extension.')

  const filename = `${randomUUID()}.${ext}`
  const storageKey = `${input.category.toLowerCase()}/${filename}`
  const abs = resolveSafePath(storageKey)
  await mkdir(path.dirname(abs), { recursive: true })
  await writeFile(abs, input.data, { flag: 'wx' })
  return { storageKey, filename, mimeType: input.mimeType, size: input.data.length }
}

export async function readFile(storageKey: string): Promise<{ data: Buffer; mimeType: string }> {
  const abs = resolveSafePath(storageKey)
  const data = await fsReadFile(abs)
  const ext = storageKey.split('.').pop()?.toLowerCase()
  const mimeType = Object.entries(mimeRegistry).find(([, v]) => v.ext === ext)?.[0] ?? 'application/octet-stream'
  return { data, mimeType }
}

export async function deleteFile(storageKey: string): Promise<void> {
  const abs = resolveSafePath(storageKey)
  await unlink(abs)
}
