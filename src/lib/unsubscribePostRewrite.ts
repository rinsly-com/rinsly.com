/**
 * RFC 8058 posts to the public /{locale}/afmelden URL. The human page lives
 * at that path as a Next.js page (for the site header and footer), so POST
 * is rewritten to /{locale}/afmelden/one-click. Next.js server actions on
 * the confirm form also POST here; they are left alone.
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
