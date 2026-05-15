export function joinUrl(base: string, path: string): string {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${cleanBase}/${cleanPath}`
}
