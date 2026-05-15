import { KeysmeError } from '../errors'
import type { Preset, Provider } from '../types'

export function validateProviderAdd(
  input: { id: string; baseURL: string },
  existing: Provider[],
): void {
  if (existing.some((p) => p.id === input.id)) {
    throw new KeysmeError('DUPLICATE_ID', `Provider id "${input.id}" already exists`)
  }
  if (!input.baseURL || input.baseURL.trim() === '') {
    throw new KeysmeError('BASE_URL_REQUIRED', 'baseURL is required')
  }
}

export function validatePresetAdd(
  input: { id: string; providerId: string; model: string },
  existingPresets: Preset[],
  existingProviders: Provider[],
): void {
  if (existingPresets.some((p) => p.id === input.id)) {
    throw new KeysmeError('DUPLICATE_ID', `Preset id "${input.id}" already exists`)
  }
  if (!input.model || input.model.trim() === '') {
    throw new KeysmeError('MODEL_REQUIRED', 'model is required')
  }
  if (!existingProviders.some((p) => p.id === input.providerId)) {
    throw new KeysmeError('INVALID_PROVIDER_ID', `Provider "${input.providerId}" not found`)
  }
}

export function validateProviderRemove(providerId: string, presets: Preset[]): void {
  if (presets.some((p) => p.providerId === providerId)) {
    throw new KeysmeError('PROVIDER_IN_USE', `Provider "${providerId}" is used by existing presets`)
  }
}
