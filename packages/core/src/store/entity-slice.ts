import type { StorageAdapter } from '../storage/types'

export interface EntitySlice<T extends { id: string }> {
  getSnapshot(): T[]
  subscribe(callback: () => void): () => void
  add(input: Omit<T, 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, patch: Partial<T>): Promise<T>
  remove(id: string): Promise<void>
}

export interface EntitySliceFactory<T extends { id: string }> {
  slice: EntitySlice<T>
  load(items: T[]): void
}

export function createEntitySlice<T extends { id: string; createdAt: number; updatedAt: number }>(
  storage: StorageAdapter,
  storageKey: string,
  options: {
    validateAdd?: (input: Omit<T, 'createdAt' | 'updatedAt'>, existing: T[]) => void
    validateRemove?: (id: string, existing: T[]) => void
    onRemove?: (id: string) => Promise<void>
  } = {},
): EntitySliceFactory<T> {
  let data: T[] = []
  const listeners = new Set<() => void>()

  function notify() {
    for (const cb of listeners) cb()
  }

  async function persist() {
    await storage.set(storageKey, data)
  }

  const slice: EntitySlice<T> = {
    getSnapshot() {
      return data
    },
    subscribe(callback: () => void) {
      listeners.add(callback)
      return () => {
        listeners.delete(callback)
      }
    },
    async add(input) {
      options.validateAdd?.(input, data)
      const now = Date.now()
      const item = { ...input, createdAt: now, updatedAt: now } as T
      data = [...data, item]
      await persist()
      notify()
      return item
    },
    async update(id, patch) {
      const index = data.findIndex((item) => item.id === id)
      const existing = data[index]
      if (index === -1 || !existing) throw new Error(`Entity "${id}" not found`)
      const now = Math.max(Date.now(), existing.createdAt + 1)
      const updated = { ...existing, ...patch, updatedAt: now } as T
      data = [...data.slice(0, index), updated, ...data.slice(index + 1)]
      await persist()
      notify()
      return updated
    },
    async remove(id) {
      options.validateRemove?.(id, data)
      await options.onRemove?.(id)
      data = data.filter((item) => item.id !== id)
      await persist()
      notify()
    },
  }

  return {
    slice,
    load(items: T[]) {
      data = items
      notify()
    },
  }
}
