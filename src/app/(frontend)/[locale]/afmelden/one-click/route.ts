/**
 * RFC 8058 (and a non-action confirm POST) land here via middleware rewrite
 * from /{locale}/afmelden. Mail clients get a 2xx HTML body; they do not
 * need the site chrome. Humans who click the body link use the GET page.
 */
import type { NextRequest } from 'next/server'

import { applyUnsubscribeHeaders } from '@/lib/unsubscribeHeaders'
import { handleUnsubscribeRequest } from '@/lib/unsubscribeRequest'
import { readUnsubscribeTokenSecret } from '@/lib/unsubscribeSecret'
import { UnavailableUnsubscribeStore } from '@/lib/unsubscribeStore'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ locale: string }> }

function html(body: string, status: number): Response {
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'x-robots-tag': 'noindex, nofollow',
  })
  applyUnsubscribeHeaders(headers)
  return new Response(body, { status, headers })
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const raw = (await ctx.params).locale
  if (raw !== 'nl' && raw !== 'en') {
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } })
  }

  const token = new URL(req.url).searchParams.get('token') ?? ''
  const body = await req.text()
  const contentType = req.headers.get('content-type') ?? ''

  const lookup = await readUnsubscribeTokenSecret()
  const secret = lookup.state === 'present' ? lookup.secret : ''

  const result = await handleUnsubscribeRequest({
    method: 'POST',
    token,
    locale: raw,
    body,
    contentType,
    secret,
    store: new UnavailableUnsubscribeStore(),
  })
  return html(result.body, result.status)
}
