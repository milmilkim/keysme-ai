import type { KeysmeStore } from '@keysme-ai/core'
import { type ReactNode, useEffect, useState } from 'react'
import { KeysmeContext } from './context'

interface KeysmeProviderProps {
  store: KeysmeStore
  children: ReactNode
}

export function KeysmeProvider({ store, children }: KeysmeProviderProps) {
  const [ready, setReady] = useState(() => store.isInitialized)

  useEffect(() => {
    if (store.isInitialized) {
      setReady(true)
      return
    }
    store.init().then(() => setReady(true))
  }, [store])

  if (!ready) return null

  return <KeysmeContext.Provider value={store}>{children}</KeysmeContext.Provider>
}
