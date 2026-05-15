import type { StorageAdapter } from '../storage/types'
import type { ActiveSelection } from '../types'

export interface ActiveSlice {
  getSnapshot(): ActiveSelection | null
  subscribe(callback: () => void): () => void
  set(selection: ActiveSelection | null): Promise<void>
}

export interface ActiveSliceFactory {
  slice: ActiveSlice
  load(value: ActiveSelection | null): void
}

export function createActiveSlice(storage: StorageAdapter, storageKey: string): ActiveSliceFactory {
  let current: ActiveSelection | null = null
  const listeners = new Set<() => void>()

  function notify() {
    for (const cb of listeners) cb()
  }

  const slice: ActiveSlice = {
    getSnapshot() {
      return current
    },
    subscribe(callback) {
      listeners.add(callback)
      return () => {
        listeners.delete(callback)
      }
    },
    async set(selection) {
      current = selection
      if (selection) {
        await storage.set(storageKey, selection)
      } else {
        await storage.remove(storageKey)
      }
      notify()
    },
  }

  return {
    slice,
    load(value) {
      current = value
      notify()
    },
  }
}
