/** Refresh failed server-side (revoked session, cleared cookies, wrong project, expired rotation). */
export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (error == null) return false
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message)
        : String(error)
  const lower = msg.toLowerCase()
  if (/refresh token not found/.test(lower)) return true
  if (/invalid refresh token/.test(lower)) return true
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : ''
  if (code === 'refresh_token_not_found') return true
  const name =
    typeof error === 'object' && error !== null && 'name' in error
      ? String((error as { name?: unknown }).name ?? '')
      : ''
  if (
    name === 'AuthApiError' &&
    (/invalid refresh/.test(lower) || /refresh token/.test(lower))
  ) {
    return true
  }
  return false
}
