import { getBindings } from '@/lib/bindings'
import { TOKEN_RE } from '@/lib/leadlens'
import { DEMO_TOKEN, demoEnabled, demoScreenshotSvg } from '@/lib/leadlensDemo'

/**
 * Streams a lead's screenshot (uploaded by LeadLens) from the leadlens-checks
 * R2 bucket: /check/<token>/screenshot/desktop|mobile. Same
 * security-by-unguessable-URL model as the page itself; explicitly noindex.
 * Not part of the static export (the whole [token] segment is stashed).
 */
export const dynamic = 'force-dynamic'

const KINDS: Record<string, string> = {
  desktop: 'desktop.png',
  mobile: 'mobile.png',
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string; kind: string }> },
) {
  const { token, kind } = await ctx.params
  const file = KINDS[kind]
  if (!file) return new Response('Not found', { status: 404 })

  // Dev-only /check/demo preview: inline SVG placeholders instead of R2 objects.
  if (token === DEMO_TOKEN && demoEnabled()) {
    return new Response(demoScreenshotSvg(kind as 'desktop' | 'mobile'), {
      headers: { 'content-type': 'image/svg+xml', 'x-robots-tag': 'noindex, nofollow' },
    })
  }

  if (!TOKEN_RE.test(token)) return new Response('Not found', { status: 404 })

  const env = await getBindings()
  const object = await env.LEADLENS_CHECKS.get(`${token}/${file}`)
  if (!object) return new Response('Not found', { status: 404 })

  return new Response(object.body as ReadableStream, {
    headers: {
      'content-type': object.httpMetadata?.contentType ?? 'image/png',
      // Private: the URL embeds the per-lead token — keep it out of shared caches.
      'cache-control': 'private, max-age=3600',
      'x-robots-tag': 'noindex, nofollow',
      etag: object.httpEtag,
    },
  })
}
