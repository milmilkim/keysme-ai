import { beforeEach, describe, expect, it } from 'vitest'
import { localStorageAdapter } from '../../storage'

describe('localStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it('returns null for missing key', async () => {
    const adapter = localStorageAdapter()
    expect(await adapter.get('missing')).toBeNull()
  })
  it('stores and retrieves JSON value', async () => {
    const adapter = localStorageAdapter()
    await adapter.set('key', { foo: 'bar' })
    expect(await adapter.get('key')).toEqual({ foo: 'bar' })
  })
  it('removes value', async () => {
    const adapter = localStorageAdapter()
    await adapter.set('key', 'value')
    await adapter.remove('key')
    expect(await adapter.get('key')).toBeNull()
  })
  it('persists to actual localStorage', async () => {
    const adapter = localStorageAdapter()
    await adapter.set('test', [1, 2, 3])
    const raw = localStorage.getItem('test')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string)).toEqual([1, 2, 3])
  })
})
