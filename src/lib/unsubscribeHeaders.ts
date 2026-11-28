/**
 * HTTP headers for /{nl|en}/afmelden and ./one-click.
 *
 * Referrer-Policy no-referrer keeps ?token= out of Referer on same-origin
 * clicks (the global accp header is strict-origin-when-cross-origin).
 * Cache-Control no-store keeps confirm/success out of shared caches.
 *
 * Locale and one-click routes get these only via next.config headers()
 * listed after the catch-all (last key wins). Middleware applies them
 * only on its terminal 307 for bare /afmelden — applying them again on
 * NextResponse.next() would duplicate the values as "no-referrer, no-referrer".
 * Bare /afmelden is not a headers() source: OpenNext handleRedirects would
 * not apply them, and the redirect itself is now in middleware.
 */
export const UNSUBSCRIBE_HTTP_HEADERS = [
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Cache-Control', value: 'no-store' },
] as const

export const UNSUBSCRIBE_HEADER_SOURCES = [
  '/:locale(nl|en)/afmelden',
  '/:locale(nl|en)/afmelden/',
  '/:locale(nl|en)/afmelden/one-click',
  '/:locale(nl|en)/afmelden/one-click/',
] as const

export function applyUnsubscribeHeaders(headers: Headers): void {
  for (const { key, value } of UNSUBSCRIBE_HTTP_HEADERS) {
    headers.set(key, value)
  }
}
