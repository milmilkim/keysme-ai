const KNOWN_SUFFIXES = ['/chat/completions', '/completions', '/embeddings', '/models', '/responses']

export function inferBaseURL(url: string): string {
  let result = url.endsWith('/') ? url.slice(0, -1) : url
  for (const suffix of KNOWN_SUFFIXES) {
    if (result.endsWith(suffix)) {
      result = result.slice(0, -suffix.length)
      break
    }
  }
  return result
}
