import { getModelCapabilities } from '../capabilities'
import { KeysmeError } from '../errors'
import { getProtocol } from '../protocols'
import type { StorageAdapter } from '../storage/types'
import type {
  ActiveSelection,
  KeysmeExport,
  ModelCapabilities,
  ModelCapabilitiesRegistry,
  Preset,
  Provider,
  ResolvedConfig,
} from '../types'
import { inferBaseURL } from '../utils/infer-base-url'
import { joinUrl } from '../utils/join-url'
import { validatePresetAdd, validateProviderAdd, validateProviderRemove } from '../validation'
import { createActiveSlice } from './active-slice'
import { createEntitySlice } from './entity-slice'

const KEYS = {
  providers: 'keysme:providers',
  presets: 'keysme:presets',
  active: 'keysme:active',
  proxy: 'keysme:proxy',
  models: (id: string) => `keysme:models:v1:${id}`,
}

export interface KeysmeStoreOptions {
  storage: StorageAdapter
  modelCapabilities?: ModelCapabilitiesRegistry
}

export function createKeysmeStore({ storage, modelCapabilities }: KeysmeStoreOptions) {
  const { slice: providersSlice, load: loadProviders } = createEntitySlice<Provider>(
    storage,
    KEYS.providers,
    {
      validateAdd(input, existing) {
        validateProviderAdd(input as { id: string; baseURL: string }, existing)
      },
      validateRemove(id) {
        validateProviderRemove(id, presetsSlice.getSnapshot())
      },
    },
  )

  const { slice: presetsSlice, load: loadPresets } = createEntitySlice<Preset>(
    storage,
    KEYS.presets,
    {
      validateAdd(input, existing) {
        validatePresetAdd(
          input as { id: string; providerId: string; model: string },
          existing,
          providersSlice.getSnapshot(),
        )
      },
      async onRemove(id) {
        const active = activeSlice.getSnapshot()
        if (active?.presetId === id) {
          await activeSlice.set(null)
        }
      },
    },
  )

  const { slice: activeSlice, load: loadActive } = createActiveSlice(storage, KEYS.active)
  const modelsCache = new Map<string, string[]>()

  let useProxyState = false
  const proxyListeners = new Set<() => void>()

  function resolveBaseURL(provider: Provider): string {
    return useProxyState && provider.proxyBaseURL ? provider.proxyBaseURL : provider.baseURL
  }

  let initialized = false

  const store = {
    get isInitialized() {
      return initialized
    },

    async init() {
      const [providers, presets, active, proxy] = await Promise.all([
        storage.get<Provider[]>(KEYS.providers),
        storage.get<Preset[]>(KEYS.presets),
        storage.get<ActiveSelection>(KEYS.active),
        storage.get<boolean>(KEYS.proxy),
      ])
      loadProviders(providers ?? [])
      loadPresets(presets ?? [])
      loadActive(active ?? null)
      useProxyState = proxy ?? false
      initialized = true
    },

    providers: providersSlice,
    presets: presetsSlice,
    active: activeSlice,

    proxy: {
      get(): boolean {
        return useProxyState
      },
      async set(value: boolean): Promise<void> {
        useProxyState = value
        if (value) await storage.set(KEYS.proxy, true)
        else await storage.remove(KEYS.proxy)
        for (const cb of proxyListeners) cb()
      },
      subscribe(callback: () => void): () => void {
        proxyListeners.add(callback)
        return () => {
          proxyListeners.delete(callback)
        }
      },
    },

    getModelCapabilities(model: string): ModelCapabilities | null {
      return getModelCapabilities(model, modelCapabilities)
    },

    models: {
      async fetch(providerId: string): Promise<string[]> {
        const provider = providersSlice.getSnapshot().find((p) => p.id === providerId)
        if (!provider)
          throw new KeysmeError('PROVIDER_NOT_FOUND', `Provider "${providerId}" not found`)

        const base = inferBaseURL(resolveBaseURL(provider))
        const url = joinUrl(base, 'models')

        try {
          const protocol = getProtocol(provider.protocol)
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (provider.apiKey) Object.assign(headers, protocol.authHeaders(provider.apiKey))
          if (provider.headers) Object.assign(headers, provider.headers)

          const response = await fetch(url, { headers })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)

          const models = protocol.parseModels(await response.json())

          modelsCache.set(providerId, models)
          await storage.set(KEYS.models(providerId), models)
          return models
        } catch (e) {
          throw new KeysmeError('MODEL_FETCH_FAILED', `Failed to fetch models: ${e}`)
        }
      },

      getCached(providerId: string): string[] | null {
        return modelsCache.get(providerId) ?? null
      },
    },

    resolveConfig(presetId: string): ResolvedConfig | null {
      const preset = presetsSlice.getSnapshot().find((p) => p.id === presetId)
      if (!preset) return null
      const provider = providersSlice.getSnapshot().find((p) => p.id === preset.providerId)
      if (!provider) return null

      return {
        baseURL: resolveBaseURL(provider),
        protocol: provider.protocol ?? 'openai',
        apiKey: provider.apiKey,
        model: preset.model,
        params: preset.params ?? {},
        headers: provider.headers,
      }
    },

    async export(options?: { includeSecrets?: boolean }): Promise<KeysmeExport> {
      const providers = providersSlice.getSnapshot().map((p) => {
        if (options?.includeSecrets === false) {
          const { apiKey, ...rest } = p
          return rest as Provider
        }
        return p
      })
      return {
        version: 1,
        providers,
        presets: presetsSlice.getSnapshot(),
        active: activeSlice.getSnapshot(),
      }
    },

    async import(data: KeysmeExport, options?: { merge?: boolean }): Promise<void> {
      if (!options?.merge) {
        await storage.set(KEYS.providers, data.providers)
        await storage.set(KEYS.presets, data.presets)
        if (data.active) {
          await storage.set(KEYS.active, data.active)
        } else {
          await storage.remove(KEYS.active)
        }
        loadProviders(data.providers)
        loadPresets(data.presets)
        loadActive(data.active)
      } else {
        const currentProviders = providersSlice.getSnapshot()
        const mergedProviders = [...currentProviders]
        for (const p of data.providers) {
          const idx = mergedProviders.findIndex((x) => x.id === p.id)
          if (idx >= 0) mergedProviders[idx] = p
          else mergedProviders.push(p)
        }

        const currentPresets = presetsSlice.getSnapshot()
        const mergedPresets = [...currentPresets]
        for (const p of data.presets) {
          const idx = mergedPresets.findIndex((x) => x.id === p.id)
          if (idx >= 0) mergedPresets[idx] = p
          else mergedPresets.push(p)
        }

        await storage.set(KEYS.providers, mergedProviders)
        await storage.set(KEYS.presets, mergedPresets)
        loadProviders(mergedProviders)
        loadPresets(mergedPresets)

        if (data.active) {
          await storage.set(KEYS.active, data.active)
          loadActive(data.active)
        }
      }
    },
  }

  return store
}

export type KeysmeStore = ReturnType<typeof createKeysmeStore>
