import type { PayloadRequest } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PARTNER } from '../../src/lib/contentRefactor/copy'
import { formRatePctV33, legacyDutiesFromV33, partnerFormCopyV33 } from '../../src/lib/partnerLadder'

const runtimeEnv: Record<string, unknown> = {}

vi.mock('../../src/lib/bindings', () => ({
  getRuntime: () =>
    Promise.resolve({
      env: runtimeEnv,
      waitUntil: (task: Promise<unknown>) => {
        void task.catch(() => undefined)
      },
    }),
}))

vi.mock('../../src/lib/partnerToken', () => ({
  verifyPartnerToken: () => Promise.resolve({ ok: true, payload: { d: 'studio.nl', n: 'Studio', c: 'Utrecht', l: 'nl' } }),
}))

const { partnerAanvraagHandler, partnerPendingHandler } = await import('../../src/endpoints/partnerAanvraag')

type Data = Record<string, unknown>

function request(body: unknown, docs: Data[] = []) {
  const create = vi.fn((_input: { data: Data }) => Promise.resolve({ id: 1 }))
  const sendEmail = vi.fn((_input: { subject: string; text: string }) => Promise.resolve(undefined))
  const req = {
    json: () => Promise.resolve(body),
    headers: new Headers({ authorization: 'Bearer pull-secret' }),
    payload: {
      find: vi.fn(() => Promise.resolve({ docs })),
      create,
      update: vi.fn(() => Promise.resolve({})),
      sendEmail,
      logger: { error: vi.fn(), info: vi.fn() },
    },
  } as unknown as PayloadRequest
  return { req, create, sendEmail }
}

async function pending(res: Response): Promise<{ applications: Data[] }> {
  const body: unknown = await res.json()
  return body as { applications: Data[] }
}

const application = { token: 'invite', email: 'studio@example.nl', bedrijfsnaam: 'Studio' }

beforeEach(() => {
  runtimeEnv.PARTNER_TOKEN_SECRET = 'token-secret'
  runtimeEnv.LEDGER_PULL_SECRET = 'pull-secret'
})

describe('partner form v3.3', () => {
  it('starting rate: base 10, +10 per chosen rung (volume is measured later)', () => {
    expect(formRatePctV33({ eersteLijn: false, verkoop: false })).toBe(10)
    expect(formRatePctV33({ eersteLijn: true, verkoop: false })).toBe(20)
    expect(formRatePctV33({ eersteLijn: true, verkoop: true })).toBe(30)
  })

  it('copy is the cleared PA-05 / PA-06 text, no old ladder', () => {
    for (const locale of ['nl', 'en'] as const) {
      const copy = partnerFormCopyV33(locale)
      expect(copy.rungs.map((rung) => rung.title)).toEqual([PARTNER.rungBase[locale], PARTNER.rungFirstLine[locale], PARTNER.rungSales[locale], PARTNER.rungVolume[locale]])
      expect(copy.caveat).toBe(PARTNER.caveat[locale])
      expect(copy.base).toBe(PARTNER.base[locale])
      expect(copy.rungs.filter((rung) => rung.field).map((rung) => rung.field)).toEqual(['eersteLijn', 'verkoop'])
      const all = JSON.stringify(copy)
      expect(all).not.toMatch(/[Ee]xclusiv|Relatiebeheer|Relationship|De basis is 0%|The base is 0%|€25\.000|€25,000/)
    }
  })

  it('old duty answers for Ledger: first line → relatiebeheer, sales → marketing, never exclusiviteit', () => {
    expect(legacyDutiesFromV33({ eersteLijn: true, verkoop: false })).toEqual({ exclusiviteit: false, relatiebeheer: true, marketing: false })
    expect(legacyDutiesFromV33({ eersteLijn: false, verkoop: true })).toEqual({ exclusiviteit: false, relatiebeheer: false, marketing: true })
  })
})

describe('POST /api/partner-aanvraag', () => {
  it('stores eersteLijn / verkoop and the derived old answers', async () => {
    const { req, create } = request({ ...application, eersteLijn: true, verkoop: 'on' })
    const res = await partnerAanvraagHandler(req)
    expect(res.status).toBe(200)
    const data = create.mock.calls[0][0].data
    expect(data).toMatchObject({ eersteLijn: true, verkoop: true, exclusiviteit: false, relatiebeheer: true, marketing: true, domein: 'studio.nl' })
  })

  it('ignores old duty keys from a cached client', async () => {
    const { req, create } = request({ ...application, exclusiviteit: true, relatiebeheer: true, marketing: true })
    await partnerAanvraagHandler(req)
    expect(create.mock.calls[0][0].data).toMatchObject({ eersteLijn: false, verkoop: false, exclusiviteit: false, relatiebeheer: false, marketing: false })
  })
})

describe('GET /api/partner-aanvraag/pending', () => {
  it('carries the new fields next to the three old ones (Ledger compatibility)', async () => {
    const row = {
      id: 7,
      domein: 'studio.nl',
      bedrijfsnaam: 'Studio',
      email: 'studio@example.nl',
      eersteLijn: true,
      verkoop: false,
      exclusiviteit: false,
      relatiebeheer: true,
      marketing: false,
      status: 'new',
    }
    const { req } = request(undefined, [row])
    const res = await partnerPendingHandler(req)
    const body = await pending(res)
    expect(body.applications[0]).toMatchObject({ eersteLijn: true, verkoop: false, exclusiviteit: false, relatiebeheer: true, marketing: false })
  })

  it('an old row without the new columns still passes', async () => {
    const { req } = request(undefined, [{ id: 8, domein: 'old.nl', bedrijfsnaam: 'Old', email: 'o@example.nl', exclusiviteit: true, eersteLijn: null, verkoop: null }])
    const body = await pending(await partnerPendingHandler(req))
    expect(body.applications).toHaveLength(1)
  })
})

describe('partner notification mail', () => {
  it('strips control characters from every applicant value; the note keeps its line breaks', async () => {
    const { req, sendEmail } = request({
      ...application,
      bedrijfsnaam: 'Studio\r\nBcc: evil@example.com',
      contactpersoon: 'Ada\u0000\u2028Lovelace',
      telefoon: '06\u0085123',
      branches: 'kapper\u001B[31m',
      opmerking: 'regel 1\r\nregel 2\u0007',
    })
    await partnerAanvraagHandler(req)
    const mail = sendEmail.mock.calls[0][0]
    expect(mail.subject).toBe('Partneraanvraag: StudioBcc: evil@example.com')
    expect(mail.subject).not.toMatch(/[\r\n]/)
    expect(mail.text).toContain('StudioBcc: evil@example.com (studio.nl) heeft het partnerformulier ingevuld.')
    expect(mail.text).toContain('Contact:      AdaLovelace\n')
    expect(mail.text).toContain('Telefoon:     06123\n')
    expect(mail.text).toContain('Opmerking:\nregel 1\nregel 2\n')
    expect(mail.text.replace(/\n/g, '')).not.toMatch(/[\u0000-\u001F\u007F\u0085\u2028\u2029]/u)
  })
})

