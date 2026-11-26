import { describe, expect, it } from 'vitest'

import {
  EMAIL_CONSENT_TEXT,
  consentNotice,
  emailConsentFields,
  emailConsentFromSubmission,
  userCanReadConsent,
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
    expect(stored.consentText).toBe('Yes, Rinsly may email me about this')
    expect(EMAIL_CONSENT_TEXT.nl).toBe('Ja, Rinsly mag mij hierover e-mailen')
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
  it('lets admins read the consent columns and hides them from editors', () => {
    expect(userCanReadConsent(null)).toBe(false)
    expect(userCanReadConsent(undefined)).toBe(false)
    expect(userCanReadConsent({})).toBe(false)
    expect(userCanReadConsent({ roles: ['editor'] })).toBe(false)
    expect(userCanReadConsent({ roles: 'admin' })).toBe(false)
    expect(userCanReadConsent({ roles: ['admin'] })).toBe(true)
    expect(userCanReadConsent({ roles: ['editor', 'admin'] })).toBe(true)

    for (const field of emailConsentFields()) {
      const read = field.access?.read
      const update = field.access?.update
      if (!read || !update) throw new Error(`${field.name} is missing access`)
      const editor = { req: { user: { roles: ['editor'] } } } as Parameters<typeof read>[0]
      const admin = { req: { user: { roles: ['admin'] } } } as Parameters<typeof read>[0]
      expect(read(editor)).toBe(false)
      expect(read(admin)).toBe(true)
      expect(update(admin)).toBe(false)
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
      'E-mailtoestemming: ja\nToestemmingstekst: Ja, Rinsly mag mij hierover e-mailen\nTijdstip: 2026-11-26T13:50:00.000Z',
    )
  })
})
