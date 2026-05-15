import type { Preset } from '@keysme-ai/core'
import { useCallback, useContext, useSyncExternalStore } from 'react'
import { KeysmeContext } from '../context'

export function usePresets() {
  const store = useContext(KeysmeContext)
  if (!store) throw new Error('usePresets must be used within KeysmeProvider')

  const presets = useSyncExternalStore(store.presets.subscribe, store.presets.getSnapshot)

  const addPreset = useCallback(
    (input: Omit<Preset, 'createdAt' | 'updatedAt'>) => store.presets.add(input),
    [store],
  )
  const updatePreset = useCallback(
    (id: string, patch: Partial<Preset>) => store.presets.update(id, patch),
    [store],
  )
  const removePreset = useCallback((id: string) => store.presets.remove(id), [store])

  return { presets, addPreset, updatePreset, removePreset }
}
