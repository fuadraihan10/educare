import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { rm, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// UPLOAD_STORAGE_DIR is fixed by the vitest config to tests/tmp-storage.
import { saveFile, readFile, deleteFile, StorageError, MAX_IMAGE_SIZE } from '@/lib/storage'
import { FileCategory } from '@/generated/prisma/client'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const storageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../tests/tmp-storage')

describe('storage', () => {
  beforeAll(async () => {
    await rm(storageRoot, { recursive: true, force: true })
  })

  afterAll(async () => {
    await rm(storageRoot, { recursive: true, force: true })
  })

  it('saves a valid image and returns a server-side filename', async () => {
    const data = Buffer.concat([PNG_MAGIC, Buffer.alloc(100, 1)])
    const res = await saveFile({
      data,
      mimeType: 'image/png',
      originalName: 'photo.png',
      category: FileCategory.PHOTO,
    })
    expect(res.filename).toMatch(/^[0-9a-f-]{36}\.png$/)
    expect(res.size).toBe(data.length)
    expect(res.storageKey).toBe(`photo/${res.filename}`)
  })

  it('rejects a file whose content does not match its declared type', async () => {
    await expect(
      saveFile({
        data: Buffer.from('this is not a png at all'),
        mimeType: 'image/png',
        originalName: 'fake.png',
        category: FileCategory.PHOTO,
      }),
    ).rejects.toThrow(StorageError)
  })

  it('rejects oversized files', async () => {
    const data = Buffer.concat([PNG_MAGIC, Buffer.alloc(MAX_IMAGE_SIZE + 1, 0)])
    await expect(
      saveFile({
        data,
        mimeType: 'image/png',
        originalName: 'big.png',
        category: FileCategory.PHOTO,
      }),
    ).rejects.toThrow(StorageError)
  })

  it('round-trips a saved file through readFile and deleteFile', async () => {
    const data = Buffer.concat([PNG_MAGIC, Buffer.from('content')])
    const { storageKey } = await saveFile({
      data,
      mimeType: 'image/png',
      originalName: 'roundtrip.png',
      category: FileCategory.PHOTO,
    })

    const read = await readFile(storageKey)
    expect(read.data.equals(data)).toBe(true)
    expect(read.mimeType).toBe('image/png')

    await deleteFile(storageKey)
    const dir = path.dirname(path.join(storageRoot, storageKey))
    const listing = await readdir(dir)
    expect(listing).not.toContain(storageKey.split('/').pop())
  })

  it('blocks path traversal in storage keys', async () => {
    await expect(readFile('../../etc/passwd')).rejects.toThrow(StorageError)
  })
})
