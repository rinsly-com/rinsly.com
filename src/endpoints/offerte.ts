import type { PayloadHandler, PayloadRequest } from 'payload'
import { z } from 'zod'

import { getRuntime } from '../lib/bindings'
import { asJsonObject, asText, readRequestJson } from '../lib/json'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUBSCRIPTIONS = ['care', 'beheerd', 'partner', 'opmaat'] as const
const ADDITIONS = ['localization', 'email', 'design', 'seo', 'content', 'other'] as const

const text = z.unknown().optional().transform((value) => asText(value))
const addition = z.enum(ADDITIONS)
const subscription = z.enum(SUBSCRIPTIONS)

const offerteSchema = z.object({
  website: z.unknown().optional(),
  bedrijf: text,
  naam: text,
  email: text,
  subscription: text,
  additionsOther: text,
  bericht: text,
  additions: z.unknown().optional().transform((value) => {
    if (!Array.isArray(value)) return []
    return value.flatMap((item) => {
      const parsed = addition.safeParse(String(item))
      return parsed.success ? [parsed.data] : []
    })
  }),
})

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
  const raw = await readRequestJson(req)
  if (!raw.ok) return json({ ok: false, error: 'invalid_body' }, 400)
  if (asJsonObject(raw.value) === null) return json({ ok: false, error: 'invalid_body' }, 400)
  const parsed = offerteSchema.safeParse(raw.value)
  if (!parsed.success) return json({ ok: false, error: 'invalid_body' }, 400)
  const body = parsed.data

  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true })
  }

  const { bedrijf, naam, email, additionsOther, bericht, additions } = body
  const chosen = subscription.safeParse(body.subscription)
  if (!bedrijf || !naam || !EMAIL_RE.test(email) || !chosen.success) {
    return json({ ok: false, error: 'validation' }, 422)
  }

  try {
    await req.payload.create({
      collection: 'offertes',
      data: {
        bedrijf,
        naam,
        email,
        subscription: chosen.data,
        additions,
        ...(additions.includes('other') && additionsOther ? { additionsOther } : {}),
        ...(bericht ? { bericht } : {}),
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

  // Notify sales in the background; a mail failure never breaks the submission.
  const { waitUntil } = await getRuntime()
  waitUntil(
    req.payload
      .sendEmail({
        to: 'contact@rinsly.com',
        subject: `Nieuwe offerteaanvraag: ${bedrijf}`,
        text: `Er is een nieuwe offerteaanvraag binnengekomen via de contactwizard.\n\nBedrijf: ${bedrijf}\nNaam: ${naam}\nE-mail: ${email}\nAbonnement: ${chosen.data}\n${bericht ? `\nBericht:\n${bericht}\n` : ''}\nDe aanvraag staat ook in het admin-panel onder Offerteaanvragen.`,
      })
      .catch((err: unknown) => {
        req.payload.logger.error({
          msg: '[offerte] notification mail failed',
          err: err instanceof Error ? err.message : String(err),
        })
      }),
  )

  return json({ ok: true })
}
