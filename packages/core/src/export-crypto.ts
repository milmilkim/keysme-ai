import { KeysmeError } from './errors'
import type { KeysmeExport } from './types'

/**
 * Passphrase-encrypted export tokens ("keysme1." prefix).
 *
 * encryptExport(data, passphrase) → one opaque string containing the whole
 * KeysmeExport, locked with a USER-CHOSEN passphrase (never an app-level
 * secret; app secrets can be extracted from any bundle). Save it as a .keysme
 * file or pass it around as text. It is the same token either way.
 * decryptExport(token, passphrase) reverses it in any keysme app.
 *
 * Scheme: PBKDF2 (SHA-256, 600k iterations, random salt) derives an
 * AES-256-GCM key from the passphrase. GCM authenticates the ciphertext,
 * so a wrong passphrase or a tampered token fails cleanly with
 * KeysmeError('DECRYPT_FAILED') instead of yielding garbage.
 *
 * Uses globalThis.crypto (WebCrypto), built into browsers and Node 19+.
 * React Native needs a WebCrypto polyfill (e.g. react-native-quick-crypto).
 */

const PREFIX = 'keysme1.'
const ITERATIONS = 600_000

interface Envelope {
  v: 1
  salt: string
  iv: string
  data: string
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptExport(data: KeysmeExport, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  )

  const envelope: Envelope = {
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
  }
  return PREFIX + btoa(JSON.stringify(envelope))
}

export async function decryptExport(token: string, passphrase: string): Promise<KeysmeExport> {
  if (!token.startsWith(PREFIX)) {
    throw new KeysmeError('INVALID_EXPORT_TOKEN', 'Not a keysme export token')
  }

  let envelope: Envelope
  try {
    envelope = JSON.parse(atob(token.slice(PREFIX.length)))
  } catch {
    throw new KeysmeError('INVALID_EXPORT_TOKEN', 'Malformed export token')
  }
  if (envelope.v !== 1 || !envelope.salt || !envelope.iv || !envelope.data) {
    throw new KeysmeError('INVALID_EXPORT_TOKEN', 'Unsupported export token format')
  }

  const key = await deriveKey(passphrase, fromBase64(envelope.salt))
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv) as BufferSource },
      key,
      fromBase64(envelope.data) as BufferSource,
    )
    return JSON.parse(new TextDecoder().decode(plaintext))
  } catch {
    // GCM auth failure. Wrong passphrase and tampered token are indistinguishable by design.
    throw new KeysmeError('DECRYPT_FAILED', 'Wrong passphrase or corrupted token')
  }
}

/** Whether a string looks like an encrypted keysme export token. */
export function isExportToken(value: string): boolean {
  return value.trimStart().startsWith(PREFIX)
}
