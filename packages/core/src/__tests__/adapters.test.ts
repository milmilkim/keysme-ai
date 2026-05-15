import { describe, expect, it } from 'vitest'
import { toClientConfig } from '../adapters'
import type { ResolvedConfig } from '../types'

const config: ResolvedConfig = {
  baseURL: 'https://api.openai.com/v1',
  protocol: 'openai',
  apiKey: 'sk-test',
  model: 'gpt-4.1',
  params: { temperature: 0.7, max_tokens: 1000 },
  headers: { 'X-Custom': 'value' },
}

describe('toClientConfig', () => {
  it('returns baseURL with inferred base', () => {
    const result = toClientConfig(config)
    expect(result.baseURL).toBe('https://api.openai.com/v1')
  })

  it('strips known suffixes from baseURL', () => {
    const cfg = { ...config, baseURL: 'https://api.openai.com/v1/chat/completions' }
    const result = toClientConfig(cfg)
    expect(result.baseURL).toBe('https://api.openai.com/v1')
  })

  it('returns apiKey', () => {
    const result = toClientConfig(config)
    expect(result.apiKey).toBe('sk-test')
  })

  it('defaults apiKey to empty string', () => {
    const cfg = { ...config, apiKey: undefined }
    const result = toClientConfig(cfg)
    expect(result.apiKey).toBe('')
  })

  it('returns headers', () => {
    const result = toClientConfig(config)
    expect(result.headers?.['X-Custom']).toBe('value')
  })
})
