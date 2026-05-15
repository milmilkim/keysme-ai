import { useCallback, useContext, useState } from 'react'
import { KeysmeContext } from '../context'

export function useModels(providerId: string) {
  const store = useContext(KeysmeContext)
  if (!store) throw new Error('useModels must be used within KeysmeProvider')

  const [models, setModels] = useState<string[]>(store.models.getCached(providerId) ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await store.models.fetch(providerId)
      setModels(result)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setIsLoading(false)
    }
  }, [store, providerId])

  return { models, isLoading, error, refetch }
}
