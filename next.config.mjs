import path from 'path'
import { fileURLToPath } from 'url'
import { withSentryConfig } from '@sentry/nextjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  devIndicators: {
    buildActivity: false,
  },
  images: {
    unoptimized: true,
  },
  // @react-pdf/renderer pulls in fontkit + restructure which use dynamic
  // requires and native streams. Webpack can't statically bundle them, so
  // without this flag the Vercel build silently drops the /tools and
  // /api/tools/generate-pdf routes (and keeps serving the previous build).
  // Mark the package as external so Next loads it from node_modules at runtime.
  serverExternalPackages: ['@react-pdf/renderer'],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  async headers() {
    const longCache = [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
    ]
    // One rule per extension — Next.js path patterns do not accept non-capturing
    // groups like (?:png|jpg); a leading "?" in the source string fails the parser
    // (Vercel: "Pattern cannot start with ? at 10").
    const exts = [
      'png',
      'jpg',
      'jpeg',
      'webp',
      'avif',
      'svg',
      'ico',
      'woff',
      'woff2',
      'ttf',
    ]
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      ...exts.map((ext) => ({
        source: `/:path*.${ext}`,
        headers: longCache,
      })),
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

export default enableSentryBuildPlugin
  ? withSentryConfig(nextConfig, {
      org: sentryOrg,
      project: sentryProject,
      authToken: sentryAuth,
      silent: true,
    })
  : nextConfig
