import { NextResponse, type NextRequest } from 'next/server'

import { applyUnsubscribeHeaders } from '@/lib/unsubscribeHeaders'
import { unsubscribePostRewrite } from '@/lib/unsubscribePostRewrite'

export function middleware(req: NextRequest) {
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
    res = NextResponse.next()
  }
  applyUnsubscribeHeaders(res.headers)
  return res
}

export const config = {
  matcher: ['/nl/afmelden/:path*', '/en/afmelden/:path*'],
}
