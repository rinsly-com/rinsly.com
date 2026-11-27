/**
 * RFC 8058 and the human confirm form both POST to the public
 * /{locale}/afmelden URL. The human page lives at that path as a Next.js
 * page (for the site header and footer), so POST is rewritten to
 * /{locale}/afmelden/one-click. A Next.js server-action POST (Next-Action
 * header) is left alone if one ever appears; the confirm form itself is a
 * native method="post" form and must go through this rewrite.
 */
export function unsubscribePostRewrite(options: {
  method: string
  pathname: string
  hasNextAction: boolean
}): { locale: 'nl' | 'en'; rewritePath: string } | null {
  if (options.method.toUpperCase() !== 'POST' || options.hasNextAction) return null
  const match = options.pathname.match(/^\/(nl|en)\/afmelden\/?$/)
  if (!match || (match[1] !== 'nl' && match[1] !== 'en')) return null
  return { locale: match[1], rewritePath: `/${match[1]}/afmelden/one-click` }
}
