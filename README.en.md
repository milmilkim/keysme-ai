# keysme-ai

[한국어](./README.md) | **English**

**v0.1.1** · MIT

BYOK (Bring Your Own Key) LLM settings registry + headless React hooks.

keysme manages your users' LLM configuration: providers (endpoint + API key), presets (model + generation params), and encrypted migration between apps. It never makes LLM calls. Your app stays in full control of how requests are sent.

## Why

Every BYOK app rebuilds the same things: a key settings screen, a model picker, param validation, and a way to carry keys to the next app. keysme is that layer, done once.

- **One setup, every app.** A user who configured keys in one keysme-powered app can move the whole setup to another with a single encrypted token.
- **No call abstraction.** `config.protocol` tells your app which SDK or wire format to use. The calls are yours.
- **No hidden defaults.** `model` and `baseURL` are always required. keysme never silently picks a model for you.

## Install

```bash
pnpm add @keysme-ai/core @keysme-ai/react
```

## Quick start

```tsx
import { createKeysmeStore, localStorageAdapter, setKeysmeLocale } from '@keysme-ai/core'
import { KeysmeProvider, usePresetConfig } from '@keysme-ai/react'

setKeysmeLocale('en') // error message language, 'en' is the default

const store = createKeysmeStore({ storage: localStorageAdapter() })

function App() {
  return (
    <KeysmeProvider store={store}>
      <Settings />
      <Chat />
    </KeysmeProvider>
  )
}

function Chat() {
  const { config } = usePresetConfig('main')
  // config: { baseURL, apiKey, protocol, model, params, headers }
}
```

## Making the call

keysme never calls an LLM. `config.protocol` (`'openai' | 'anthropic' | 'gemini'`) tells your app which SDK or wire format to use, and `getProtocol()` handles the protocol-specific plumbing:

```ts
import { getProtocol } from '@keysme-ai/core'
import { toClientConfig } from '@keysme-ai/core/adapters'

const client = new OpenAI(toClientConfig(config)) // { baseURL, apiKey, headers }
const params = getProtocol(config.protocol).toRequestParams(config.params)
await client.chat.completions.create({ model: config.model, messages, ...params })
```

`toRequestParams` maps only stable renames (for example `top_p` to `topP` on Gemini). Fast-changing provider settings such as reasoning and thinking config go through `params.extraBody`, which is passed through verbatim. See the JSDoc on `getProtocol` for current recommendations.

## Moving keys between apps

The core idea: set up keys once, carry them to every keysme-powered app.

```ts
import { encryptExport, decryptExport } from '@keysme-ai/core'

// app A: lock the whole config with a user-chosen passphrase
const token = await encryptExport(await store.export({ includeSecrets: true }), passphrase)
// yields a single "keysme1.…" string

// app B: the same passphrase unlocks it
await store.import(await decryptExport(token, passphrase), { merge: true })
```

Tokens are AES-256-GCM encrypted with a PBKDF2-derived key. A wrong passphrase or a tampered token fails cleanly with `KeysmeError('DECRYPT_FAILED')`.

## API reference

### @keysme-ai/core

#### Store

| API | Description |
|---|---|
| `createKeysmeStore(options)` | Create a store. `options.storage: StorageAdapter` required, `options.modelCapabilities?: ModelCapabilitiesRegistry` optional |
| `store.init()` | Load state from storage (async) |
| `store.isInitialized` | Whether init has completed |
| `store.providers` | `EntitySlice<Provider>`: `getSnapshot()` / `subscribe(cb)` / `add(input)` / `update(id, patch)` / `remove(id)` |
| `store.presets` | `EntitySlice<Preset>`: same CRUD as above |
| `store.active` | `getSnapshot()` / `subscribe(cb)` / `set(selection \| null)` |
| `store.proxy` | `get()` / `set(bool)` / `subscribe(cb)`: proxy mode toggle |
| `store.models.fetch(providerId)` | Call the provider's GET /models, returns model ids |
| `store.models.getCached(providerId)` | Cached model list |
| `store.resolveConfig(presetId)` | `ResolvedConfig \| null`. Uses proxyBaseURL when proxy mode is on |
| `store.getModelCapabilities(model)` | Look up the injected registry |
| `store.export(options?)` | Returns `KeysmeExport`. `{ includeSecrets?: boolean }` |
| `store.import(data, options?)` | `{ merge?: boolean }`. merge: true upserts by id, default replaces everything |

#### Encrypted export

| API | Description |
|---|---|
| `encryptExport(data, passphrase)` | Encrypt a `KeysmeExport` into a `keysme1.` token string (async) |
| `decryptExport(token, passphrase)` | Decrypt a token back into `KeysmeExport` (async). Throws `KeysmeError` on failure |
| `isExportToken(text)` | Whether a string is an encrypted token |

#### Protocols

| API | Description |
|---|---|
| `getProtocol(protocol?)` | Returns a `ProtocolSpec`. Defaults to openai |
| `spec.authHeaders(apiKey)` | Auth headers for the wire format |
| `spec.parseModels(json)` | Extract model ids from a GET /models response |
| `spec.toRequestParams(params)` | Stable param renames. `extraBody` passes through verbatim |
| `PROTOCOLS` | The spec table (`openai` / `anthropic` / `gemini`) |

#### Validation and capabilities

| API | Description |
|---|---|
| `getModelCapabilities(model, registry?)` | Look up a model's capabilities |
| `validateParams(params, capabilities)` | Returns `ValidationIssue[]` (`unsupported` / `excluded` / `out_of_range`) |

#### Errors and locale

| API | Description |
|---|---|
| `KeysmeError` | Every error carries `code: KeysmeErrorCode` |
| `setKeysmeLocale(locale)` | Global message language (`'en' \| 'ko'`, default en). Call once at startup |
| `getErrorMessage(code, locale?)` | Message for a code. Falls back to the global locale |
| `KEYSME_ERROR_MESSAGES` | The full en/ko message table |

Error codes: `MODEL_REQUIRED`, `BASE_URL_REQUIRED`, `DUPLICATE_ID`, `PROVIDER_NOT_FOUND`, `PRESET_NOT_FOUND`, `PROVIDER_IN_USE`, `INVALID_PROVIDER_ID`, `STORAGE_ERROR`, `MODEL_FETCH_FAILED`, `INVALID_EXPORT_TOKEN`, `DECRYPT_FAILED`

#### Storage

| API | Description |
|---|---|
| `localStorageAdapter()` | Browser localStorage |
| `memoryAdapter()` | In-memory (tests/SSR) |
| `StorageAdapter` | Custom adapter contract: `get(key)` / `set(key, value)` / `remove(key)` (all async) |

#### Subpaths

| API | Description |
|---|---|
| `@keysme-ai/core/adapters` → `toClientConfig(config)` | Extract `{ baseURL, apiKey, headers }` for SDK constructors |
| `@keysme-ai/core/utils` → `maskSecret(secret)` | Display masking (`sk-...123`) |
| `@keysme-ai/core/utils` → `inferBaseURL(url)` | Strip known suffixes such as `/chat/completions` |
| `@keysme-ai/core/utils` → `joinUrl(base, path)` | Join URLs without duplicate slashes |
| `@keysme-ai/core/utils` → `validateBaseURL(url)` | Validate base URL shape |

#### Key types

`Provider`, `Preset`, `ActiveSelection`, `ResolvedConfig`, `GenerationParams`, `ParamKey`, `ProviderProtocol`, `ModelCapabilities`, `ModelCapabilitiesRegistry`, `KeysmeExport`, `KeysmeStore`, `KeysmeStoreOptions`, `KeysmeErrorCode`, `KeysmeLocale`, `ValidationIssue`, `ProtocolSpec`, `EntitySlice`, `ActiveSlice`

### @keysme-ai/react

| API | Returns |
|---|---|
| `<KeysmeProvider store={store}>` | Provides the store via context, calls `init()` |
| `useProviders()` | `{ providers, addProvider, updateProvider, removeProvider }` |
| `usePresets()` | `{ presets, addPreset, updatePreset, removePreset }` |
| `useActiveSelection()` | `{ active, setActive }` |
| `usePresetConfig(presetId)` | `{ config: ResolvedConfig \| null }` |
| `useActiveConfig()` | `{ config: ResolvedConfig \| null }` (for the active preset) |
| `useModels(providerId)` | `{ models, isLoading, error, refetch }` |
| `useModelCapabilities(model)` | `ModelCapabilities \| null` |
| `useProxyMode()` | `{ useProxy, setUseProxy }` |
| `KeysmeContext` | The store context (for building custom hooks) |

All hooks subscribe to only the slice they need, via `useSyncExternalStore`.

## AI-assisted development

The exported types and JSDoc are the spec. AI coding tools pick them up from `.d.ts` automatically, so "use keysme for the settings screen" is usually enough context.

## Packages

| Package | Version | Description |
|---|---|---|
| `@keysme-ai/core` | 0.1.1 | Store, types, protocols, encrypted export, storage adapters |
| `@keysme-ai/react` | 0.1.1 | Headless React hooks (useSyncExternalStore-based) |

## License

MIT
