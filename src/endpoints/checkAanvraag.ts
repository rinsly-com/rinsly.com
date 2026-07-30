import type { PayloadHandler, PayloadRequest } from 'payload'

import { getRuntime } from '../lib/bindings'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Loose phone check: at least 8 digits once separators are stripped. */
function isPhone(value: string): boolean {
  return value.replace(/[^\d]/g, '').length >= 8
}

/** Accepts bare domains ("kapsalonjan.nl") and full URLs; stores a normalized URL. */
function normalizeUrl(value: string): string | null {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(candidate)
    if (!url.hostname.includes('.')) return null
    return url.href
  } catch {
    return null
  }
}

/**
 * Public website-check request from the generic /check page. Stores a row in
 * `check-aanvragen` (overrideAccess, since the collection's create is closed).
 * Includes a honeypot field (`bedrijfsnaam`, visually hidden on the form) —
 * when filled we pretend success without storing, same trick as /api/offerte.
 */
export const checkAanvraagHandler: PayloadHandler = async (req: PayloadRequest) => {
  let body: Record<string, unknown> = {}
  try {
    body = typeof req.json === 'function' ? ((await req.json()) as Record<string, unknown>) : {}
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400)
  }

  if (typeof body.bedrijfsnaam === 'string' && body.bedrijfsnaam.trim() !== '') {
    return json({ ok: true })
  }

  const url = normalizeUrl(String(body.url ?? '').trim())
  const naam = String(body.naam ?? '').trim()
  const telefoon = String(body.telefoon ?? '').trim()

  if (!url || !naam || !isPhone(telefoon)) {
    return json({ ok: false, error: 'validation' }, 422)
  }

  try {
    await req.payload.create({
      collection: 'check-aanvragen',
      data: { url, naam, telefoon },
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.error({
      msg: '[check-aanvraag] failed to store submission',
      err: err instanceof Error ? err.message : String(err),
    })
    return json({ ok: false, error: 'server' }, 500)
  }

  // Notify sales in the background; a mail failure never breaks the submission.
  const { waitUntil } = await getRuntime()
  waitUntil(
    req.payload
      .sendEmail({
        to: 'contact@rinsly.com',
        subject: `Nieuwe websitecheck-aanvraag: ${url}`,
        text: `Er is een nieuwe aanvraag binnengekomen via rinsly.com/check.\n\nWebsite: ${url}\nNaam: ${naam}\nTelefoon: ${telefoon}\n\nDe aanvraag staat ook in het admin-panel onder Websitecheck-aanvragen.`,
      })
      .catch((err: unknown) => {
        req.payload.logger.error({
          msg: '[check-aanvraag] notification mail failed',
          err: err instanceof Error ? err.message : String(err),
        })
      }),
  )

  return json({ ok: true })
}
