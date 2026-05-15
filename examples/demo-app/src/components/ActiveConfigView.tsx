import { usePresetConfig, useModelCapabilities, useProxyMode } from '@keysme-ai/react'
import { toClientConfig } from '@keysme-ai/core/adapters'
import { getProtocol, validateParams } from '@keysme-ai/core'

interface ActiveConfigViewProps {
  presetId: string
}

export function ActiveConfigView({ presetId }: ActiveConfigViewProps) {
  const { config } = usePresetConfig(presetId)
  const caps = useModelCapabilities(config?.model)
  const { useProxy } = useProxyMode()
  if (!config) return null

  const issues = validateParams(config.params, caps)

  return (
    <section>
      <h2>Active Config</h2>

      {useProxy && (
        <p className="hint">Proxy mode ON — baseURL reflects Provider.proxyBaseURL where set.</p>
      )}

      {issues.length > 0 && (
        <ul className="issue-list">
          {issues.map((issue) => (
            <li key={issue.param} className="status-error">
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      <h3>ResolvedConfig</h3>
      <CodeBlock>{JSON.stringify(config, null, 2)}</CodeBlock>

      <h3>toClientConfig()</h3>
      <CodeBlock>{JSON.stringify(toClientConfig(config), null, 2)}</CodeBlock>

      <h3>toRequestParams() — {config.protocol} wire format</h3>
      <CodeBlock>
        {JSON.stringify(getProtocol(config.protocol).toRequestParams(config.params), null, 2)}
      </CodeBlock>

      <h3>Usage ({config.protocol})</h3>
      <CodeBlock>{USAGE_EXAMPLES[config.protocol]}</CodeBlock>
    </section>
  )
}

function CodeBlock({ children }: { children: string }) {
  return <pre className="code">{children}</pre>
}

const USAGE_EXAMPLES = {
  openai: `// With OpenAI SDK (or any compatible client)
import OpenAI from 'openai'
import { getProtocol } from '@keysme-ai/core'

const client = new OpenAI(toClientConfig(config))
const params = getProtocol(config.protocol).toRequestParams(config.params)
await client.chat.completions.create({
  model: config.model,
  messages,
  ...params,
})`,

  anthropic: `// With Anthropic SDK (native /messages format)
import Anthropic from '@anthropic-ai/sdk'
import { getProtocol } from '@keysme-ai/core'

const anthropic = new Anthropic({
  apiKey: config.apiKey,
  baseURL: config.baseURL,
  defaultHeaders: config.headers,
})
// max_tokens is required by Anthropic — set it in the preset params
const params = getProtocol(config.protocol).toRequestParams(config.params)
await anthropic.messages.create({
  model: config.model,
  messages,
  ...params,
})`,

  gemini: `// With Google Gen AI SDK (native generateContent format)
import { GoogleGenAI } from '@google/genai'
import { getProtocol } from '@keysme-ai/core'

const ai = new GoogleGenAI({ apiKey: config.apiKey })
const params = getProtocol(config.protocol).toRequestParams(config.params)
await ai.models.generateContent({
  model: config.model,
  contents,
  config: params, // generationConfig: temperature, topP, maxOutputTokens...
})`,
} as const
