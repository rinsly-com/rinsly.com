import { NextResponse, type NextRequest } from 'next/server'

import { getBindings } from '@/lib/bindings'
import { readWorkerSecrets } from '@/lib/env'
import { unsubscribeDocumentStatusRewrite } from '@/lib/unsubscribeDocumentStatus'
import { applyUnsubscribeHeaders } from '@/lib/unsubscribeHeaders'
import { unsubscribePostRewrite } from '@/lib/unsubscribePostRewrite'

export async function middleware(req: NextRequest) {
  const rewrite = unsubscribePostRewrite({
    method: req.method,
    pathname: req.nextUrl.pathname,
    hasNextAction: req.headers.has('next-action') || req.headers.has('Next-Action'),
  })
  let res: NextResponse
  if (rewrite) {
    const url = req.nextUrl.clone()
    url.pathname = rewrite.rewritePath
    res = NextResponse.rewrite(url)
  } else {
    let secret = ''
    try {
      secret = readWorkerSecrets(await getBindings()).UNSUBSCRIBE_TOKEN_SECRET ?? ''
    } catch {
      secret = ''
    }
    if (!secret) secret = process.env.UNSUBSCRIBE_TOKEN_SECRET ?? ''
    const statusRewrite = await unsubscribeDocumentStatusRewrite({
      method: req.method,
      pathname: req.nextUrl.pathname,
      token: req.nextUrl.searchParams.get('token') ?? '',
      secret,
    })
    if (statusRewrite) {
      // Same-URL rewrite so OpenNext (and Node after middleware) keep 400/503
      // on the document response. The App Router page cannot set these itself.
      res = NextResponse.rewrite(req.nextUrl, { status: statusRewrite.status })
    } else {
      res = NextResponse.next()
    }
  }
  applyUnsubscribeHeaders(res.headers)
  return res
}

export const config = {
  matcher: ['/nl/afmelden/:path*', '/en/afmelden/:path*', '/afmelden', '/afmelden/'],
}
