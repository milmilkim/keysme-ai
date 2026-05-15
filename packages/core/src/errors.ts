export type KeysmeErrorCode =
  | 'PROVIDER_NOT_FOUND'
  | 'PRESET_NOT_FOUND'
  | 'PROVIDER_IN_USE'
  | 'DUPLICATE_ID'
  | 'MODEL_REQUIRED'
  | 'BASE_URL_REQUIRED'
  | 'INVALID_PROVIDER_ID'
  | 'STORAGE_ERROR'
  | 'MODEL_FETCH_FAILED'
  | 'INVALID_EXPORT_TOKEN'
  | 'DECRYPT_FAILED'

export type KeysmeLocale = 'en' | 'ko'

/**
 * User-facing messages for every error code, in English and Korean.
 * Use getErrorMessage(error.code, locale) to show a localized message.
 * The Error's own .message stays English so logs are machine-searchable.
 */
export const KEYSME_ERROR_MESSAGES: Record<KeysmeErrorCode, Record<KeysmeLocale, string>> = {
  PROVIDER_NOT_FOUND: {
    en: 'Provider not found.',
    ko: '프로바이더를 찾을 수 없습니다.',
  },
  PRESET_NOT_FOUND: {
    en: 'Preset not found.',
    ko: '프리셋을 찾을 수 없습니다.',
  },
  PROVIDER_IN_USE: {
    en: 'This provider is used by one or more presets and cannot be removed.',
    ko: '이 프로바이더를 사용하는 프리셋이 있어 삭제할 수 없습니다.',
  },
  DUPLICATE_ID: {
    en: 'An item with this id already exists.',
    ko: '같은 id를 가진 항목이 이미 존재합니다.',
  },
  MODEL_REQUIRED: {
    en: 'A model is required. keysme never assumes a default model.',
    ko: '모델을 지정해야 합니다. keysme는 기본 모델을 가정하지 않습니다.',
  },
  BASE_URL_REQUIRED: {
    en: 'A base URL is required. keysme never assumes a default endpoint.',
    ko: 'base URL을 지정해야 합니다. keysme는 기본 엔드포인트를 가정하지 않습니다.',
  },
  INVALID_PROVIDER_ID: {
    en: 'The referenced provider id is invalid.',
    ko: '참조된 프로바이더 id가 유효하지 않습니다.',
  },
  STORAGE_ERROR: {
    en: 'Failed to read from or write to storage.',
    ko: '저장소를 읽거나 쓰는 데 실패했습니다.',
  },
  MODEL_FETCH_FAILED: {
    en: 'Failed to fetch the model list from the provider.',
    ko: '프로바이더에서 모델 목록을 가져오지 못했습니다.',
  },
  INVALID_EXPORT_TOKEN: {
    en: 'This is not a valid keysme export token.',
    ko: '유효한 keysme export 토큰이 아닙니다.',
  },
  DECRYPT_FAILED: {
    en: 'Wrong passphrase, or the token has been corrupted.',
    ko: '비밀번호가 틀렸거나 토큰이 손상되었습니다.',
  },
}

let currentLocale: KeysmeLocale = 'en'

/**
 * Set the language for KeysmeError messages, once at app startup.
 * Applies to every error thrown afterwards, including standalone
 * functions like decryptExport. Defaults to 'en' when never called.
 *
 *   import { setKeysmeLocale } from '@keysme-ai/core'
 *   setKeysmeLocale('ko')
 */
export function setKeysmeLocale(locale: KeysmeLocale): void {
  currentLocale = locale
}

export function getKeysmeLocale(): KeysmeLocale {
  return currentLocale
}

/**
 * Localized message for an error code. Uses the global locale unless
 * one is passed explicitly. Handy when you only have a code (form
 * validation UI) or need a language other than the global one.
 */
export function getErrorMessage(code: KeysmeErrorCode, locale?: KeysmeLocale): string {
  return KEYSME_ERROR_MESSAGES[code][locale ?? currentLocale]
}

export class KeysmeError extends Error {
  code: KeysmeErrorCode

  constructor(code: KeysmeErrorCode, message?: string) {
    super(message ?? KEYSME_ERROR_MESSAGES[code][currentLocale])
    this.name = 'KeysmeError'
    this.code = code
  }
}
