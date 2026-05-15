import type { ResolvedConfig } from '../types'
import { inferBaseURL } from '../utils/infer-base-url'

export function toClientConfig(config: ResolvedConfig) {
  return {
    baseURL: inferBaseURL(config.baseURL),
    apiKey: config.apiKey ?? '',
    headers: config.headers,
  }
}
