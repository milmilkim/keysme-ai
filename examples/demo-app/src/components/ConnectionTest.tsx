import { useState } from 'react'
import { inferBaseURL, joinUrl } from '@keysme-ai/core/utils'
import { getProtocol, type Provider } from '@keysme-ai/core'
import { useProxyMode } from '@keysme-ai/react'

interface ConnectionTestProps {
  provider: Provider
}

type TestStatus = 'idle' | 'loading' | 'ok' | 'error'

const STATUS_CLASS: Record<TestStatus, string> = {
  idle: '',
  loading: 'status-loading',
  ok: 'status-ok',
  error: 'status-error',
}

export function ConnectionTest({ provider }: ConnectionTestProps) {
  const { useProxy } = useProxyMode()
  const [status, setStatus] = useState<TestStatus>('idle')
  const [detail, setDetail] = useState('')

  const handleTest = async () => {
    setStatus('loading')
    setDetail('')

    const baseURL = useProxy && provider.proxyBaseURL ? provider.proxyBaseURL : provider.baseURL
    const url = joinUrl(inferBaseURL(baseURL), 'models')
    const protocol = getProtocol(provider.protocol)
    const headers: Record<string, string> = { ...provider.headers }
    if (provider.apiKey) Object.assign(headers, protocol.authHeaders(provider.apiKey))

    try {
      const res = await fetch(url, { headers })
      if (res.ok) {
        const count = protocol.parseModels(await res.json()).length
        setStatus('ok')
        setDetail(`${res.status} OK — ${count} models`)
      } else {
        setStatus('error')
        setDetail(`${res.status} ${res.statusText}`)
      }
    } catch (e) {
      setStatus('error')
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setDetail(msg === 'Failed to fetch' ? `${msg} (possible CORS issue)` : msg)
    }
  }

  return (
    <span>
      <button className="sm" onClick={handleTest} disabled={status === 'loading'}>
        {status === 'loading' ? 'Testing...' : 'Test'}
      </button>
      {status !== 'idle' && (
        <span className={`test-status ${STATUS_CLASS[status]}`}>{detail}</span>
      )}
    </span>
  )
}
