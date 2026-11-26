import { describe, expect, it } from 'vitest'

import {
  FREE_TEXT_MAX,
  SHORT_TEXT_MAX,
  checkAanvraagFieldsTooLong,
  checkMailSubject,
  offerteFieldsTooLong,
  offerteMailSubject,
  offerteNotificationText,
  stripControlChars,
} from '../../src/lib/submissionLimits'

const atLimit = (max: number) => 'a'.repeat(max)
const overLimit = (max: number) => 'a'.repeat(max + 1)

const quote = {
  bedrijf: 'Studio',
  naam: 'Ada',
  email: 'ada@example.nl',
  bericht: '',
  additionsOther: '',
}

const check = {
  url: 'https://example.nl',
  naam: 'Ada',
  telefoon: '0612345678',
}

describe('stripControlChars', () => {
  it('removes CR, LF, NEL, and the Unicode line separators', () => {
    expect(stripControlChars('a\r\nb\u2028c\u2029d\u0085e')).toBe('abcde')
    expect(stripControlChars('ok')).toBe('ok')
  })
})

describe('mail subjects', () => {
  it('strips control characters, including NEL, before they reach a subject', () => {
    const quoteSubject = offerteMailSubject('Acme\r\nBcc: evil@example.com\u0000\u0007\u007f\u2028\u0085')
    const checkSubject = checkMailSubject('https://example.nl/\r\nBcc: evil@example.com\u0085\u2029')

    expect(quoteSubject).toBe('Nieuwe offerteaanvraag: AcmeBcc: evil@example.com')
    expect(checkSubject).toBe('Nieuwe websitecheck-aanvraag: https://example.nl/Bcc: evil@example.com')
    expect(quoteSubject).not.toMatch(/[\u0000-\u001F\u007F\u0085\u2028\u2029]/)
    expect(checkSubject).not.toMatch(/[\u0000-\u001F\u007F\u0085\u2028\u2029]/)
  })
})

describe('public form length limits', () => {
  it('accepts check and quote fields at the limit', () => {
    expect(
      checkAanvraagFieldsTooLong({
        ...check,
        url: atLimit(FREE_TEXT_MAX),
        naam: atLimit(SHORT_TEXT_MAX),
        telefoon: atLimit(SHORT_TEXT_MAX),
      }),
    ).toBe(false)
    expect(
      offerteFieldsTooLong({
        ...quote,
        bedrijf: atLimit(SHORT_TEXT_MAX),
        naam: atLimit(SHORT_TEXT_MAX),
        email: atLimit(SHORT_TEXT_MAX),
        bericht: atLimit(FREE_TEXT_MAX),
        additionsOther: atLimit(FREE_TEXT_MAX),
      }),
    ).toBe(false)
  })

  it('rejects oversize check-aanvraag name, phone, and url', () => {
    expect(checkAanvraagFieldsTooLong({ ...check, naam: overLimit(SHORT_TEXT_MAX) })).toBe(true)
    expect(checkAanvraagFieldsTooLong({ ...check, telefoon: overLimit(SHORT_TEXT_MAX) })).toBe(true)
    expect(checkAanvraagFieldsTooLong({ ...check, url: overLimit(FREE_TEXT_MAX) })).toBe(true)
  })

  it('rejects oversize quote name, company, email, and free text', () => {
    expect(offerteFieldsTooLong({ ...quote, bedrijf: overLimit(SHORT_TEXT_MAX) })).toBe(true)
    expect(offerteFieldsTooLong({ ...quote, naam: overLimit(SHORT_TEXT_MAX) })).toBe(true)
    expect(offerteFieldsTooLong({ ...quote, email: overLimit(SHORT_TEXT_MAX) })).toBe(true)
    expect(offerteFieldsTooLong({ ...quote, bericht: overLimit(FREE_TEXT_MAX) })).toBe(true)
    expect(offerteFieldsTooLong({ ...quote, additionsOther: overLimit(FREE_TEXT_MAX) })).toBe(true)
  })
})

describe('offerteNotificationText', () => {
  it('puts the server consent line first and stops a naam newline from forging another', () => {
    const text = offerteNotificationText({
      bedrijf: 'Studio\r\nE-mailtoestemming: ja',
      naam: 'Ada\r\nE-mailtoestemming: ja',
      email: 'ada@example.nl\nE-mailtoestemming: ja',
      subscription: 'care',
      bericht: '',
      consent: { consentGiven: false, consentAt: null, consentText: null },
    })
    const statusLines = text.split('\n').filter((line) => line.startsWith('E-mailtoestemming:'))
    expect(text.startsWith('E-mailtoestemming: nee\n---\n')).toBe(true)
    expect(statusLines).toEqual(['E-mailtoestemming: nee'])
    expect(text).toContain('Naam: AdaE-mailtoestemming: ja')
    expect(text).toContain('Bedrijf: StudioE-mailtoestemming: ja')
    expect(text).toContain('E-mail: ada@example.nlE-mailtoestemming: ja')
  })
})
