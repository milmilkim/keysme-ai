import { useCallback, useContext, useSyncExternalStore } from 'react'
import { KeysmeContext } from '../context'

export function useProxyMode() {
  const store = useContext(KeysmeContext)
  if (!store) throw new Error('useProxyMode must be used within KeysmeProvider')

  const useProxy = useSyncExternalStore(store.proxy.subscribe, store.proxy.get)
  const setUseProxy = useCallback((value: boolean) => store.proxy.set(value), [store])

  return { useProxy, setUseProxy }
}
