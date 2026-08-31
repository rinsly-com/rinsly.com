/**
 * Content-Security-Policy for the static rinsly.com export (`out/_headers`).
 *
 * Cloudflare Web Analytics (zone setting) injects
 * `https://static.cloudflareinsights.com/beacon.min.js` and posts RUM to
 * `https://cloudflareinsights.com/cdn-cgi/rum`. Without those hosts in
 * script-src / connect-src the browser blocks the beacon and PageSpeed
 * Best Practices fails "Browser errors were logged to the console" /
 * "Issues were logged in the Issues panel" (rinsly.com 2026-08-31).
 *
 * `apiOrigin` is the Payload worker (accp) for CMS images + forms.
 */
export function staticContentSecurityPolicy(apiOrigin) {
  const origin = new URL(apiOrigin).origin
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${origin}`,
    "font-src 'self' data:",
    `connect-src 'self' ${origin} https://cloudflareinsights.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    `form-action 'self' ${origin}`,
    "object-src 'none'",
  ].join('; ')
}
