import { describe, expect, it } from 'vitest'

import { adminFieldOnly } from '@rinsly-com/site-core/access'

import {
  EMAIL_CONSENT_TEXT,
  consentNotice,
  emailConsentFields,
  emailConsentFromSubmission,
} from '../../src/lib/emailConsent'

const NOW = new Date('2026-11-26T13:50:00.000Z')
const CLIENT_TIMESTAMP = '1999-01-01T00:00:00.000Z'
const CLIENT_TEXT = 'The client wrote this sentence'

describe('emailConsentFromSubmission', () => {
  it('stores false and nulls when the box is unticked or absent', () => {
    for (const emailConsent of [false, undefined, 'true', 'false', 1, 0, null, '']) {
      expect(
        emailConsentFromSubmission(
          {
            emailConsent,
            locale: 'nl',
            consentAt: CLIENT_TIMESTAMP,
            consentText: CLIENT_TEXT,
            consentGiven: true,
          },
          NOW,
        ),
      ).toEqual({ consentGiven: false, consentAt: null, consentText: null })
    }
    expect(emailConsentFromSubmission({}, NOW)).toEqual({
      consentGiven: false,
      consentAt: null,
      consentText: null,
    })
  })

  it('stores the Dutch sentence and the server timestamp when ticked without an en locale', () => {
    for (const locale of [undefined, 'nl', 'NL', 'en-US', 'fr', '']) {
      expect(
        emailConsentFromSubmission(
          { emailConsent: true, locale, consentAt: CLIENT_TIMESTAMP, consentText: CLIENT_TEXT },
          NOW,
        ),
      ).toEqual({
        consentGiven: true,
        consentAt: '2026-11-26T13:50:00.000Z',
        consentText: EMAIL_CONSENT_TEXT.nl,
      })
    }
  })

  it('stores the English sentence only for locale en, still ignoring the client clock and text', () => {
    const stored = emailConsentFromSubmission(
      {
        emailConsent: true,
        locale: 'en',
        consentAt: CLIENT_TIMESTAMP,
        consentText: CLIENT_TEXT,
        consentGiven: false,
      },
      NOW,
    )
    expect(stored).toEqual({
      consentGiven: true,
      consentAt: NOW.toISOString(),
      consentText: EMAIL_CONSENT_TEXT.en,
    })
    expect(stored.consentAt).not.toBe(CLIENT_TIMESTAMP)
    expect(stored.consentText).not.toBe(CLIENT_TEXT)
    expect(EMAIL_CONSENT_TEXT.en.startsWith('Yes, I would also like Rinsly to e-mail me')).toBe(
      true,
    )
    expect(EMAIL_CONSENT_TEXT.nl.startsWith('Ja, ik wil ook e-mails van Rinsly ontvangen')).toBe(
      true,
    )
  })
})

describe('email consent columns', () => {
  it('adds nullable consentGiven, consentAt and consentText, with the checkbox default unticked', () => {
    const [given, at, text] = emailConsentFields()
    expect(given).toMatchObject({ name: 'consentGiven', type: 'checkbox', defaultValue: false })
    expect(at).toMatchObject({ name: 'consentAt', type: 'date', index: true })
    expect(text).toMatchObject({ name: 'consentText', type: 'text' })
    expect(given.required).toBeUndefined()
    expect(at.required).toBeUndefined()
    expect(text.required).toBeUndefined()
  })
})

describe('consent field access', () => {
  it('uses adminFieldOnly for read and keeps updates closed', () => {
    for (const field of emailConsentFields()) {
      expect(field.access?.read).toBe(adminFieldOnly)
      const update = field.access?.update
      if (!update) throw new Error(`${field.name} is missing update access`)
      expect(update({ req: { user: null } } as Parameters<typeof update>[0])).toBe(false)
    }
  })
})

describe('consentNotice', () => {
  it('tells sales whether the server recorded a tick', () => {
    expect(consentNotice({ consentGiven: false, consentAt: null, consentText: null })).toBe(
      'E-mailtoestemming: nee',
    )
    expect(
      consentNotice({
        consentGiven: true,
        consentAt: NOW.toISOString(),
        consentText: EMAIL_CONSENT_TEXT.nl,
      }),
    ).toBe(
      `E-mailtoestemming: ja\nToestemmingstekst: ${EMAIL_CONSENT_TEXT.nl}\nTijdstip: 2026-11-26T13:50:00.000Z`,
    )
  })
})
