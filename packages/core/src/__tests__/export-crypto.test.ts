import { describe, expect, it } from 'vitest'
import { KeysmeError } from '../errors'
import { decryptExport, encryptExport, isExportToken } from '../export-crypto'
import type { KeysmeExport } from '../types'

const SAMPLE: KeysmeExport = {
  version: 1,
  providers: [
    {
      id: 'p1',
      name: 'OpenAI',
      baseURL: 'https://api.openai.com/v1',
      apiKey: 'sk-secret',
      createdAt: 1,
      updatedAt: 1,
    },
  ],
  presets: [],
  active: null,
}

describe('export-crypto', () => {
  it('round-trips data with the right passphrase', async () => {
    const token = await encryptExport(SAMPLE, 'correct horse battery')
    expect(token.startsWith('keysme1.')).toBe(true)
    expect(await decryptExport(token, 'correct horse battery')).toEqual(SAMPLE)
  })

  it('does not leak plaintext in the token', async () => {
    const token = await encryptExport(SAMPLE, 'pass')
    const decoded = atob(token.slice('keysme1.'.length))
    expect(token).not.toContain('sk-secret')
    expect(decoded).not.toContain('sk-secret')
    expect(decoded).not.toContain('openai.com')
  })

  it('produces a different token each time (random salt/iv)', async () => {
    const a = await encryptExport(SAMPLE, 'pass')
    const b = await encryptExport(SAMPLE, 'pass')
    expect(a).not.toBe(b)
  })

  it('fails with DECRYPT_FAILED on wrong passphrase', async () => {
    const token = await encryptExport(SAMPLE, 'right')
    await expect(decryptExport(token, 'wrong')).rejects.toMatchObject({
      code: 'DECRYPT_FAILED',
    })
  })

  it('fails with DECRYPT_FAILED on tampered ciphertext', async () => {
    const token = await encryptExport(SAMPLE, 'pass')
    const envelope = JSON.parse(atob(token.slice('keysme1.'.length)))
    const bytes = Uint8Array.from(atob(envelope.data), (c) => c.charCodeAt(0))
    if (bytes[0] !== undefined) bytes[0] ^= 0xff
    envelope.data = btoa(String.fromCharCode(...bytes))
    const tampered = `keysme1.${btoa(JSON.stringify(envelope))}`

    await expect(decryptExport(tampered, 'pass')).rejects.toMatchObject({
      code: 'DECRYPT_FAILED',
    })
  })

  it('rejects non-token input with INVALID_EXPORT_TOKEN', async () => {
    await expect(decryptExport('{"version":1}', 'pass')).rejects.toMatchObject({
      code: 'INVALID_EXPORT_TOKEN',
    })
    await expect(decryptExport('keysme1.not-base64!!!', 'pass')).rejects.toMatchObject({
      code: 'INVALID_EXPORT_TOKEN',
    })
    await expect(decryptExport('keysme1.', 'pass')).rejects.toBeInstanceOf(KeysmeError)
  })

  it('detects tokens with isExportToken', async () => {
    expect(isExportToken(await encryptExport(SAMPLE, 'p'))).toBe(true)
    expect(isExportToken('{"version":1}')).toBe(false)
  })
}, 30_000)
