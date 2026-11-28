/**
 * GET/POST behaviour for /{locale}/afmelden, independent of Next.js so it
 * can be unit-tested. GET and HEAD never write. Only POST records an opt-out.
 */
import {
  resolveUnsubscribeDocument,
  unsubscribeViewFromVerification,
} from './unsubscribeDocumentStatus'
import { renderUnsubscribePage, type UnsubscribeView } from './unsubscribePage'
import type { OptOutSource, UnsubscribeStore } from './unsubscribeStore'
import {
  verifyUnsubscribeToken,
  type UnsubscribeLocale,
} from './unsubscribeToken'

export type UnsubscribeMethod = 'GET' | 'POST' | 'HEAD'

export type UnsubscribeRequest = {
  method: UnsubscribeMethod
  token: string
  locale: UnsubscribeLocale
  body: string
  contentType: string
  secret: string
  store: UnsubscribeStore
  now?: Date
}

export type UnsubscribeResponse = {
  status: number
  view: UnsubscribeView
  body: string
}

export type ParsedUnsubscribePost =
  | { kind: 'one-click' }
  | { kind: 'confirm'; token: string }
  | { kind: 'unknown' }

/**
 * RFC 8058 one-click body is exactly `List-Unsubscribe=One-Click`. A confirm
 * form posts `confirm=1` and a `token` field. Anything else is unknown.
 */
export function parseUnsubscribePost(body: string, contentType: string): ParsedUnsubscribePost {
  const trimmed = body.trim()
  if (trimmed === 'List-Unsubscribe=One-Click') return { kind: 'one-click' }

  const type = contentType.split(';', 1)[0]?.trim().toLowerCase() ?? ''
  const looksLikeForm =
    type === 'application/x-www-form-urlencoded' ||
    type === '' ||
    trimmed.includes('=')
  if (!looksLikeForm) return { kind: 'unknown' }

  const params = new URLSearchParams(trimmed)
  if (params.get('List-Unsubscribe') === 'One-Click') return { kind: 'one-click' }
  const token = params.get('token') ?? ''
  if (params.get('confirm') === '1' && token !== '') return { kind: 'confirm', token }
  return { kind: 'unknown' }
}

function page(
  locale: UnsubscribeLocale,
  view: UnsubscribeView,
  status: number,
  token?: string,
): UnsubscribeResponse {
  return {
    status,
    view,
    body: renderUnsubscribePage({ locale, view, ...(token ? { token } : {}) }),
  }
}

export async function handleUnsubscribeRequest(
  req: UnsubscribeRequest,
): Promise<UnsubscribeResponse> {
  const locale = req.locale
  const method = req.method

  if (method === 'GET' || method === 'HEAD') {
    const resolved = await resolveUnsubscribeDocument(req.token, req.secret)
    if (resolved.view !== 'confirm') {
      return page(locale, resolved.view, resolved.status)
    }
    return page(locale, 'confirm', 200, req.token)
  }

  const parsed = parseUnsubscribePost(req.body, req.contentType)
  const token = parsed.kind === 'confirm' && parsed.token !== '' ? parsed.token : req.token
  if (parsed.kind === 'unknown' || token === '') {
    return page(locale, 'invalid', 400)
  }

  const verified = await verifyUnsubscribeToken(token, req.secret)
  if (!verified.ok) {
    const resolved = unsubscribeViewFromVerification(verified)
    return page(locale, resolved.view, resolved.status)
  }

  const source: OptOutSource = parsed.kind === 'one-click' ? 'one-click' : 'confirm'
  const result = await req.store.record({
    emailHash: verified.emailHash,
    optedOutAt: (req.now ?? new Date()).toISOString(),
    source,
    locale,
    tokenVersion: 1,
  })
  if (result === 'unavailable') return page(locale, 'unavailable', 503)
  return page(locale, 'success', 200)
}
