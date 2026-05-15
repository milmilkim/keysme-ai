import type { GenerationParams, ProviderProtocol } from './types'

export interface ProtocolSpec {
  /** Auth headers for this wire format. */
  authHeaders(apiKey: string): Record<string, string>
  /** Extract model ids from the GET /models response body. */
  parseModels(json: unknown): string[]
  /**
   * Map canonical GenerationParams to this wire format's request params.
   * Spread the result into the request body / SDK call:
   *
   *   openai:    client.chat.completions.create({ model, messages, ...params })
   *   anthropic: anthropic.messages.create({ model, messages, ...params })
   *   gemini:    ai.models.generateContent({ model, contents, config: params })
   *
   * Only STABLE renames are mapped (e.g. gemini top_p→topP, max_tokens→maxOutputTokens;
   * anthropic stop→stop_sequences). Params a format doesn't support are dropped;
   * use validateParams + ModelCapabilities to surface those in the UI.
   *
   * Volatile provider-specific settings (reasoning/thinking config and other
   * fast-changing knobs) are deliberately NOT mapped, because provider APIs change these
   * too often to hardcode. Pass them via params.extraBody, which is spread into
   * the result verbatim. As of 2026, for example:
   *   openai:    reasoning_effort is a plain param and is already passed through
   *   anthropic: extraBody: { output_config: { effort: 'low'|'medium'|'high'|'xhigh'|'max' } }
   *   gemini:    extraBody: { thinkingConfig: { thinkingLevel: 'low'|'high' } }
   * Check the provider's current docs before relying on these shapes.
   */
  toRequestParams(params: GenerationParams): Record<string, unknown>
}

function clean(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

function toStopArray(stop: string | string[] | undefined): string[] | undefined {
  if (stop === undefined) return undefined
  return Array.isArray(stop) ? stop : [stop]
}

export const PROTOCOLS: Record<ProviderProtocol, ProtocolSpec> = {
  openai: {
    authHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
    parseModels: (json) =>
      ((json as { data?: { id: string }[] }).data ?? []).map((m) => m.id),
    toRequestParams: ({ extraBody, ...params }) => clean({ ...params, ...extraBody }),
  },
  anthropic: {
    authHeaders: (apiKey) => ({ 'x-api-key': apiKey }),
    parseModels: (json) =>
      ((json as { data?: { id: string }[] }).data ?? []).map((m) => m.id),
    toRequestParams: (p) =>
      clean({
        temperature: p.temperature,
        top_p: p.top_p,
        top_k: p.top_k,
        max_tokens: p.max_tokens ?? p.max_completion_tokens,
        stop_sequences: toStopArray(p.stop),
        ...p.extraBody,
      }),
  },
  gemini: {
    authHeaders: (apiKey) => ({ 'x-goog-api-key': apiKey }),
    parseModels: (json) =>
      ((json as { models?: { name: string }[] }).models ?? []).map((m) =>
        m.name.replace(/^models\//, ''),
      ),
    toRequestParams: (p) =>
      clean({
        temperature: p.temperature,
        topP: p.top_p,
        topK: p.top_k,
        maxOutputTokens: p.max_tokens ?? p.max_completion_tokens,
        presencePenalty: p.presence_penalty,
        frequencyPenalty: p.frequency_penalty,
        seed: p.seed,
        stopSequences: toStopArray(p.stop),
        ...p.extraBody,
      }),
  },
}

export function getProtocol(protocol?: ProviderProtocol): ProtocolSpec {
  return PROTOCOLS[protocol ?? 'openai']
}
