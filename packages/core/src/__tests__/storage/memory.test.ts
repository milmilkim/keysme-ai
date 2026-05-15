import { describe, expect, it } from 'vitest'
import { memoryAdapter } from '../../storage'

describe('memoryAdapter', () => {
  it('returns null for missing key', async () => {
    const adapter = memoryAdapter()
    expect(await adapter.get('missing')).toBeNull()
  })
  it('stores and retrieves value', async () => {
    const adapter = memoryAdapter()
    await adapter.set('key', { foo: 'bar' })
    expect(await adapter.get('key')).toEqual({ foo: 'bar' })
  })
  it('removes value', async () => {
    const adapter = memoryAdapter()
    await adapter.set('key', 'value')
    await adapter.remove('key')
    expect(await adapter.get('key')).toBeNull()
  })
  it('stores arrays', async () => {
    const adapter = memoryAdapter()
    await adapter.set('list', [1, 2, 3])
    expect(await adapter.get('list')).toEqual([1, 2, 3])
  })
})
