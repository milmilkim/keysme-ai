import type { ActiveSelection } from '@keysme-ai/core'
import { useCallback, useContext, useSyncExternalStore } from 'react'
import { KeysmeContext } from '../context'

export function useActiveSelection() {
  const store = useContext(KeysmeContext)
  if (!store) throw new Error('useActiveSelection must be used within KeysmeProvider')

  const active = useSyncExternalStore(store.active.subscribe, store.active.getSnapshot)

  const setActive = useCallback(
    (selection: ActiveSelection | null) => store.active.set(selection),
    [store],
  )

  return { active, setActive }
}
