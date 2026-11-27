import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PayloadRequest } from 'payload'

import { checkAanvraagHandler } from '../../src/endpoints/checkAanvraag'
import { offerteHandler } from '../../src/endpoints/offerte'
import { EMAIL_CONSENT_TEXT } from '../../src/lib/emailConsent'

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

const NOW = new Date('2026-11-26T13:50:00.000Z')
const CLIENT_TIME = '1999-01-01T00:00:00.000Z'
const CLIENT_TEXT = 'The client wrote this sentence'

type CreateArg = { collection: string; data: Record<string, unknown> }

function request(body: unknown) {
  const create = vi.fn((_input: CreateArg) => Promise.resolve({ id: 1 }))
  const sendEmail = vi.fn((_input: { text?: string }) => Promise.resolve(undefined))
  const req = {
    json: () => Promise.resolve(body),
    payload: {
      create,
      sendEmail,
      logger: { error: vi.fn() },
    },
  } as unknown as PayloadRequest
  return { req, create, sendEmail }
}

function stored(create: ReturnType<typeof request>['create']): Record<string, unknown> {
  return create.mock.calls[0][0].data
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  delete runtimeEnv.RINSLY_KVK_COLLECTION_ENABLED
  vi.stubEnv('RINSLY_KVK_COLLECTION_ENABLED', '')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('checkAanvraagHandler consent', () => {
  const lead = { url: 'https://example.nl', naam: 'Ada', telefoon: '0612345678' }

  it('ignores every client consent field and does not store consent columns', async () => {
    for (const extra of [
      {
        emailConsent: true,
        locale: 'en',
        consentGiven: true,
        consentAt: CLIENT_TIME,
        consentText: CLIENT_TEXT,
      },
      { consentGiven: true, consentAt: CLIENT_TIME, consentText: CLIENT_TEXT },
      { emailConsent: 'true' },
      { emailConsent: 1 },
    ]) {
      const { req, create } = request({ ...lead, ...extra })
      const res = await checkAanvraagHandler(req)
      expect(res.status).toBe(200)
      const data = stored(create)
      expect(data).not.toHaveProperty('consentGiven')
      expect(data).not.toHaveProperty('consentAt')
      expect(data).not.toHaveProperty('consentText')
      expect(data.url).toBe('https://example.nl/')
      expect(data.naam).toBe('Ada')
    }
  })
})

describe('offerteHandler consent', () => {
  const quote = {
    bedrijf: 'Studio',
    naam: 'Ada',
    email: 'ada@example.nl',
    subscription: 'care',
    b2bConfirmed: true,
    kvkNummer: '12345678',
  }

  it('stores the server clock and the Dutch sentence, ignoring client consent fields', async () => {
    const { req, create } = request({
      ...quote,
      emailConsent: true,
      locale: 'nl',
      consentGiven: true,
      consentAt: CLIENT_TIME,
      consentText: CLIENT_TEXT,
    })

    const res = await offerteHandler(req)
    expect(res.status).toBe(200)
    expect(stored(create)).toMatchObject({
      consentGiven: true,
      consentAt: NOW.toISOString(),
      consentText: EMAIL_CONSENT_TEXT.nl,
    })
    expect(stored(create).consentAt).not.toBe(CLIENT_TIME)
    expect(stored(create).consentText).not.toBe(CLIENT_TEXT)
    expect(stored(create).b2bConfirmed).toBe(true)
    expect(stored(create)).not.toHaveProperty('kvkNummer')
  })

  it('ignores a consentGiven-only payload and non-boolean emailConsent', async () => {
    for (const emailConsent of [undefined, 'true', 1, 'on']) {
      const { req, create } = request({
        ...quote,
        emailConsent,
        consentGiven: true,
        consentAt: CLIENT_TIME,
        consentText: CLIENT_TEXT,
      })
      const res = await offerteHandler(req)
      expect(res.status).toBe(200)
      expect(stored(create)).toMatchObject({
        consentGiven: false,
        consentAt: null,
        consentText: null,
      })
    }
  })
})

describe('offerteHandler business confirmation', () => {
  const quote = {
    bedrijf: 'Studio',
    naam: 'Ada',
    email: 'ada@example.nl',
    subscription: 'care',
  }

  function collectKvk() {
    runtimeEnv.RINSLY_KVK_COLLECTION_ENABLED = 'true'
  }

  async function rejected(body: Record<string, unknown>) {
    const { req, create, sendEmail } = request(body)
    const res = await offerteHandler(req)
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ ok: false, error: 'b2b' })
    expect(create).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  }

  it('returns 422 and stores nothing when the confirmation is missing, unticked, or null', async () => {
    await rejected({ ...quote, kvkNummer: '12345678' })
    await rejected({ ...quote, b2bConfirmed: false, kvkNummer: '12345678' })
    await rejected({ ...quote, b2bConfirmed: null, kvkNummer: '12345678' })
    collectKvk()
    await rejected({ ...quote, kvkNummer: '12345678' })
    await rejected({ ...quote, b2bConfirmed: false, kvkNummer: '12345678' })
    await rejected({ ...quote, b2bConfirmed: null, kvkNummer: '12345678' })
  })

  it('keeps a missing company on the generic validation error', async () => {
    const { req, create, sendEmail } = request({
      ...quote,
      bedrijf: '',
      b2bConfirmed: true,
      kvkNummer: '12345678',
    })
    const res = await offerteHandler(req)
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ ok: false, error: 'validation' })
    expect(create).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('ignores a submitted KvK number when collection is off', async () => {
    const { req, create, sendEmail } = request({
      ...quote,
      b2bConfirmed: true,
      kvkNummer: '1234-5678',
      b2bConfirmedAt: CLIENT_TIME,
    })

    const res = await offerteHandler(req)
    expect(res.status).toBe(200)
    expect(stored(create)).toMatchObject({
      b2bConfirmed: true,
      b2bConfirmedAt: NOW.toISOString(),
    })
    expect(stored(create)).not.toHaveProperty('kvkNummer')
    expect(stored(create).b2bConfirmedAt).not.toBe(CLIENT_TIME)
    const mailed = sendEmail.mock.calls[0][0]
    expect(mailed.text).not.toContain('KvK:')
  })

  it('accepts a ticked box without a KvK number when collection is off', async () => {
    const { req, create, sendEmail } = request({ ...quote, b2bConfirmed: true })
    const res = await offerteHandler(req)
    expect(res.status).toBe(200)
    expect(stored(create)).toMatchObject({
      b2bConfirmed: true,
      b2bConfirmedAt: NOW.toISOString(),
    })
    expect(stored(create)).not.toHaveProperty('kvkNummer')
    const mailed = sendEmail.mock.calls[0][0]
    expect(mailed.text).not.toContain('KvK:')
  })

  it('returns 422 for an invalid KvK number or a foreign registration number when collection is on', async () => {
    collectKvk()
    for (const kvkNummer of ['123', '1234567', '123456789', '1234/5678', '../1', '//1/', '12#345678', 'ABCD', 'BE0123456789', 'HRB 12345', 'DE-12345', 'BE01234567890123456789', '1234\u20135678', '1234\u00A05678', '1234567\uFF18']) {
      await rejected({ ...quote, b2bConfirmed: true, kvkNummer })
    }
    await rejected({ ...quote, b2bConfirmed: true })
  })

  it('stores a normalised Dutch KvK number when collection is on, and puts it on the sales mail', async () => {
    collectKvk()
    const cases: Array<[string, string]> = [
      ['1234-5678', '12345678'],
      ['12345678', '12345678'],
      ['1234 5678', '12345678'],
      ['1234.5678', '12345678'],
    ]
    for (const [input, storedValue] of cases) {
      const { req, create, sendEmail } = request({
        ...quote,
        b2bConfirmed: true,
        kvkNummer: input,
        b2bConfirmedAt: CLIENT_TIME,
      })

      const res = await offerteHandler(req)
      expect(res.status).toBe(200)
      expect(stored(create)).toMatchObject({
        b2bConfirmed: true,
        b2bConfirmedAt: NOW.toISOString(),
        kvkNummer: storedValue,
      })
      expect(stored(create).b2bConfirmedAt).not.toBe(CLIENT_TIME)
      const mailed = sendEmail.mock.calls[0][0]
      expect(mailed.text).toContain(`KvK: ${storedValue}`)
      if (input !== storedValue) {
        expect(mailed.text).not.toContain(`KvK: ${input}`)
      }
    }
  })
})
