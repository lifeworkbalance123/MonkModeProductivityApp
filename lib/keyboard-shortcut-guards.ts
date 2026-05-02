/** Skip global shortcuts while the user is typing or in a native picker. */
export function isEditableOrTypingTarget(ev: KeyboardEvent): boolean {
  const el = ev.target
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}
