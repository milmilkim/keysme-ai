import type { StorageAdapter } from './types'

export function memoryAdapter(): StorageAdapter {
  const store = new Map<string, unknown>()
  return {
    async get<T>(key: string): Promise<T | null> {
      const value = store.get(key)
      return value !== undefined ? (value as T) : null
    },
    async set<T>(key: string, value: T): Promise<void> {
      store.set(key, value)
    },
    async remove(key: string): Promise<void> {
      store.delete(key)
    },
  }
}
