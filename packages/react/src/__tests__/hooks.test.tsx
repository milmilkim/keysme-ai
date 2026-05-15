import { createKeysmeStore, memoryAdapter } from '@keysme-ai/core'
import type { KeysmeStore } from '@keysme-ai/core'
import { act, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { useActiveSelection } from '../hooks/use-active-selection'
import { usePresetConfig } from '../hooks/use-preset-config'
import { usePresets } from '../hooks/use-presets'
import { useProviders } from '../hooks/use-providers'
import { KeysmeProvider } from '../provider'

async function makeStore(): Promise<KeysmeStore> {
  const store = createKeysmeStore({ storage: memoryAdapter() })
  await store.init()
  return store
}

function wrapper(store: KeysmeStore) {
  return ({ children }: { children: React.ReactNode }) =>
    createElement(KeysmeProvider, { store, children })
}

describe('useProviders', () => {
  it('returns empty providers initially', async () => {
    const store = await makeStore()
    const { result } = renderHook(() => useProviders(), { wrapper: wrapper(store) })
    expect(result.current.providers).toEqual([])
  })

  it('updates after addProvider', async () => {
    const store = await makeStore()
    const { result } = renderHook(() => useProviders(), { wrapper: wrapper(store) })

    await act(async () => {
      await result.current.addProvider({ id: 'test', name: 'T', baseURL: 'http://x' })
    })

    expect(result.current.providers).toHaveLength(1)
    expect(result.current.providers[0]?.id).toBe('test')
  })
})

describe('usePresets', () => {
  it('returns empty presets initially', async () => {
    const store = await makeStore()
    const { result } = renderHook(() => usePresets(), { wrapper: wrapper(store) })
    expect(result.current.presets).toEqual([])
  })
})

describe('useActiveSelection', () => {
  it('returns null initially', async () => {
    const store = await makeStore()
    const { result } = renderHook(() => useActiveSelection(), { wrapper: wrapper(store) })
    expect(result.current.active).toBeNull()
  })

  it('updates after setActive', async () => {
    const store = await makeStore()
    const { result } = renderHook(() => useActiveSelection(), { wrapper: wrapper(store) })

    await act(async () => {
      await result.current.setActive({ presetId: 'abc' })
    })

    expect(result.current.active).toEqual({ presetId: 'abc' })
  })
})

describe('usePresetConfig', () => {
  it('returns null for missing preset', async () => {
    const store = await makeStore()
    const { result } = renderHook(() => usePresetConfig('nope'), { wrapper: wrapper(store) })
    expect(result.current.config).toBeNull()
  })

  it('resolves config for valid preset', async () => {
    const store = await makeStore()
    await store.providers.add({ id: 'prov', name: 'P', baseURL: 'http://x' })
    await store.presets.add({ id: 'pre', name: 'Pre', providerId: 'prov', model: 'gpt' })

    const { result } = renderHook(() => usePresetConfig('pre'), { wrapper: wrapper(store) })
    expect(result.current.config).not.toBeNull()
    expect(result.current.config?.model).toBe('gpt')
    expect(result.current.config?.baseURL).toBe('http://x')
  })
})
