import type { Provider } from '@keysme-ai/core'
import { useCallback, useContext, useSyncExternalStore } from 'react'
import { KeysmeContext } from '../context'

export function useProviders() {
  const store = useContext(KeysmeContext)
  if (!store) throw new Error('useProviders must be used within KeysmeProvider')

  const providers = useSyncExternalStore(store.providers.subscribe, store.providers.getSnapshot)

  const addProvider = useCallback(
    (input: Omit<Provider, 'createdAt' | 'updatedAt'>) => store.providers.add(input),
    [store],
  )
  const updateProvider = useCallback(
    (id: string, patch: Partial<Provider>) => store.providers.update(id, patch),
    [store],
  )
  const removeProvider = useCallback((id: string) => store.providers.remove(id), [store])

  return { providers, addProvider, updateProvider, removeProvider }
}
