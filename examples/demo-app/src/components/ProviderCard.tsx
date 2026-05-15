import { maskSecret } from '@keysme-ai/core/utils'
import type { Provider } from '@keysme-ai/core'
import { useProxyMode } from '@keysme-ai/react'
import { ConnectionTest } from './ConnectionTest'

interface ProviderCardProps {
  provider: Provider
  onRemove: () => void
}

export function ProviderCard({ provider, onRemove }: ProviderCardProps) {
  const { useProxy } = useProxyMode()
  const proxyActive = useProxy && !!provider.proxyBaseURL

  return (
    <div className="card">
      <span className="card-name">{provider.name}</span>
      <span className="card-detail">{provider.protocol ?? 'openai'}</span>
      <span className="card-url">{provider.baseURL}</span>
      {provider.apiKey && <span className="card-detail">{maskSecret(provider.apiKey)}</span>}
      {provider.headers && (
        <span className="card-detail">+ {Object.keys(provider.headers).join(', ')}</span>
      )}
      {provider.proxyBaseURL && (
        <span className={proxyActive ? 'card-detail status-ok' : 'card-detail'}>
          {proxyActive ? '↻ via proxy' : '↻ proxy ready'}
        </span>
      )}
      <ConnectionTest provider={provider} />
      <button className="sm delete" onClick={onRemove}>Delete</button>
    </div>
  )
}
