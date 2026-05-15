export function maskSecret(secret: string | undefined): string {
  if (!secret) return ''
  const last3 = secret.slice(-3)
  const prefix = secret.slice(0, secret.indexOf('-') + 1) || secret.slice(0, 2)
  return `${prefix}...${last3}`
}
