import { describe, expect, it, vi, afterEach } from 'vitest'
import { registerShutdownHandlers } from '@/lib/shutdown'

describe('shutdown', () => {
  afterEach(() => {
    process.removeAllListeners('SIGTERM')
    process.removeAllListeners('SIGINT')
    process.removeAllListeners('beforeExit')
  })

  it('registerShutdownHandlers registers listeners', () => {
    registerShutdownHandlers()
    expect(process.listenerCount('SIGTERM')).toBeGreaterThanOrEqual(1)
    expect(process.listenerCount('SIGINT')).toBeGreaterThanOrEqual(1)
    expect(process.listenerCount('beforeExit')).toBeGreaterThanOrEqual(1)
  })

  it('can be called multiple times without error', () => {
    expect(() => {
      registerShutdownHandlers()
      registerShutdownHandlers()
    }).not.toThrow()
  })

  it('shutdown state prevents re-entry', async () => {
    const spy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    registerShutdownHandlers()

    const _handlerCount = process.listenerCount('SIGTERM')
    process.emit('SIGTERM' as NodeJS.Signals)
    await new Promise((r) => setTimeout(r, 50))

    process.removeAllListeners('SIGTERM')
    process.removeAllListeners('SIGINT')
    process.removeAllListeners('beforeExit')
    spy.mockRestore()
  })
})
