export function randomSlug(prefix: string, bytes: number = 9): string {
  // 9 bytes ≈ 12 chars base64url-ish after stripping; good enough for share slugs
  const raw = new Uint8Array(bytes)
  crypto.getRandomValues(raw)
  let s = ''
  for (const b of raw) s += b.toString(16).padStart(2, '0')
  return `${prefix}_${s}`
}

