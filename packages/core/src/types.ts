export type ProviderProtocol = 'openai' | 'anthropic' | 'gemini'

export interface Provider {
  id: string
  name: string
  baseURL: string
  /** API wire format. Defaults to 'openai' (OpenAI-compatible). */
  protocol?: ProviderProtocol
  apiKey?: string
  headers?: Record<string, string>
  proxyBaseURL?: string
  createdAt: number
  updatedAt: number
}

export interface GenerationParams {
  temperature?: number
  top_p?: number
  top_k?: number
  max_tokens?: number
  max_completion_tokens?: number
  reasoning_effort?: string
  verbosity?: string
  presence_penalty?: number
  frequency_penalty?: number
  seed?: number
  stop?: string | string[]
  extraBody?: Record<string, unknown>
}

export type ParamKey = keyof GenerationParams

export interface ModelCapabilities {
  supports?: ParamKey[]
  excludes?: ParamKey[]
  ranges?: Partial<Record<ParamKey, [number, number]>>
}

export type ModelCapabilitiesRegistry = Record<string, ModelCapabilities>

export interface Preset {
  id: string
  name: string
  providerId: string
  model: string
  params?: GenerationParams
  createdAt: number
  updatedAt: number
}

export interface ActiveSelection {
  presetId: string
}

export interface ResolvedConfig {
  baseURL: string
  protocol: ProviderProtocol
  apiKey?: string
  model: string
  params: GenerationParams
  headers?: Record<string, string>
}

export interface KeysmeExport {
  version: number
  providers: Provider[]
  presets: Preset[]
  active: ActiveSelection | null
}
