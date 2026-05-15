import { afterEach, describe, expect, it } from 'vitest'
import { getErrorMessage, KEYSME_ERROR_MESSAGES, KeysmeError, setKeysmeLocale } from '../errors'

afterEach(() => setKeysmeLocale('en'))

describe('errors', () => {
  it('has en and ko messages for every code', () => {
    for (const [code, messages] of Object.entries(KEYSME_ERROR_MESSAGES)) {
      expect(messages.en, code).toBeTruthy()
      expect(messages.ko, code).toBeTruthy()
    }
  })

  it('getErrorMessage returns localized text, defaulting to en', () => {
    expect(getErrorMessage('DECRYPT_FAILED')).toBe(KEYSME_ERROR_MESSAGES.DECRYPT_FAILED.en)
    expect(getErrorMessage('DECRYPT_FAILED', 'ko')).toContain('비밀번호')
  })

  it('KeysmeError defaults its message from the en table', () => {
    const err = new KeysmeError('MODEL_REQUIRED')
    expect(err.message).toBe(KEYSME_ERROR_MESSAGES.MODEL_REQUIRED.en)
    expect(new KeysmeError('MODEL_REQUIRED', 'custom').message).toBe('custom')
  })

  it('setKeysmeLocale switches default messages globally', () => {
    setKeysmeLocale('ko')
    expect(new KeysmeError('MODEL_REQUIRED').message).toBe(KEYSME_ERROR_MESSAGES.MODEL_REQUIRED.ko)
    expect(getErrorMessage('MODEL_REQUIRED')).toBe(KEYSME_ERROR_MESSAGES.MODEL_REQUIRED.ko)
    expect(getErrorMessage('MODEL_REQUIRED', 'en')).toBe(KEYSME_ERROR_MESSAGES.MODEL_REQUIRED.en)
  })
})
