/**
 * HTTP status for the human GET/HEAD /{locale}/afmelden document.
 *
 * The App Router page cannot set 400/503 itself, so middleware rewrites the
 * same URL with that status (OpenNext preserves rewriteStatusCode; the React
 * page and locale chrome still render). One-click POST already returns these
 * codes from the route handler.
 */
import {
  verifyUnsubscribeToken,
  type UnsubscribeVerifyResult,
} from './unsubscribeToken'

export type UnsubscribeDocumentResolution =
  | { view: 'confirm'; status: 200 }
  | { view: 'invalid'; status: 400 }
  | { view: 'unavailable'; status: 503 }

const DOCUMENT_PATH = /^\/(nl|en)\/afmelden\/?$/

export function unsubscribeViewFromVerification(
  verified: UnsubscribeVerifyResult,
): UnsubscribeDocumentResolution {
  if (verified.ok) return { view: 'confirm', status: 200 }
  return verified.reason === 'missing_secret'
    ? { view: 'unavailable', status: 503 }
    : { view: 'invalid', status: 400 }
}

export async function resolveUnsubscribeDocument(
  token: string,
  secret: string,
): Promise<UnsubscribeDocumentResolution> {
  const verified = await verifyUnsubscribeToken(token, secret)
  return unsubscribeViewFromVerification(verified)
}

/**
 * When the human document would be invalid or unavailable, the status to
 * attach via a same-URL middleware rewrite. Null means leave the response
 * as NextResponse.next() (valid confirm, or a path this does not own).
 */
export async function unsubscribeDocumentStatusRewrite(opts: {
  method: string
  pathname: string
  token: string
  secret: string
}): Promise<{ status: 400 | 503 } | null> {
  if (opts.method !== 'GET' && opts.method !== 'HEAD') return null
  if (!DOCUMENT_PATH.test(opts.pathname)) return null
  const resolved = await resolveUnsubscribeDocument(opts.token, opts.secret)
  if (resolved.status === 200) return null
  return { status: resolved.status }
}
