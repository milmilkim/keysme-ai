import type { ModelCapabilities } from '@keysme-ai/core'
import { useContext, useMemo } from 'react'
import { KeysmeContext } from '../context'

export function useModelCapabilities(model: string | undefined | null): ModelCapabilities | null {
  const store = useContext(KeysmeContext)
  if (!store) throw new Error('useModelCapabilities must be used within KeysmeProvider')

  return useMemo(() => (model ? store.getModelCapabilities(model) : null), [store, model])
}
