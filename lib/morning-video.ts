/** Returns YouTube embed URL, or null if the string is not a recognised YouTube link. */
export function youtubeEmbedFromUrl(url: string): string | null {
  const u = url.trim()
  if (!u) return null
  try {
    const parsed = new URL(u)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = parsed.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
      const embed = parsed.pathname.match(/^\/embed\/([^/?]+)/)
      if (embed) return `https://www.youtube.com/embed/${embed[1]}`
      const shorts = parsed.pathname.match(/^\/shorts\/([^/?]+)/)
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`
    }
  } catch {
    return null
  }
  return null
}
