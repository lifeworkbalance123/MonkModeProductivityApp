/**
 * Supabase recovery/magic links often hit the Site URL root (`/`) with `#access_token=…`.
 * The bridge script runs before the main bundle and forwards the fragment to `/auth/callback`
 * (or `/auth/update-password` for recovery).
 *
 * **Implementation:** `public/auth-root-landing-bridge.js` (loaded from root layout via
 * `next/script` `strategy="beforeInteractive"`). Inline scripts via `dangerouslySetInnerHTML`
 * on `<Script>` trigger React 19 console warnings, so we use an external file + `src`.
 */
export const AUTH_ROOT_LANDING_BRIDGE_SCRIPT_SRC =
  '/auth-root-landing-bridge.js' as const
