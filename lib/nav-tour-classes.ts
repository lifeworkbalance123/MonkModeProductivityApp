/** Stable CSS classes for react-joyride / product tour targets. */
export const NAV_TOUR_CLASS: Record<string, string> = {
  '/today': 'begin-button',
  '/habits': 'habits-nav',
  '/schedule': 'schedule-nav',
  '/goals': 'goals-nav',
}

export function navTourClass(href: string) {
  return NAV_TOUR_CLASS[href] ?? ''
}
