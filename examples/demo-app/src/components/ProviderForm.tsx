import { useState } from 'react'
import type { ProviderProtocol } from '@keysme-ai/core'
import { useProviders } from '@keysme-ai/react'
import { KNOWN_PROVIDERS, type KnownProvider } from '../known-providers'

interface Draft {
  name: string
  baseURL: string
  protocol: ProviderProtocol
  apiKey: string
  proxyBaseURL: string
  headers?: Record<string, string>
}

const EMPTY: Draft = { name: '', baseURL: '', protocol: 'openai', apiKey: '', proxyBaseURL: '' }

const PROTOCOL_OPTIONS: ProviderProtocol[] = ['openai', 'anthropic', 'gemini']

export function ProviderForm() {
  const { addProvider } = useProviders()
  const [draft, setDraft] = useState<Draft>(EMPTY)

  const handleQuickAdd = (provider: KnownProvider) => {
    setDraft({
      name: provider.name,
      baseURL: provider.baseURL,
      protocol: provider.protocol ?? 'openai',
      apiKey: '',
      proxyBaseURL: '',
      headers: provider.headers,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.name || !draft.baseURL) return
    await addProvider({
      id: crypto.randomUUID(),
      name: draft.name,
      baseURL: draft.baseURL,
      protocol: draft.protocol,
      apiKey: draft.apiKey || undefined,
      proxyBaseURL: draft.proxyBaseURL || undefined,
      headers: draft.headers,
    })
    setDraft(EMPTY)
  }

  return (
    <div>
      <div className="quick-add">
        {KNOWN_PROVIDERS.map((p) => (
          <button key={p.name} className="sm" type="button" onClick={() => handleQuickAdd(p)}>
            {p.name}
          </button>
        ))}
        <button className="sm" type="button" onClick={() => setDraft(EMPTY)}>
          Custom
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            className="input-name"
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            className="input-url"
            placeholder="Base URL"
            value={draft.baseURL}
            onChange={(e) => setDraft({ ...draft, baseURL: e.target.value })}
          />
          <select
            value={draft.protocol}
            onChange={(e) => setDraft({ ...draft, protocol: e.target.value as ProviderProtocol })}
            title="API wire format"
          >
            {PROTOCOL_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            className="input-key"
            placeholder="API Key"
            type="password"
            value={draft.apiKey}
            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
          />
          <button className="primary" type="submit">Add</button>
        </div>
        <div className="form-row">
          <input
            className="input-url"
            placeholder="Proxy Base URL (optional, e.g. https://my-proxy.com/openai/v1)"
            value={draft.proxyBaseURL}
            onChange={(e) => setDraft({ ...draft, proxyBaseURL: e.target.value })}
          />
        </div>
      </form>
      {draft.headers && (
        <p className="hint">+ headers: {Object.keys(draft.headers).join(', ')}</p>
      )}
    </div>
  )
}
