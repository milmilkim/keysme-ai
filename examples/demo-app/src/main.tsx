import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createKeysmeStore, localStorageAdapter } from '@keysme-ai/core'
import { KeysmeProvider } from '@keysme-ai/react'
import { App } from './App'
import { KNOWN_MODELS } from './known-models'
import './styles.css'

const store = createKeysmeStore({
  storage: localStorageAdapter(),
  modelCapabilities: KNOWN_MODELS,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KeysmeProvider store={store}>
      <App />
    </KeysmeProvider>
  </StrictMode>,
)
