import { describe, expect, it } from 'vitest'

import {
  FREE_TEXT_MAX,
  SHORT_TEXT_MAX,
  checkAanvraagFieldsTooLong,
  offerteFieldsTooLong,
  offerteMailSubject,
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

describe('offerteMailSubject', () => {
  it('strips CR, LF, and other control characters before they reach the subject', () => {
    const subject = offerteMailSubject('Acme\r\nBcc: evil@example.com\u0000\u0007\u007f\u2028')

    expect(subject).toBe('Nieuwe offerteaanvraag: AcmeBcc: evil@example.com')
    expect(subject).not.toMatch(/[\u0000-\u001F\u007F\u2028\u2029]/)
    expect(stripControlChars('ok')).toBe('ok')
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
