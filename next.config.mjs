import path from 'path'
import { fileURLToPath } from 'url'
import { withSentryConfig } from '@sentry/nextjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
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
