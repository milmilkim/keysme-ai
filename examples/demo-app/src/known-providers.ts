import type { ProviderProtocol } from '@keysme-ai/core'

export interface KnownProvider {
  name: string
  baseURL: string
  protocol?: ProviderProtocol
  headers?: Record<string, string>
}

export const KNOWN_PROVIDERS: KnownProvider[] = [
  { name: 'OpenAI', baseURL: 'https://api.openai.com/v1' },
  {
    name: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    protocol: 'anthropic',
    headers: { 'anthropic-version': '2023-06-01' },
  },
  {
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    protocol: 'gemini',
  },
  { name: 'Groq', baseURL: 'https://api.groq.com/openai/v1' },
  { name: 'Mistral', baseURL: 'https://api.mistral.ai/v1' },
  { name: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1' },
  { name: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1' },
  { name: 'Together AI', baseURL: 'https://api.together.xyz/v1' },
  { name: 'Fireworks AI', baseURL: 'https://api.fireworks.ai/inference/v1' },
  { name: 'Ollama Cloud', baseURL: 'https://ollama.com/v1' },
]
