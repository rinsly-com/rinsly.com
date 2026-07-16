import type { PayloadHandler, PayloadRequest } from 'payload'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUBSCRIPTIONS = ['basis', 'onderhoud', 'opmaat']
const ADDITIONS = ['localization', 'email', 'design', 'seo', 'content', 'other']

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Public quote-request submission from the contact wizard. Stores a row in
 * `offertes` (overrideAccess, since the collection's create is closed). Includes
 * a honeypot field (`website`) — when filled we pretend success without storing.
 */
export const offerteHandler: PayloadHandler = async (req: PayloadRequest) => {
  let body: Record<string, unknown> = {}
  try {
    body = typeof req.json === 'function' ? ((await req.json()) as Record<string, unknown>) : {}
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400)
  }

  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true })
  }

  const bedrijf = String(body.bedrijf ?? '').trim()
  const naam = String(body.naam ?? '').trim()
  const email = String(body.email ?? '').trim()
  const subscription = String(body.subscription ?? '').trim()
  const additionsOther = String(body.additionsOther ?? '').trim()
  const bericht = String(body.bericht ?? '').trim()
  const additions = Array.isArray(body.additions)
    ? (body.additions as unknown[]).map(String).filter((v) => ADDITIONS.includes(v))
    : []

  if (!bedrijf || !naam || !EMAIL_RE.test(email) || !SUBSCRIPTIONS.includes(subscription)) {
    return json({ ok: false, error: 'validation' }, 422)
  }

  try {
    await req.payload.create({
      collection: 'offertes',
      data: {
        bedrijf,
        naam,
        email,
        subscription: subscription as 'basis' | 'onderhoud' | 'opmaat',
        additions: additions as ('localization' | 'email' | 'design' | 'seo' | 'content' | 'other')[],
        additionsOther: additions.includes('other') ? additionsOther || undefined : undefined,
        bericht: bericht || undefined,
      },
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.error({
      msg: '[offerte] failed to store submission',
      err: err instanceof Error ? err.message : String(err),
    })
    return json({ ok: false, error: 'server' }, 500)
  }

  // TODO: email the submission to contact@rinsly.com once Cloudflare Email is set up.
  return json({ ok: true })
}
