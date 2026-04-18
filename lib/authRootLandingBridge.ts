/**
 * Inlined via next/script strategy="beforeInteractive" in root layout.
 * Supabase often redirects recovery/magic links to the Site URL root (`/`) with
 * `#access_token=…`. React + `@supabase/supabase-js` then consume the hash while
 * the user stays on the landing page. This runs before the main bundle so we can
 * forward the fragment to the right route.
 */
export const AUTH_ROOT_LANDING_BRIDGE_SCRIPT = `(function(){
  try {
    var path = window.location.pathname || '';
    if (path !== '/' && path !== '') return;
    var origin = window.location.origin;
    var search = window.location.search || '';
    var hash = window.location.hash || '';
    if (search.indexOf('code=') !== -1) {
      window.location.replace(origin + '/auth/callback' + search + hash);
      return;
    }
    if (!hash || hash.length < 4) return;
    var frag = hash.charAt(0) === '#' ? hash.slice(1) : hash;
    if (frag.indexOf('error=') !== -1) return;
    if (frag.indexOf('access_token=') === -1) return;
    var isRecovery = /(?:^|&)type=recovery(?:&|$)/.test(frag);
    if (isRecovery) {
      window.location.replace(origin + '/auth/update-password' + hash);
      return;
    }
    window.location.replace(origin + '/auth/callback' + hash);
  } catch (e) {}
})();`
