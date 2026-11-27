/**
 * /nl/afmelden and /en/afmelden — marketing mail unsubscribe.
 *
 * GET/HEAD show a confirm page and never write. POST records the opt-out
 * (the confirm form, or RFC 8058 `List-Unsubscribe=One-Click`). The public
 * rinsly.com site is a static export with no runtime, so this route is
 * stashed during `build:static` and must be zone-routed to rinsly-accp
 * (same dashboard step as /check/*). See docs/marketing-unsubscribe.md.
 */
import type { NextRequest } from 'next/server'

import { getBindings } from '@/lib/bindings'
import { readWorkerSecrets } from '@/lib/env'
import { handleUnsubscribeRequest, type UnsubscribeMethod } from '@/lib/unsubscribeRequest'
import { UnavailableUnsubscribeStore } from '@/lib/unsubscribeStore'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ locale: string }> }

function html(body: string, status: number, method: string): Response {
  return new Response(method === 'HEAD' ? null : body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'referrer-policy': 'no-referrer',
    },
  })
}

async function handle(req: NextRequest, ctx: Ctx): Promise<Response> {
  const { locale: raw } = await ctx.params
  if (raw !== 'nl' && raw !== 'en') {
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } })
  }

  const rawMethod = req.method.toUpperCase()
  if (rawMethod !== 'GET' && rawMethod !== 'POST' && rawMethod !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD, POST' } })
  }
  const method: UnsubscribeMethod = rawMethod

  const token = new URL(req.url).searchParams.get('token') ?? ''
  const body = method === 'POST' ? await req.text() : ''
  const contentType = req.headers.get('content-type') ?? ''

  let secret = ''
  try {
    const env = await getBindings()
    secret = readWorkerSecrets(env).UNSUBSCRIBE_TOKEN_SECRET ?? ''
  } catch {
    secret = ''
  }

  const result = await handleUnsubscribeRequest({
    method,
    token,
    locale: raw,
    body,
    contentType,
    secret,
    store: new UnavailableUnsubscribeStore(),
  })
  return html(result.body, result.status, method)
}

export function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx)
}

export function POST(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx)
}

export function HEAD(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx)
}
