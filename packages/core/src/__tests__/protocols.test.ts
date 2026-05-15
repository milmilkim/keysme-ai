import { describe, expect, it } from 'vitest'
import { getProtocol } from '../protocols'

describe('protocols', () => {
  it('defaults to openai', () => {
    expect(getProtocol().authHeaders('k')).toEqual({ Authorization: 'Bearer k' })
    expect(getProtocol(undefined)).toBe(getProtocol('openai'))
  })

  it('builds auth headers per protocol', () => {
    expect(getProtocol('anthropic').authHeaders('k')).toEqual({ 'x-api-key': 'k' })
    expect(getProtocol('gemini').authHeaders('k')).toEqual({ 'x-goog-api-key': 'k' })
  })

  it('parses openai/anthropic model lists', () => {
    const json = { data: [{ id: 'gpt-x' }, { id: 'gpt-y' }] }
    expect(getProtocol('openai').parseModels(json)).toEqual(['gpt-x', 'gpt-y'])
    expect(getProtocol('anthropic').parseModels(json)).toEqual(['gpt-x', 'gpt-y'])
  })

  it('parses gemini model list and strips models/ prefix', () => {
    const json = { models: [{ name: 'models/gemini-2.0-flash' }, { name: 'gemini-raw' }] }
    expect(getProtocol('gemini').parseModels(json)).toEqual(['gemini-2.0-flash', 'gemini-raw'])
  })

  it('handles missing lists', () => {
    expect(getProtocol('openai').parseModels({})).toEqual([])
    expect(getProtocol('gemini').parseModels({})).toEqual([])
  })

  describe('toRequestParams', () => {
    it('passes openai params through and flattens extraBody', () => {
      expect(
        getProtocol('openai').toRequestParams({
          temperature: 0.7,
          max_completion_tokens: 1000,
          extraBody: { logprobs: true },
        }),
      ).toEqual({ temperature: 0.7, max_completion_tokens: 1000, logprobs: true })
    })

    it('maps anthropic param names and drops unsupported', () => {
      expect(
        getProtocol('anthropic').toRequestParams({
          temperature: 0.7,
          top_k: 40,
          max_completion_tokens: 1000,
          stop: 'END',
          seed: 42,
          presence_penalty: 0.5,
        }),
      ).toEqual({
        temperature: 0.7,
        top_k: 40,
        max_tokens: 1000,
        stop_sequences: ['END'],
      })
    })

    it('maps gemini param names to camelCase', () => {
      expect(
        getProtocol('gemini').toRequestParams({
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          max_tokens: 500,
          stop: ['a', 'b'],
          seed: 42,
        }),
      ).toEqual({
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 500,
        stopSequences: ['a', 'b'],
        seed: 42,
      })
    })

    it('prefers explicit max_tokens over max_completion_tokens', () => {
      expect(getProtocol('anthropic').toRequestParams({ max_tokens: 1, max_completion_tokens: 2 }))
        .toEqual({ max_tokens: 1 })
    })

    it('omits undefined params', () => {
      expect(getProtocol('gemini').toRequestParams({})).toEqual({})
      expect(getProtocol('openai').toRequestParams({})).toEqual({})
    })

    it('passes reasoning_effort through for openai, drops it elsewhere', () => {
      expect(getProtocol('openai').toRequestParams({ reasoning_effort: 'high' })).toEqual({
        reasoning_effort: 'high',
      })
      expect(getProtocol('anthropic').toRequestParams({ reasoning_effort: 'high' })).toEqual({})
      expect(getProtocol('gemini').toRequestParams({ reasoning_effort: 'high' })).toEqual({})
    })

    it('passes extraBody through verbatim (escape hatch for volatile settings)', () => {
      expect(
        getProtocol('anthropic').toRequestParams({
          extraBody: { output_config: { effort: 'high' } },
        }),
      ).toEqual({ output_config: { effort: 'high' } })
      expect(
        getProtocol('gemini').toRequestParams({
          extraBody: { thinkingConfig: { thinkingLevel: 'low' } },
        }),
      ).toEqual({ thinkingConfig: { thinkingLevel: 'low' } })
    })
  })
})
