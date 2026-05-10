/**
 * Service worker is production-only.
 * In dev/localhost, caching and SW lifecycle makes UI changes look “stuck”.
 */
const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const isDevHost = DEV_HOSTS.has(self.location.hostname)

if (isDevHost) {
  // Self-destruct on localhost and release all clients.
  self.addEventListener('install', () => self.skipWaiting())
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({
          includeUncontrolled: true,
          type: 'window',
        })
        for (const c of clients) c.navigate(c.url)
        await self.registration.unregister()
      })(),
    )
  })
} else {
  self.addEventListener('install', () => {
    // Activate this SW immediately on install.
    self.skipWaiting()
  })

  self.addEventListener('activate', (event) => {
    // Take control of uncontrolled clients as soon as possible.
    event.waitUntil(self.clients.claim())
  })

  // A fetch handler is required for "installable" PWA criteria in Chromium.
  // We intentionally keep it network-first; caching can be added later.
  self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request))
  })
}

