import type { PayloadHandler, PayloadRequest } from 'payload'
import { z } from 'zod'

import { getRuntime } from '../lib/bindings'
import { readWorkerSecrets } from '../lib/env'
import { asJsonObject, asText, readRequestJson } from '../lib/json'
import { logCaught } from '../lib/logCaught'
import { verifyPartnerToken } from '../lib/partnerToken'
import { partnerRowSchema } from '../lib/rows'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

const str = (v: unknown, max = 200): string => asText(v, max)
const bool = (v: unknown): boolean => v === true || v === 'true' || v === 'on' || v === 1
const text = (max = 200) => z.unknown().optional().transform((value) => str(value, max))
const flag = z.unknown().optional().transform((value) => bool(value))

const partnerBodySchema = z.object({
  website: z.unknown().optional(),
  token: text(1024),
  email: text(),
  bedrijfsnaam: text(),
  contactpersoon: text(),
  telefoon: text(40),
  adres: text(),
  plaats: text(80),
  kvk: text(40),
  btwNummer: text(40),
  exclusiviteit: flag,
  relatiebeheer: flag,
  marketing: flag,
  // Kept for older clients, and no longer collected: accepted on purpose, never written.
  figmaSeat: flag,
  branches: text(400),
  talen: text(100),
  landen: text(100),
  opmerking: text(2000),
})

const interesseSchema = z.object({
  honeypot: z.unknown().optional(),
  email: text(),
  bedrijfsnaam: text(),
  domein: text(253),
  contactpersoon: text(),
  telefoon: text(40),
  // Kept for older clients, and no longer collected: accepted on purpose, never written.
  figmaSeat: flag,
  bouwtZelf: flag,
  verkooptHosting: flag,
  opmerking: text(2000),
})

const markSchema = z.object({
  id: z.union([z.string(), z.number()]),
  status: z.enum(['imported', 'declined']),
})

const verifyTokenSchema = z.string().max(1024)

/** Loose e-mail check: something, an @, something with a dot. */
function isEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

/** Normalise 'Kapper, Restaurant ;horeca' → 'kapper,restaurant,horeca'. */
function slugList(value: string, max = 12): string {
  return [
    ...new Set(
      value
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
    .slice(0, max)
    .join(',')
}

async function secret(): Promise<string> {
  const { env } = await getRuntime()
  return readWorkerSecrets(env).PARTNER_TOKEN_SECRET ?? ''
}

/**
 * GET /api/partner-aanvraag/verify?token=… — is this invite link still good?
 *
 * The /partner page calls this before rendering the form, so an expired or
 * tampered link shows a friendly "vraag een nieuwe link aan" instead of a form
 * that fails on submit. It returns the prefill from inside the token; no
 * database is touched, because the token carries its own contents.
 */
export const partnerVerifyHandler: PayloadHandler = async (req: PayloadRequest) => {
  const token = verifyTokenSchema.safeParse(req.query['token'])
  if (!token.success) return json({ ok: false, reason: 'malformed' }, 400)
  const result = await verifyPartnerToken(token.data, await secret())
  if (!result.ok) return json({ ok: false, reason: result.reason }, 200)
  return json({
    ok: true,
    prefill: {
      domein: result.payload.d,
      bedrijfsnaam: result.payload.n,
      plaats: result.payload.c ?? '',
      land: result.payload.l ?? 'nl',
    },
  })
}

/**
 * POST /api/partner-aanvraag — a recruited studio configuring itself.
 *
 * The token is the authorisation: it proves the invite came from us and says
 * which studio it was for. The domain is taken from the *token*, never from the
 * body, so a valid link cannot be replayed to file an application on behalf of
 * someone else.
 *
 * What they submit is an application. The chosen responsibilities decide the
 * commission rate, so nothing here commits Rinsly to anything — Ledger's review
 * queue is where a human turns it into a tenant.
 */
export const partnerAanvraagHandler: PayloadHandler = async (req: PayloadRequest) => {
  const raw = await readRequestJson(req)
  if (!raw.ok) return json({ ok: false, error: 'invalid_body' }, 400)
  if (asJsonObject(raw.value) === null) return json({ ok: false, error: 'invalid_body' }, 400)
  const parsed = partnerBodySchema.safeParse(raw.value)
  if (!parsed.success) return json({ ok: false, error: 'invalid_body' }, 400)
  const body = parsed.data

  // Honeypot, visually hidden on the form. Same trick as /api/offerte: pretend
  // it worked so a bot has nothing to learn from the response.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true })
  }

  const verified = await verifyPartnerToken(body.token, await secret())
  if (!verified.ok) {
    return json({ ok: false, error: 'token', reason: verified.reason }, 403)
  }

  const email = body.email
  const bedrijfsnaam = body.bedrijfsnaam || verified.payload.n
  if (!isEmail(email) || !bedrijfsnaam) {
    return json({ ok: false, error: 'validation' }, 422)
  }

  const data = {
    // From the token, not the body — this is the anti-replay bit.
    domein: verified.payload.d,
    bedrijfsnaam,
    contactpersoon: body.contactpersoon,
    email,
    telefoon: body.telefoon,
    adres: body.adres,
    plaats: body.plaats || (verified.payload.c ?? ''),
    kvk: body.kvk,
    btwNummer: body.btwNummer,
    exclusiviteit: body.exclusiviteit,
    relatiebeheer: body.relatiebeheer,
    marketing: body.marketing,
    branches: slugList(body.branches),
    talen: slugList(body.talen, 8) || (verified.payload.l ?? 'nl'),
    landen: slugList(body.landen, 8) || (verified.payload.l ?? 'nl'),
    opmerking: body.opmerking,
    status: 'new' as const,
  }

  try {
    // One application per domain: re-submitting replaces the previous answer
    // rather than filling the queue with drafts of the same studio.
    const existing = await req.payload.find({
      collection: 'partner-aanvragen',
      where: { and: [{ domein: { equals: data.domein } }, { status: { equals: 'new' } }] },
      limit: 1,
      overrideAccess: true,
    })
    const previous = existing.docs[0] as (typeof existing.docs)[number] | undefined
    const row = previous === undefined ? undefined : partnerRowSchema.safeParse(previous)
    if (row && !row.success) {
      logCaught('[partner-aanvraag] stored application failed validation', row.error)
      return json({ ok: false, error: 'server' }, 500)
    }
    if (row?.success) {
      await req.payload.update({
        collection: 'partner-aanvragen',
        id: row.data.id,
        data,
        overrideAccess: true,
      })
    } else {
      await req.payload.create({ collection: 'partner-aanvragen', data, overrideAccess: true })
    }
  } catch (err) {
    req.payload.logger.error({
      msg: '[partner-aanvraag] failed to store application',
      err: err instanceof Error ? err.message : String(err),
    })
    return json({ ok: false, error: 'server' }, 500)
  }

  const chosen =
    [
      data.exclusiviteit && 'exclusiviteit',
      data.relatiebeheer && 'relatiebeheer',
      data.marketing && 'marketing',
    ]
      .filter(Boolean)
      .join(', ') || 'geen: alleen aangemeld'

  // Tell Rinsly in the background; a mail failure never costs the application.
  const { waitUntil } = await getRuntime()
  waitUntil(
    req.payload
      .sendEmail({
        to: 'yaron@rinsly.com',
        subject: `Partneraanvraag: ${data.bedrijfsnaam}`,
        text:
          `${data.bedrijfsnaam} (${data.domein}) heeft het partnerformulier ingevuld.\n\n` +
          `Contact:      ${data.contactpersoon || ','}\n` +
          `E-mail:       ${data.email}\n` +
          `Telefoon:     ${data.telefoon || ','}\n` +
          `Plaats:       ${data.plaats || ','}\n` +
          `KvK:          ${data.kvk || ','}\n\n` +
          `Wil oppakken: ${chosen}\n` +
          `Branches:     ${data.branches || 'alle'}\n` +
          `Talen:        ${data.talen}\n` +
          `Landen:       ${data.landen}\n\n` +
          (data.opmerking ? `Opmerking:\n${data.opmerking}\n\n` : '') +
          `Haal 'm binnen met \`ledger partners --pull\` en bekijk 'm onder [8] Tenants.\n` +
          `Let op: dit is een aanvraag, geen afspraak: het tarief staat pas vast als jij het contract maakt.`,
      })
      .catch((err: unknown) => {
        req.payload.logger.error({
          msg: '[partner-aanvraag] notification mail failed',
          err: err instanceof Error ? err.message : String(err),
        })
      }),
  )

  return json({ ok: true })
}

/* ── the Ledger side ─────────────────────────────────────────────────────── */

/**
 * Ledger runs on a laptop against a local SQLite file; this site runs on a
 * Worker against D1. Neither can write to the other, so applications are
 * **pulled**: Ledger asks for what is new, imports it, then says so.
 *
 * Guarded by a bearer secret rather than a Payload login, because the caller is
 * a CLI on Yaron's machine, not a person with a session.
 */
async function authorised(req: PayloadRequest): Promise<boolean> {
  const { env } = await getRuntime()
  const expected = readWorkerSecrets(env).LEDGER_PULL_SECRET ?? ''
  if (!expected) return false
  const header = req.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''
  // Length-safe compare; both sides are short and this is not a timing oracle
  // worth optimising, but constant time costs nothing here.
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

/** GET /api/partner-aanvraag/pending — applications Ledger has not imported yet. */
export const partnerPendingHandler: PayloadHandler = async (req: PayloadRequest) => {
  if (!(await authorised(req))) return json({ ok: false, error: 'unauthorized' }, 401)
  const result = await req.payload.find({
    collection: 'partner-aanvragen',
    where: { status: { equals: 'new' } },
    sort: 'createdAt',
    limit: 200,
    overrideAccess: true,
  })
  const applications = []
  for (const doc of result.docs) {
    if (partnerRowSchema.safeParse(doc).success) {
      applications.push(doc)
      continue
    }
    console.error('[partner-aanvraag] pending_row_skipped invalid_row')
  }
  return json({ ok: true, applications })
}

/**
 * POST /api/partner-aanvraag/mark — { id, status: 'imported' | 'declined' }.
 *
 * Ledger calls this after it has actually created the tenant, so an application
 * only leaves the queue once it exists on the other side. If the call fails, it
 * simply shows up in the next pull — importing twice is caught by Ledger's own
 * unique slug, which is a better failure than dropping one silently.
 */
export const partnerMarkHandler: PayloadHandler = async (req: PayloadRequest) => {
  if (!(await authorised(req))) return json({ ok: false, error: 'unauthorized' }, 401)
  const raw = await readRequestJson(req)
  if (!raw.ok) return json({ ok: false, error: 'invalid_body' }, 400)
  if (asJsonObject(raw.value) === null) return json({ ok: false, error: 'invalid_body' }, 400)
  const parsed = markSchema.safeParse(raw.value)
  if (!parsed.success) return json({ ok: false, error: 'validation' }, 422)
  try {
    await req.payload.update({
      collection: 'partner-aanvragen',
      id: parsed.data.id,
      data: { status: parsed.data.status },
      overrideAccess: true,
    })
  } catch (err) {
    logCaught('[partner-aanvraag] mark failed', err)
    return json({ ok: false, error: 'not_found' }, 404)
  }
  return json({ ok: true })
}

/**
 * POST /api/partner-interesse — a studio that found Rinsly by itself.
 *
 * The sibling `partnerAanvraagHandler` is deliberately token-gated: it is the
 * configurator a *recruited* studio fills in, and the domain comes from the
 * signed link rather than the body so a link cannot be replayed. That leaves no
 * route for a studio that simply arrived on /contact, which is what this is.
 *
 * It writes the same `partner-aanvragen` collection so there is one review
 * queue, and marks itself in `opmerking` as self-reported. Two deliberate
 * differences from the invited flow:
 *
 * - `domein` comes from the body (their own website), so it is NOT evidence of
 *   anything. Treat these rows as leads to qualify, not as verified studios.
 * - Two answers decide whether there is a deal at all: whether they build
 *   sites themselves, and whether they already sell hosting. They are asked
 *   here rather than on the first call, and both go into `opmerking` until
 *   the collection grows columns for them (see FACILITATOR-MIGRATION.md).
 *   `figmaSeat` stays on the request schema so an older client is accepted,
 *   not rejected. The value is never written. The column stays for older
 *   applications.
 */
export const partnerInteresseHandler: PayloadHandler = async (req: PayloadRequest) => {
  const raw = await readRequestJson(req)
  if (!raw.ok) return json({ ok: false, error: 'invalid_body' }, 400)
  if (asJsonObject(raw.value) === null) return json({ ok: false, error: 'invalid_body' }, 400)
  const parsed = interesseSchema.safeParse(raw.value)
  if (!parsed.success) return json({ ok: false, error: 'invalid_body' }, 400)
  const body = parsed.data

  // Honeypot. Note the field is `honeypot` here, not `website`: a studio's own
  // website is a real, wanted answer on this form.
  if (typeof body.honeypot === 'string' && body.honeypot.trim() !== '') {
    return json({ ok: true })
  }

  const email = body.email
  const bedrijfsnaam = body.bedrijfsnaam
  const domein = body.domein.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase()
  if (!isEmail(email) || !bedrijfsnaam || !domein) {
    return json({ ok: false, error: 'validation' }, 422)
  }

  const bouwtZelf = body.bouwtZelf
  const verkooptHosting = body.verkooptHosting
  const note = body.opmerking

  // Until the collection has its own columns, the qualifying answers live in
  // the note — prefixed so they are impossible to miss in the review queue.
  const opmerking = [
    'Zelf aangemeld via /contact.',
    `Bouwt zelf websites: ${bouwtZelf ? 'JA' : 'nee'}.`,
    `Verkoopt zelf hosting: ${verkooptHosting ? 'JA' : 'nee'}.`,
    note && `\n${note}`,
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 2000)

  const data = {
    domein,
    bedrijfsnaam,
    contactpersoon: body.contactpersoon,
    email,
    telefoon: body.telefoon,
    opmerking,
    status: 'new' as const,
  }

  try {
    // One open application per domain, same as the invited flow: a second
    // submission replaces the first rather than filling the queue.
    const existing = await req.payload.find({
      collection: 'partner-aanvragen',
      where: { and: [{ domein: { equals: domein } }, { status: { equals: 'new' } }] },
      limit: 1,
      overrideAccess: true,
    })
    const previous = existing.docs[0] as (typeof existing.docs)[number] | undefined
    const row = previous === undefined ? undefined : partnerRowSchema.safeParse(previous)
    if (row && !row.success) {
      logCaught('[partner-interesse] stored application failed validation', row.error)
      return json({ ok: false, error: 'server' }, 500)
    }
    if (row?.success) {
      await req.payload.update({
        collection: 'partner-aanvragen',
        id: row.data.id,
        data,
        overrideAccess: true,
      })
    } else {
      await req.payload.create({ collection: 'partner-aanvragen', data, overrideAccess: true })
    }
  } catch (err) {
    req.payload.logger.error({ err }, 'partner-interesse: could not store application')
    return json({ ok: false, error: 'server' }, 500)
  }

  return json({ ok: true })
}
