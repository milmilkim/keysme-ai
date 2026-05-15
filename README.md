# keysme-ai

**한국어** | [English](./README.en.md)

**v0.1.0** · MIT

BYOK (Bring Your Own Key) LLM 설정 registry + headless React 훅.

keysme는 유저의 LLM 설정을 관리합니다: 프로바이더(엔드포인트 + API 키), 프리셋(모델 + 생성 파라미터), 그리고 앱 간 암호화 이동까지. LLM 호출은 하지 않습니다. 요청을 어떻게 보낼지는 온전히 앱의 몫입니다.

## 왜 필요한가

BYOK 앱을 만들 때마다 같은 것을 다시 만듭니다: 키 설정 화면, 모델 선택, 파라미터 검증, 그리고 다음 앱으로 키를 옮기는 방법. keysme는 그 레이어를 한 번만 만들어 둔 것입니다.

- **한 번 설정, 모든 앱에서.** keysme 기반 앱에서 키를 설정한 유저는 암호화 토큰 하나로 다른 앱에 설정 전체를 옮길 수 있습니다.
- **호출 추상화 없음.** `config.protocol`이 어떤 SDK나 wire format을 쓸지 알려줄 뿐, 호출은 앱이 합니다.
- **숨은 기본값 없음.** `model`과 `baseURL`은 항상 필수입니다. keysme가 몰래 모델을 골라주는 일은 없습니다.

## 설치

```bash
pnpm add @keysme-ai/core @keysme-ai/react
```

## 빠른 시작

```tsx
import { createKeysmeStore, localStorageAdapter, setKeysmeLocale } from '@keysme-ai/core'
import { KeysmeProvider, usePresetConfig } from '@keysme-ai/react'

setKeysmeLocale('ko') // 에러 메시지 언어. 생략하면 'en'

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

## 호출하기

keysme는 LLM을 호출하지 않습니다. `config.protocol`(`'openai' | 'anthropic' | 'gemini'`)이 어떤 SDK나 wire format을 쓸지 알려주고, `getProtocol()`이 프로토콜별 잡일을 처리합니다:

```ts
import { getProtocol } from '@keysme-ai/core'
import { toClientConfig } from '@keysme-ai/core/adapters'

const client = new OpenAI(toClientConfig(config)) // { baseURL, apiKey, headers }
const params = getProtocol(config.protocol).toRequestParams(config.params)
await client.chat.completions.create({ model: config.model, messages, ...params })
```

`toRequestParams`는 안정적인 이름 변환만 담당합니다 (예: Gemini의 `top_p`를 `topP`로). reasoning, thinking 설정처럼 자주 바뀌는 프로바이더 옵션은 `params.extraBody`로 넣으면 그대로 통과됩니다. 현재 권장값은 `getProtocol`의 JSDoc을 참고하세요.

## 앱 간 키 이동

핵심 아이디어: 키는 한 번만 설정하고, keysme 기반 앱 어디로든 들고 다닙니다.

```ts
import { encryptExport, decryptExport } from '@keysme-ai/core'

// 앱 A: 유저가 정한 비밀번호로 설정 전체를 잠급니다
const token = await encryptExport(await store.export({ includeSecrets: true }), passphrase)
// "keysme1.…" 문자열 하나가 나옵니다

// 앱 B: 같은 비밀번호로 풉니다
await store.import(await decryptExport(token, passphrase), { merge: true })
```

토큰은 PBKDF2로 유도한 키를 사용해 AES-256-GCM으로 암호화됩니다. 비밀번호가 틀리거나 토큰이 변조되면 `KeysmeError('DECRYPT_FAILED')`로 깔끔하게 실패합니다.

## API 레퍼런스

### @keysme-ai/core

#### 스토어

| API | 설명 |
|---|---|
| `createKeysmeStore(options)` | 스토어 생성. `options.storage: StorageAdapter` 필수, `options.modelCapabilities?: ModelCapabilitiesRegistry` 선택 |
| `store.init()` | 저장소에서 상태 로드 (async) |
| `store.isInitialized` | 초기화 여부 |
| `store.providers` | `EntitySlice<Provider>`: `getSnapshot()` / `subscribe(cb)` / `add(input)` / `update(id, patch)` / `remove(id)` |
| `store.presets` | `EntitySlice<Preset>`: 위와 동일한 CRUD |
| `store.active` | `getSnapshot()` / `subscribe(cb)` / `set(selection \| null)` |
| `store.proxy` | `get()` / `set(bool)` / `subscribe(cb)`: proxy 모드 토글 |
| `store.models.fetch(providerId)` | 프로바이더의 GET /models 호출, 모델 id 배열 반환 |
| `store.models.getCached(providerId)` | 캐시된 모델 목록 |
| `store.resolveConfig(presetId)` | `ResolvedConfig \| null`. proxy 모드면 proxyBaseURL 사용 |
| `store.getModelCapabilities(model)` | 주입된 레지스트리에서 조회 |
| `store.export(options?)` | `KeysmeExport` 반환. `{ includeSecrets?: boolean }` |
| `store.import(data, options?)` | `{ merge?: boolean }`. merge: true는 id 기준 upsert, 기본은 전체 교체 |

#### Export 암호화

| API | 설명 |
|---|---|
| `encryptExport(data, passphrase)` | `KeysmeExport`를 `keysme1.` 토큰 문자열로 암호화 (async) |
| `decryptExport(token, passphrase)` | 토큰을 복호화해 `KeysmeExport` 반환 (async). 실패 시 `KeysmeError` |
| `isExportToken(text)` | 암호화 토큰인지 판별 |

#### 프로토콜

| API | 설명 |
|---|---|
| `getProtocol(protocol?)` | `ProtocolSpec` 반환. 미지정 시 openai |
| `spec.authHeaders(apiKey)` | 프로토콜별 인증 헤더 |
| `spec.parseModels(json)` | GET /models 응답에서 모델 id 추출 |
| `spec.toRequestParams(params)` | 안정적인 파라미터 이름 변환. `extraBody`는 그대로 통과 |
| `PROTOCOLS` | 프로토콜 스펙 테이블 (`openai` / `anthropic` / `gemini`) |

#### 검증과 capabilities

| API | 설명 |
|---|---|
| `getModelCapabilities(model, registry?)` | 레지스트리에서 모델 capabilities 조회 |
| `validateParams(params, capabilities)` | `ValidationIssue[]` 반환 (`unsupported` / `excluded` / `out_of_range`) |

#### 에러와 언어

| API | 설명 |
|---|---|
| `KeysmeError` | 모든 에러의 클래스. `code: KeysmeErrorCode` 포함 |
| `setKeysmeLocale(locale)` | 에러 메시지 언어 전역 설정 (`'en' \| 'ko'`, 기본 en). 앱 진입점에서 한 번 |
| `getErrorMessage(code, locale?)` | 코드만으로 메시지 조회. locale 생략 시 전역 설정 따름 |
| `KEYSME_ERROR_MESSAGES` | 전체 코드의 en/ko 메시지 테이블 |

에러 코드: `MODEL_REQUIRED`, `BASE_URL_REQUIRED`, `DUPLICATE_ID`, `PROVIDER_NOT_FOUND`, `PRESET_NOT_FOUND`, `PROVIDER_IN_USE`, `INVALID_PROVIDER_ID`, `STORAGE_ERROR`, `MODEL_FETCH_FAILED`, `INVALID_EXPORT_TOKEN`, `DECRYPT_FAILED`

#### 저장소

| API | 설명 |
|---|---|
| `localStorageAdapter()` | 브라우저 localStorage |
| `memoryAdapter()` | 인메모리 (테스트/SSR) |
| `StorageAdapter` | 커스텀 어댑터 규격: `get(key)` / `set(key, value)` / `remove(key)` (모두 async) |

#### 서브패스

| API | 설명 |
|---|---|
| `@keysme-ai/core/adapters` → `toClientConfig(config)` | `{ baseURL, apiKey, headers }`만 추출 (SDK 생성자용) |
| `@keysme-ai/core/utils` → `maskSecret(secret)` | 표시용 마스킹 (`sk-...123`) |
| `@keysme-ai/core/utils` → `inferBaseURL(url)` | 알려진 suffix(`/chat/completions` 등) 제거 |
| `@keysme-ai/core/utils` → `joinUrl(base, path)` | 슬래시 중복 없는 URL 결합 |
| `@keysme-ai/core/utils` → `validateBaseURL(url)` | base URL 형식 검사 |

#### 주요 타입

`Provider`, `Preset`, `ActiveSelection`, `ResolvedConfig`, `GenerationParams`, `ParamKey`, `ProviderProtocol`, `ModelCapabilities`, `ModelCapabilitiesRegistry`, `KeysmeExport`, `KeysmeStore`, `KeysmeStoreOptions`, `KeysmeErrorCode`, `KeysmeLocale`, `ValidationIssue`, `ProtocolSpec`, `EntitySlice`, `ActiveSlice`

### @keysme-ai/react

| API | 반환 |
|---|---|
| `<KeysmeProvider store={store}>` | store를 컨텍스트로 전달. 내부에서 `init()` 호출 |
| `useProviders()` | `{ providers, addProvider, updateProvider, removeProvider }` |
| `usePresets()` | `{ presets, addPreset, updatePreset, removePreset }` |
| `useActiveSelection()` | `{ active, setActive }` |
| `usePresetConfig(presetId)` | `{ config: ResolvedConfig \| null }` |
| `useActiveConfig()` | `{ config: ResolvedConfig \| null }` (활성 프리셋 기준) |
| `useModels(providerId)` | `{ models, isLoading, error, refetch }` |
| `useModelCapabilities(model)` | `ModelCapabilities \| null` |
| `useProxyMode()` | `{ useProxy, setUseProxy }` |
| `KeysmeContext` | store 컨텍스트 (커스텀 훅 제작용) |

모든 훅은 `useSyncExternalStore` 기반으로 필요한 slice만 구독합니다.

## AI 코딩과 함께

export된 타입과 JSDoc이 곧 스펙입니다. AI 코딩 도구는 `.d.ts`에서 이를 자동으로 읽어가므로, "설정 화면은 keysme 써줘" 정도의 지시면 충분합니다.

## 패키지

| 패키지 | 버전 | 설명 |
|---|---|---|
| `@keysme-ai/core` | 0.1.0 | Store, 타입, 프로토콜, 암호화 export, 저장소 어댑터 |
| `@keysme-ai/react` | 0.1.0 | Headless React 훅 (useSyncExternalStore 기반) |

## 라이선스

MIT
