import path from 'path'
import { fileURLToPath } from 'url'
import { withSentryConfig } from '@sentry/nextjs'
import bundleAnalyzer from '@next/bundle-analyzer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true' || process.env.ANALYZE === '1',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  devIndicators: {
    buildActivity: false,
  },
  /**
   * Image optimization is on. Supabase storage URLs are allowlisted via remotePatterns.
   * Any `<Image>` whose `src` is outside these patterns will fail at runtime — opt out per-call
   * with the `unoptimized` prop if you need to load from a new domain.
   */
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  /**
   * lucide-react ships as ESM and tree-shakes today, but `modularizeImports` makes the per-icon
   * resolution explicit, prevents accidental full-package imports, and keeps the dev-server fast.
   */
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  async headers() {
    return [
      {
        // sw.js itself must never be long-cached or stale workers get pinned to users.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Static assets in /public are versioned at deploy time (we never mutate them in place);
        // safe to cache aggressively at the edge.
        source: '/:path*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff|woff2|ttf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

/**
 * Only wrap with Sentry when upload credentials exist. Otherwise `next build` on Vercel
 * can fail (e.g. 401 from expired SENTRY_AUTH_TOKEN) even though the app builds fine.
 */
const sentryAuth = (process.env.SENTRY_AUTH_TOKEN ?? '').trim()
const sentryOrg = (process.env.SENTRY_ORG ?? '').trim()
const sentryProject = (process.env.SENTRY_PROJECT ?? 'monkmode').trim()
const enableSentryBuildPlugin = Boolean(sentryAuth && sentryOrg)

const finalConfig = enableSentryBuildPlugin
  ? withSentryConfig(nextConfig, {
      org: sentryOrg,
      project: sentryProject,
      authToken: sentryAuth,
      silent: true,
    })
  : nextConfig

export default withBundleAnalyzer(finalConfig)
