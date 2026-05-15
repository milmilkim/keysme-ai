import { decryptExport, encryptExport, isExportToken, KeysmeError } from '@keysme-ai/core'
import { KeysmeContext } from '@keysme-ai/react'
import { useContext, useRef, useState } from 'react'

const MIN_PASSPHRASE = 8

function askPassphrase(message: string): string | null {
  const passphrase = window.prompt(message)
  if (passphrase === null) return null
  if (passphrase.length < MIN_PASSPHRASE) {
    window.alert(`Passphrase must be at least ${MIN_PASSPHRASE} characters.`)
    return null
  }
  return passphrase
}

export function ExportImport() {
  const store = useContext(KeysmeContext)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')

  async function handleExport() {
    if (!store) return
    const passphrase = askPassphrase('Set a passphrase to lock this export:')
    if (!passphrase) return

    const data = await store.export({ includeSecrets: true })
    const token = await encryptExport(data, passphrase)
    const blob = new Blob([token], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-settings.keysme'
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Exported 🔒')
  }

  async function handleImport(file: File) {
    if (!store) return
    try {
      const text = await file.text()
      if (isExportToken(text)) {
        const passphrase = window.prompt('Enter the passphrase for this file:')
        if (passphrase === null) return
        await store.import(await decryptExport(text.trim(), passphrase), { merge: true })
      } else {
        // legacy unencrypted export
        await store.import(JSON.parse(text), { merge: true })
      }
      setStatus('Imported ✓')
    } catch (err) {
      setStatus(
        err instanceof KeysmeError && err.code === 'DECRYPT_FAILED'
          ? 'Import failed: wrong passphrase'
          : 'Import failed: not a valid .keysme file',
      )
    }
  }

  return (
    <div className="export-import">
      <button type="button" className="sm" onClick={handleExport}>
        Export .keysme
      </button>
      <button type="button" className="sm" onClick={() => fileRef.current?.click()}>
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".keysme,application/json,text/plain"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImport(file)
          e.target.value = ''
        }}
      />
      {status && <span className="hint">{status}</span>}
    </div>
  )
}
