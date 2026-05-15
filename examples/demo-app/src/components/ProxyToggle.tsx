import { useProxyMode } from '@keysme-ai/react'

export function ProxyToggle() {
  const { useProxy, setUseProxy } = useProxyMode()
  return (
    <label className="proxy-toggle">
      <input
        type="checkbox"
        checked={useProxy}
        onChange={(e) => setUseProxy(e.target.checked)}
      />
      Use proxy (route requests through Provider.proxyBaseURL when set)
    </label>
  )
}
