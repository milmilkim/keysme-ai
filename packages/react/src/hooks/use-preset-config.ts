import { useContext, useSyncExternalStore } from 'react'
import { KeysmeContext } from '../context'

export function usePresetConfig(presetId: string) {
  const store = useContext(KeysmeContext)
  if (!store) throw new Error('usePresetConfig must be used within KeysmeProvider')

  // subscribe to both so we re-render when either changes
  useSyncExternalStore(store.providers.subscribe, store.providers.getSnapshot)
  useSyncExternalStore(store.presets.subscribe, store.presets.getSnapshot)

  const config = store.resolveConfig(presetId)

  return { config }
}
