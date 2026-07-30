import type { PayloadHandler, PayloadRequest } from 'payload'

import { getRuntime } from '../lib/bindings'
import { generateToken, normalizeCheckUrl, readRunStatus, runSiteCheck } from '../lib/siteCheck'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Five self-service scans per IP per day; staff and allowlisted IPs are exempt. */
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 24 * 3600_000

function clientIp(req: PayloadRequest): string | undefined {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]
  return ip?.trim() || undefined
}

async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`rinsly-check:${ip}`))
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Comma-separated IPs in the CHECK_RATE_EXEMPT_IPS secret skip the limit. */
function isExemptIp(ip: string | undefined, env: CloudflareEnv): boolean {
  if (!ip) return false
  const raw = (env as unknown as Record<string, string | undefined>).CHECK_RATE_EXEMPT_IPS
  if (!raw) return false
  return raw.split(',').map((v) => v.trim()).filter(Boolean).includes(ip)
}

/**
 * POST /api/check-run — start a self-service website check. Validates the
 * domain, rate-limits per IP (via the check-runs collection), stores a run row
 * for sales, kicks the pipeline off in the background (waitUntil) and returns
 * the token the client polls + eventually navigates to.
 */
export const checkRunStartHandler: PayloadHandler = async (req: PayloadRequest) => {
  let body: Record<string, unknown> = {}
  try {
    body = typeof req.json === 'function' ? ((await req.json()) as Record<string, unknown>) : {}
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400)
  }

  // Honeypot, same trick as the other public forms.
  if (typeof body.bedrijfsnaam === 'string' && body.bedrijfsnaam.trim() !== '') {
    return json({ ok: true, token: generateToken() })
  }

  const url = normalizeCheckUrl(String(body.url ?? ''))
  if (!url) return json({ ok: false, error: 'validation' }, 422)

  const { env, waitUntil } = await getRuntime()

  // Logged-in staff (accp admin session) and allowlisted IPs are never limited.
  const ip = clientIp(req)
  const exempt = Boolean(req.user) || isExemptIp(ip, env)
  const ipHash = ip ? await hashIp(ip) : undefined
  if (!exempt && ipHash) {
    const recent = await req.payload.count({
      collection: 'check-runs',
      where: {
        ipHash: { equals: ipHash },
        createdAt: { greater_than: new Date(Date.now() - RATE_WINDOW_MS).toISOString() },
      },
      overrideAccess: true,
    })
    if (recent.totalDocs >= RATE_LIMIT) return json({ ok: false, error: 'rate_limited' }, 429)
  }

  const token = generateToken()
  const domain = url.hostname.replace(/^www\./, '')

  try {
    await req.payload.create({
      collection: 'check-runs',
      data: { domain, token, ipHash },
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.error({
      msg: '[check-run] failed to store run',
      err: err instanceof Error ? err.message : String(err),
    })
    return json({ ok: false, error: 'server' }, 500)
  }

  waitUntil(
    runSiteCheck({
      bucket: env.LEADLENS_CHECKS,
      token,
      url,
      psiApiKey:
        (env as unknown as Record<string, string | undefined>).PSI_API_KEY ||
        process.env.PSI_API_KEY ||
        undefined,
    }),
  )

  req.payload.logger.info({ msg: '[check-run] started', domain, token })
  return json({ ok: true, token })
}

/** GET /api/check-run/status?token=… — progress for the /check progress UI. */
export const checkRunStatusHandler: PayloadHandler = async (req: PayloadRequest) => {
  const token = req.query?.token
  if (typeof token !== 'string' || !/^[A-Za-z0-9]{16,64}$/.test(token)) {
    return json({ ok: false, error: 'validation' }, 422)
  }
  const { env } = await getRuntime()
  const status = await readRunStatus(env.LEADLENS_CHECKS, token)
  if (!status) return json({ ok: false, error: 'not_found' }, 404)
  return json({ ok: true, status })
}
