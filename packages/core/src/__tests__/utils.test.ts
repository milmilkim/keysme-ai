import { describe, expect, it } from 'vitest'
import { inferBaseURL, joinUrl, maskSecret, validateBaseURL } from '../utils'

describe('inferBaseURL', () => {
  it('strips /chat/completions', () => {
    expect(inferBaseURL('https://api.openai.com/v1/chat/completions')).toBe(
      'https://api.openai.com/v1',
    )
  })
  it('strips /completions', () => {
    expect(inferBaseURL('https://api.openai.com/v1/completions')).toBe('https://api.openai.com/v1')
  })
  it('strips /embeddings', () => {
    expect(inferBaseURL('https://api.openai.com/v1/embeddings')).toBe('https://api.openai.com/v1')
  })
  it('strips /models', () => {
    expect(inferBaseURL('https://api.openai.com/v1/models')).toBe('https://api.openai.com/v1')
  })
  it('strips /responses', () => {
    expect(inferBaseURL('https://api.openai.com/v1/responses')).toBe('https://api.openai.com/v1')
  })
  it('strips trailing slash', () => {
    expect(inferBaseURL('https://api.openai.com/v1/')).toBe('https://api.openai.com/v1')
  })
  it('leaves clean URL as-is', () => {
    expect(inferBaseURL('https://api.openai.com/v1')).toBe('https://api.openai.com/v1')
  })
  it('handles bare localhost', () => {
    expect(inferBaseURL('http://localhost:11434')).toBe('http://localhost:11434')
  })
  it('handles localhost with suffix', () => {
    expect(inferBaseURL('http://localhost:11434/v1/chat/completions')).toBe(
      'http://localhost:11434/v1',
    )
  })
})

describe('joinUrl', () => {
  it('joins base and path', () => {
    expect(joinUrl('https://api.openai.com/v1', 'models')).toBe('https://api.openai.com/v1/models')
  })
  it('handles trailing slash on base', () => {
    expect(joinUrl('https://api.openai.com/v1/', 'models')).toBe('https://api.openai.com/v1/models')
  })
  it('handles leading slash on path', () => {
    expect(joinUrl('https://api.openai.com/v1', '/models')).toBe('https://api.openai.com/v1/models')
  })
  it('handles both slashes', () => {
    expect(joinUrl('https://api.openai.com/v1/', '/models')).toBe(
      'https://api.openai.com/v1/models',
    )
  })
})

describe('maskSecret', () => {
  it('masks long key', () => {
    expect(maskSecret('sk-proj-abc123xyz789')).toBe('sk-...789')
  })
  it('masks short key', () => {
    expect(maskSecret('sk-abc')).toBe('sk-...abc')
  })
  it('returns empty string for undefined', () => {
    expect(maskSecret(undefined)).toBe('')
  })
  it('returns empty string for empty string', () => {
    expect(maskSecret('')).toBe('')
  })
})

describe('validateBaseURL', () => {
  it('returns no warnings for clean URL', () => {
    expect(validateBaseURL('https://api.openai.com/v1').warnings).toHaveLength(0)
  })
  it('warns about /chat/completions', () => {
    const result = validateBaseURL('https://api.openai.com/v1/chat/completions')
    expect(result.warnings.length).toBeGreaterThan(0)
  })
  it('warns about /responses', () => {
    const result = validateBaseURL('https://api.openai.com/v1/responses')
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
