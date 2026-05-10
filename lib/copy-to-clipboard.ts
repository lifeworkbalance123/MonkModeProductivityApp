/**
 * Copy via execCommand only — avoids Clipboard API NotAllowedError
 * ("Document is not focused") on mobile, iframes, and async focus edge cases.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false

  const tryExecCommand = (): boolean => {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.tabIndex = -1
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      ta.style.top = '0'
      ta.style.fontSize = '12pt'
      document.body.appendChild(ta)
      ta.focus({ preventScroll: true })
      ta.select()
      ta.setSelectionRange(0, text.length)
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }

  if (tryExecCommand()) return true
  await new Promise<void>((r) => {
    requestAnimationFrame(() => r())
  })
  return tryExecCommand()
}
