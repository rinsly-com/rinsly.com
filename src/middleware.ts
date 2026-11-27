import { NextResponse, type NextRequest } from 'next/server'

import { unsubscribePostRewrite } from '@/lib/unsubscribePostRewrite'

export function middleware(req: NextRequest) {
  const rewrite = unsubscribePostRewrite({
    method: req.method,
    pathname: req.nextUrl.pathname,
    hasNextAction: req.headers.has('next-action') || req.headers.has('Next-Action'),
  })
  if (!rewrite) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = rewrite.rewritePath
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/nl/afmelden', '/en/afmelden', '/nl/afmelden/', '/en/afmelden/'],
}
