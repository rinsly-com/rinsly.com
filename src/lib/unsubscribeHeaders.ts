/**
 * HTTP headers for /afmelden, /{nl|en}/afmelden and ./one-click.
 *
 * Referrer-Policy no-referrer keeps ?token= out of Referer on same-origin
 * clicks (the global accp header is strict-origin-when-cross-origin).
 * Cache-Control no-store keeps confirm/success out of shared caches.
 */
export const UNSUBSCRIBE_HTTP_HEADERS = [
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Cache-Control', value: 'no-store' },
] as const

export const UNSUBSCRIBE_HEADER_SOURCES = [
  '/afmelden',
  '/afmelden/',
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
