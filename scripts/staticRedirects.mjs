/**
 * Lines for out/_redirects on the static rinsly.com export (Workers Static
 * Assets). Written by build-static.mjs.
 *
 * Refactor plan 003 T-03: the bare root and trailing-slash URLs answer with a
 * permanent redirect (308), not 302 / 307. Without the two trailing-slash
 * rules, `html_handling: auto-trailing-slash` answers `/nl/prijzen/` with a
 * 307. The specific rules come first, because the first match wins. The
 * placeholders match one path segment, so `/` itself never matches a
 * trailing-slash rule.
 *
 * `/partner` stays 302 on purpose: it is a convenience alias for invite links,
 * not a canonical move.
 */
export function staticRedirectLines(defaultLocale, locales) {
  return [
    `/    /${defaultLocale}    308`,
    ...locales.flatMap((l) => [`/${l}/check    /check    301`, `/${l}/check/*    /check/:splat    301`]),
    // The mirror of next.config's /partner rule: bare /partner goes to the
    // default locale, so an invite link without one still lands on the form.
    `/partner    /${defaultLocale}/partner    302`,
    // Trailing slash -> no slash, permanently (one and two path segments are
    // all the routes the export has).
    '/:a/    /:a    308',
    '/:a/:b/    /:a/:b    308',
    '',
  ]
}
