import type { KeysmeStore } from '@keysme-ai/core'
import { createContext } from 'react'

export const KeysmeContext = createContext<KeysmeStore | null>(null)
