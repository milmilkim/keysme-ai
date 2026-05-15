import { describe, expect, it } from 'vitest'
import { memoryAdapter } from '../storage'
import { createKeysmeStore } from '../store'

describe('export/import', () => {
  async function makeStore() {
    const store = createKeysmeStore({ storage: memoryAdapter() })
    await store.init()
    return store
  }

  it('exports all data', async () => {
    const store = await makeStore()
    await store.providers.add({ id: 'p1', name: 'P', baseURL: 'http://x', apiKey: 'secret' })
    await store.presets.add({ id: 'pre', name: 'Pre', providerId: 'p1', model: 'gpt' })
    await store.active.set({ presetId: 'pre' })

    const data = await store.export({ includeSecrets: true })
    expect(data.version).toBe(1)
    expect(data.providers).toHaveLength(1)
    expect(data.providers[0]?.apiKey).toBe('secret')
    expect(data.presets).toHaveLength(1)
    expect(data.active).toEqual({ presetId: 'pre' })
  })

  it('exports without secrets', async () => {
    const store = await makeStore()
    await store.providers.add({ id: 'p1', name: 'P', baseURL: 'http://x', apiKey: 'secret' })

    const data = await store.export({ includeSecrets: false })
    expect(data.providers[0]?.apiKey).toBeUndefined()
  })

  it('imports with replace', async () => {
    const store = await makeStore()
    await store.providers.add({ id: 'old', name: 'Old', baseURL: 'http://old' })

    await store.import({
      version: 1,
      providers: [{ id: 'new', name: 'New', baseURL: 'http://new', createdAt: 1, updatedAt: 1 }],
      presets: [],
      active: null,
    })

    expect(store.providers.getSnapshot()).toHaveLength(1)
    expect(store.providers.getSnapshot()[0]?.id).toBe('new')
  })

  it('notifies subscribers on import', async () => {
    const store = await makeStore()
    let notified = 0
    store.providers.subscribe(() => notified++)

    await store.import({
      version: 1,
      providers: [{ id: 'p1', name: 'P', baseURL: 'http://x', createdAt: 1, updatedAt: 1 }],
      presets: [],
      active: null,
    })

    expect(notified).toBeGreaterThan(0)
  })

  it('imports with merge', async () => {
    const store = await makeStore()
    await store.providers.add({ id: 'keep', name: 'Keep', baseURL: 'http://keep' })

    await store.import(
      {
        version: 1,
        providers: [
          { id: 'added', name: 'Added', baseURL: 'http://added', createdAt: 1, updatedAt: 1 },
        ],
        presets: [],
        active: null,
      },
      { merge: true },
    )

    expect(store.providers.getSnapshot()).toHaveLength(2)
  })
})
