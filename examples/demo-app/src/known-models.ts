import type { ModelCapabilitiesRegistry } from '@keysme-ai/core'

export const KNOWN_MODELS: ModelCapabilitiesRegistry = {
  'gpt-5': {
    supports: [
      'temperature',
      'top_p',
      'max_completion_tokens',
      'reasoning_effort',
      'verbosity',
      'seed',
    ],
    ranges: { temperature: [0, 2], top_p: [0, 1] },
    excludes: ['max_tokens'],
  },
  'gpt-4o': {
    supports: [
      'temperature',
      'top_p',
      'max_completion_tokens',
      'presence_penalty',
      'frequency_penalty',
      'seed',
    ],
    ranges: { temperature: [0, 2], top_p: [0, 1] },
  },
  'claude-opus-4': {
    supports: ['temperature', 'top_p', 'top_k', 'max_tokens', 'stop'],
    ranges: { temperature: [0, 1], top_p: [0, 1] },
    excludes: ['max_completion_tokens', 'reasoning_effort', 'verbosity'],
  },
  'gemini-2.0-flash': {
    supports: ['temperature', 'top_p', 'top_k', 'max_tokens', 'stop'],
    ranges: { temperature: [0, 2], top_p: [0, 1] },
  },
}
