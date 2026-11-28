import { NextResponse, type NextRequest } from 'next/server'

import { unsubscribeBareRedirect } from '@/lib/unsubscribeBareRedirect'
import { unsubscribeDocumentStatusRewrite } from '@/lib/unsubscribeDocumentStatus'
import { applyUnsubscribeHeaders } from '@/lib/unsubscribeHeaders'
import { unsubscribePostRewrite } from '@/lib/unsubscribePostRewrite'
import { readUnsubscribeTokenSecret } from '@/lib/unsubscribeSecret'

export async function middleware(req: NextRequest) {
  const bare = unsubscribeBareRedirect(req.nextUrl.pathname)
  if (bare) {
    const url = req.nextUrl.clone()
    url.pathname = bare.pathname
    const res = NextResponse.redirect(url, 307)
    applyUnsubscribeHeaders(res.headers)
    return res
  }

  const rewrite = unsubscribePostRewrite({
    method: req.method,
    pathname: req.nextUrl.pathname,
    hasNextAction: req.headers.has('next-action') || req.headers.has('Next-Action'),
  })
  if (rewrite) {
    const url = req.nextUrl.clone()
    url.pathname = rewrite.rewritePath
    return NextResponse.rewrite(url)
  }

  const lookup = await readUnsubscribeTokenSecret()
  // `unknown` means this isolate could not read bindings and has no env
  // secret. Rewriting 503 would put that status on a confirm form the page
  // can still render when it does see the Worker secret. Intermediaries
  // may replace a 503 body, which hides the opt-out.
  const statusRewrite =
    lookup.state === 'unknown'
      ? null
      : await unsubscribeDocumentStatusRewrite({
          method: req.method,
          pathname: req.nextUrl.pathname,
          token: req.nextUrl.searchParams.get('token') ?? '',
          secret: lookup.state === 'present' ? lookup.secret : '',
        })
  if (statusRewrite) {
    // Same-URL rewrite so OpenNext (and Node after middleware) keep 400/503
    // on the document response. The App Router page cannot set these itself.
    return NextResponse.rewrite(req.nextUrl, { status: statusRewrite.status })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/nl/afmelden/:path*', '/en/afmelden/:path*', '/afmelden', '/afmelden/'],
}
