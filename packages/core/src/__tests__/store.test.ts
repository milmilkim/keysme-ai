import { describe, expect, it, vi } from 'vitest'
import { KeysmeError } from '../errors'
import { memoryAdapter } from '../storage'
import { createKeysmeStore } from '../store'

describe('createKeysmeStore', () => {
  async function makeStore() {
    const store = createKeysmeStore({ storage: memoryAdapter() })
    await store.init()
    return store
  }

  describe('providers', () => {
    it('starts empty', async () => {
      const store = await makeStore()
      expect(store.providers.getSnapshot()).toEqual([])
    })

    it('adds a provider', async () => {
      const store = await makeStore()
      const provider = await store.providers.add({
        id: 'test',
        name: 'Test',
        baseURL: 'http://localhost:11434/v1',
      })
      expect(provider.id).toBe('test')
      expect(provider.createdAt).toBeGreaterThan(0)
      expect(store.providers.getSnapshot()).toHaveLength(1)
    })

    it('notifies subscribers on add', async () => {
      const store = await makeStore()
      const callback = vi.fn()
      store.providers.subscribe(callback)
      await store.providers.add({ id: 'test', name: 'Test', baseURL: 'http://x' })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('rejects duplicate id', async () => {
      const store = await makeStore()
      await store.providers.add({ id: 'dup', name: 'A', baseURL: 'http://a' })
      await expect(
        store.providers.add({ id: 'dup', name: 'B', baseURL: 'http://b' }),
      ).rejects.toThrow(KeysmeError)
    })

    it('rejects empty baseURL', async () => {
      const store = await makeStore()
      await expect(store.providers.add({ id: 'x', name: 'X', baseURL: '' })).rejects.toThrow(
        KeysmeError,
      )
    })

    it('updates a provider', async () => {
      const store = await makeStore()
      await store.providers.add({ id: 'test', name: 'Old', baseURL: 'http://x' })
      const updated = await store.providers.update('test', { name: 'New' })
      expect(updated.name).toBe('New')
      expect(updated.updatedAt).toBeGreaterThan(updated.createdAt)
    })

    it('removes a provider', async () => {
      const store = await makeStore()
      await store.providers.add({ id: 'test', name: 'Test', baseURL: 'http://x' })
      await store.providers.remove('test')
      expect(store.providers.getSnapshot()).toHaveLength(0)
    })

    it('rejects removing provider in use by preset', async () => {
      const store = await makeStore()
      await store.providers.add({ id: 'prov', name: 'P', baseURL: 'http://x' })
      await store.presets.add({ id: 'pre', name: 'Pre', providerId: 'prov', model: 'gpt' })
      await expect(store.providers.remove('prov')).rejects.toThrow(KeysmeError)
    })
  })

  describe('presets', () => {
    it('adds a preset with valid providerId', async () => {
      const store = await makeStore()
      await store.providers.add({ id: 'prov', name: 'P', baseURL: 'http://x' })
      const preset = await store.presets.add({
        id: 'pre',
        name: 'Main',
        providerId: 'prov',
        model: 'claude-sonnet',
      })
      expect(preset.id).toBe('pre')
      expect(store.presets.getSnapshot()).toHaveLength(1)
    })

    it('rejects preset with invalid providerId', async () => {
      const store = await makeStore()
      await expect(
        store.presets.add({ id: 'pre', name: 'P', providerId: 'nope', model: 'x' }),
      ).rejects.toThrow(KeysmeError)
    })

    it('rejects preset with empty model', async () => {
      const store = await makeStore()
      await store.providers.add({ id: 'prov', name: 'P', baseURL: 'http://x' })
      await expect(
        store.presets.add({ id: 'pre', name: 'P', providerId: 'prov', model: '' }),
      ).rejects.toThrow(KeysmeError)
    })

    it('nullifies active when preset is deleted', async () => {
      const store = await makeStore()
      await store.providers.add({ id: 'prov', name: 'P', baseURL: 'http://x' })
      await store.presets.add({ id: 'pre', name: 'P', providerId: 'prov', model: 'x' })
      await store.active.set({ presetId: 'pre' })
      await store.presets.remove('pre')
      expect(store.active.getSnapshot()).toBeNull()
    })
  })

  describe('active', () => {
    it('starts null', async () => {
      const store = await makeStore()
      expect(store.active.getSnapshot()).toBeNull()
    })

    it('sets active', async () => {
      const store = await makeStore()
      await store.active.set({ presetId: 'any' })
      expect(store.active.getSnapshot()).toEqual({ presetId: 'any' })
    })

    it('sets to null', async () => {
      const store = await makeStore()
      await store.active.set({ presetId: 'x' })
      await store.active.set(null)
      expect(store.active.getSnapshot()).toBeNull()
    })
  })
})
