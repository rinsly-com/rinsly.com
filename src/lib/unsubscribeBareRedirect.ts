/**
 * Bare /afmelden (and /afmelden/) is a typable shortcut to /nl/afmelden.
 *
 * This redirect lives in middleware, not next.config redirects(). On the
 * OpenNext Cloudflare worker, middleware runs first and can return a 307
 * with Referrer-Policy and Cache-Control. next.config redirects are applied
 * later by routingHandler.handleRedirects, which returns the 307 without
 * those headers (and without running headers() or middleware).
 *
 * The query string, including ?token=, is preserved by the caller when it
 * clones the request URL.
 *
 * /afmelden/ is handled here too, but OpenNext's middleware handler runs
 * handleTrailingSlashRedirect first, so a live /afmelden/ request becomes a
 * headerless 308 to /afmelden (query kept). Turning on skipTrailingSlashRedirect
 * would let this run, but would also drop trailing-slash 308s on every other
 * path, which we will not do. The follow-up /afmelden 307 has the headers.
 */
export const UNSUBSCRIBE_BARE_DESTINATION = '/nl/afmelden' as const

export function unsubscribeBareRedirect(pathname: string): { pathname: typeof UNSUBSCRIBE_BARE_DESTINATION } | null {
  if (pathname === '/afmelden' || pathname === '/afmelden/') {
    return { pathname: UNSUBSCRIBE_BARE_DESTINATION }
  }
  return null
}
