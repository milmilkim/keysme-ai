const ENDPOINT_PATTERNS = [
  '/chat/completions',
  '/completions',
  '/embeddings',
  '/models',
  '/responses',
]

export interface ValidateBaseURLResult {
  warnings: string[]
}

export function validateBaseURL(url: string): ValidateBaseURLResult {
  const warnings: string[] = []
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url

  for (const pattern of ENDPOINT_PATTERNS) {
    if (cleanUrl.endsWith(pattern)) {
      warnings.push(
        `URL includes "${pattern}". This is handled automatically, but you can pass just the baseURL.`,
      )
      break
    }
  }

  return { warnings }
}
