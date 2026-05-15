import type { StorageAdapter } from './types'

export function localStorageAdapter(): StorageAdapter {
  return {
    async get<T>(key: string): Promise<T | null> {
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      try {
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    },
    async set<T>(key: string, value: T): Promise<void> {
      localStorage.setItem(key, JSON.stringify(value))
    },
    async remove(key: string): Promise<void> {
      localStorage.removeItem(key)
    },
    subscribe(key: string, callback: () => void): () => void {
      const handler = (event: StorageEvent) => {
        if (event.key === key) callback()
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    },
  }
}
