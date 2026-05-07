self.addEventListener('install', (event) => {
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

