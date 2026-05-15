import { describe, expect, it } from 'vitest'
import { getModelCapabilities, validateParams } from '../capabilities'
import type { ModelCapabilities, ModelCapabilitiesRegistry } from '../types'

describe('getModelCapabilities', () => {
  it('returns null when registry is undefined', () => {
    expect(getModelCapabilities('gpt-5', undefined)).toBeNull()
  })

  it('returns null when model is not registered', () => {
    const registry: ModelCapabilitiesRegistry = { 'gpt-5': { supports: ['temperature'] } }
    expect(getModelCapabilities('claude-opus-4', registry)).toBeNull()
  })

  it('returns capabilities for registered model', () => {
    const caps: ModelCapabilities = { supports: ['temperature'] }
    const registry: ModelCapabilitiesRegistry = { 'gpt-5': caps }
    expect(getModelCapabilities('gpt-5', registry)).toBe(caps)
  })
})

describe('validateParams', () => {
  it('returns empty when capabilities are null (lenient default)', () => {
    expect(validateParams({ temperature: 0.7 }, null)).toEqual([])
  })

  it('returns empty when params are undefined', () => {
    expect(validateParams(undefined, { supports: ['temperature'] })).toEqual([])
  })

  it('skips undefined param values', () => {
    expect(validateParams({ temperature: undefined }, { supports: ['top_p'] })).toEqual([])
  })

  it('flags excluded params', () => {
    const issues = validateParams(
      { temperature: 0.5 },
      { excludes: ['temperature'] },
    )
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ kind: 'excluded', param: 'temperature' })
  })

  it('flags unsupported params when supports list exists', () => {
    const issues = validateParams(
      { temperature: 0.5, top_k: 40 },
      { supports: ['temperature'] },
    )
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ kind: 'unsupported', param: 'top_k' })
  })

  it('passes when param is in supports list', () => {
    const issues = validateParams({ temperature: 0.5 }, { supports: ['temperature'] })
    expect(issues).toEqual([])
  })

  it('flags out-of-range values', () => {
    const issues = validateParams(
      { temperature: 3 },
      { ranges: { temperature: [0, 2] } },
    )
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ kind: 'out_of_range', param: 'temperature', value: 3 })
  })

  it('passes when value is within range', () => {
    const issues = validateParams(
      { temperature: 1 },
      { ranges: { temperature: [0, 2] } },
    )
    expect(issues).toEqual([])
  })

  it('excludes win over supports', () => {
    const issues = validateParams(
      { temperature: 0.5 },
      { supports: ['temperature'], excludes: ['temperature'] },
    )
    expect(issues).toHaveLength(1)
    expect(issues[0]?.kind).toBe('excluded')
  })
})
