import { describe, expect, it, vi } from 'vitest'
import { memoryAdapter } from '../storage'
import { createKeysmeStore } from '../store'

async function makeStore() {
  const store = createKeysmeStore({ storage: memoryAdapter() })
  await store.init()
  return store
}

describe('proxy mode', () => {
  it('defaults to off', async () => {
    const store = await makeStore()
    expect(store.proxy.get()).toBe(false)
  })

  it('toggles on and notifies subscribers', async () => {
    const store = await makeStore()
    const callback = vi.fn()
    store.proxy.subscribe(callback)

    await store.proxy.set(true)

    expect(store.proxy.get()).toBe(true)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('persists across re-init', async () => {
    const storage = memoryAdapter()
    const store1 = createKeysmeStore({ storage })
    await store1.init()
    await store1.proxy.set(true)

    const store2 = createKeysmeStore({ storage })
    await store2.init()
    expect(store2.proxy.get()).toBe(true)
  })
})

describe('resolveConfig with proxy', () => {
  async function makeStoreWithPreset(proxyBaseURL?: string) {
    const store = await makeStore()
    await store.providers.add({
      id: 'p1',
      name: 'OpenAI',
      baseURL: 'https://api.openai.com/v1',
      ...(proxyBaseURL ? { proxyBaseURL } : {}),
    })
    await store.presets.add({
      id: 'preset1',
      name: 'main',
      providerId: 'p1',
      model: 'gpt-5',
    })
    return store
  }

  it('uses original baseURL when proxy is off', async () => {
    const store = await makeStoreWithPreset('https://my-proxy.com/openai/v1')
    const config = store.resolveConfig('preset1')
    expect(config?.baseURL).toBe('https://api.openai.com/v1')
  })

  it('uses proxyBaseURL when proxy is on', async () => {
    const store = await makeStoreWithPreset('https://my-proxy.com/openai/v1')
    await store.proxy.set(true)
    const config = store.resolveConfig('preset1')
    expect(config?.baseURL).toBe('https://my-proxy.com/openai/v1')
  })

  it('falls back to original baseURL when proxy is on but proxyBaseURL is missing', async () => {
    const store = await makeStoreWithPreset()
    await store.proxy.set(true)
    const config = store.resolveConfig('preset1')
    expect(config?.baseURL).toBe('https://api.openai.com/v1')
  })
})

describe('getModelCapabilities via store', () => {
  it('returns null when no registry is configured', async () => {
    const store = await makeStore()
    expect(store.getModelCapabilities('gpt-5')).toBeNull()
  })

  it('returns capabilities for registered models', async () => {
    const store = createKeysmeStore({
      storage: memoryAdapter(),
      modelCapabilities: {
        'gpt-5': { supports: ['temperature'] },
      },
    })
    await store.init()
    expect(store.getModelCapabilities('gpt-5')).toEqual({ supports: ['temperature'] })
    expect(store.getModelCapabilities('unknown')).toBeNull()
  })
})
