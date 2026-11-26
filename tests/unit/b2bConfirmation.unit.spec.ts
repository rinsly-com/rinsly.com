import { describe, expect, it } from 'vitest'

import { adminFieldOnly } from '@rinsly-com/site-core/access'

import {
  B2B_CONFIRMATION_TEXT,
  B2B_QUOTE_REQUIRED,
  B2B_QUOTE_REQUIRED_WITH_KVK,
  KVK_FIELD_LABEL,
  b2bConfirmationFields,
  b2bFromSubmission,
  b2bQuoteRequiredText,
  normalizeKvk,
} from '../../src/lib/b2bConfirmation'

const NOW = new Date('2026-11-26T15:59:00.000Z')
const CLIENT_TIME = '1999-01-01T00:00:00.000Z'
const COLLECT = { collectKvk: true } as const

describe('normalizeKvk', () => {
  it('keeps eight digits and strips spaces, dots, and hyphens', () => {
    expect(normalizeKvk('12345678')).toBe('12345678')
    expect(normalizeKvk('1234 5678')).toBe('12345678')
    expect(normalizeKvk('1234.5678')).toBe('12345678')
    expect(normalizeKvk('1234-5678')).toBe('12345678')
    expect(normalizeKvk('12 34.56-78')).toBe('12345678')
  })

  it('rejects foreign KvK numbers', () => {
    for (const foreign of ['BE0123456789', 'HRB 12345', '  HRB 12345  ', 'BE0123.456.789', 'HRB12345', 'DE-12345', 'ABCD']) {
      expect(normalizeKvk(foreign)).toBeNull()
    }
  })

  it('rejects wrong length, junk, non-strings, and oversized raw input', () => {
    expect(normalizeKvk('123')).toBeNull()
    expect(normalizeKvk('1234567')).toBeNull()
    expect(normalizeKvk('1234 567')).toBeNull()
    expect(normalizeKvk('123456789')).toBeNull()
    expect(normalizeKvk('12#345678')).toBeNull()
    expect(normalizeKvk('1234/5678')).toBeNull()
    expect(normalizeKvk('')).toBeNull()
    expect(normalizeKvk(12345678)).toBeNull()
    expect(normalizeKvk(null)).toBeNull()
    expect(normalizeKvk(`1234 5678${' '.repeat(20)}`)).toBeNull()
  })

  it('rejects unicode dashes, unicode digits, NBSP, and control characters', () => {
    expect(normalizeKvk('1234\u20135678')).toBeNull()
    expect(normalizeKvk('1234\u20145678')).toBeNull()
    expect(normalizeKvk('1234\u00A05678')).toBeNull()
    expect(normalizeKvk('1234567\uFF18')).toBeNull()
    expect(normalizeKvk('1234\n5678')).toBeNull()
    expect(normalizeKvk('1234\u00805678')).toBeNull()
    expect(normalizeKvk('1234\u20285678')).toBeNull()
  })
})

describe('b2bFromSubmission', () => {
  it('stores the normalized number and a server timestamp only for boolean true when collection is on', () => {
    const stored = b2bFromSubmission(
      {
        b2bConfirmed: true,
        kvkNummer: '1234-5678',
        b2bConfirmedAt: CLIENT_TIME,
      },
      NOW,
      COLLECT,
    )
    expect(stored).toEqual({
      b2bConfirmed: true,
      b2bConfirmedAt: '2026-11-26T15:59:00.000Z',
      kvkNummer: '12345678',
    })
    expect(stored?.b2bConfirmedAt).not.toBe(CLIENT_TIME)
    expect(B2B_CONFIRMATION_TEXT.nl).toBe(
      'Ik handel in de uitoefening van een beroep of bedrijf. Rinsly contracteert alleen met zakelijke opdrachtgevers.',
    )
    expect(B2B_CONFIRMATION_TEXT.en).toBe(
      'I am acting in the course of a business or profession. Rinsly only contracts with business clients.',
    )
    expect(B2B_QUOTE_REQUIRED.nl).toBe(
      'Rinsly contracteert alleen met zakelijke opdrachtgevers. Vink de verklaring aan. Zonder die verklaring sturen we geen offerte.',
    )
    expect(B2B_QUOTE_REQUIRED.en).toBe(
      'Rinsly only contracts with business clients. Tick the declaration. We cannot send a quote without it.',
    )
    expect(B2B_QUOTE_REQUIRED_WITH_KVK.nl).toBe(
      'Rinsly contracteert alleen met zakelijke opdrachtgevers. Vink de verklaring aan en vul een geldig KvK-nummer (8 cijfers) in. Zonder die gegevens sturen we geen offerte.',
    )
    expect(B2B_QUOTE_REQUIRED_WITH_KVK.en).toBe(
      'Rinsly only contracts with business clients. Tick the declaration and enter a valid Chamber of Commerce (KvK) number (8 digits). We cannot send a quote without that.',
    )
    expect(b2bQuoteRequiredText('nl', false)).toBe(B2B_QUOTE_REQUIRED.nl)
    expect(b2bQuoteRequiredText('en', true)).toBe(B2B_QUOTE_REQUIRED_WITH_KVK.en)
    expect(KVK_FIELD_LABEL.nl).toBe('KvK-nummer')
    expect(KVK_FIELD_LABEL.en).toBe('KvK number')
  })

  it('rejects a missing checkbox and truthy values that are not boolean true', () => {
    const kvkNummer = '12345678'
    for (const b2bConfirmed of [undefined, false, 'true', 'false', 1, '1', 'yes', 'on', null]) {
      expect(b2bFromSubmission({ b2bConfirmed, kvkNummer }, NOW)).toBeNull()
      expect(b2bFromSubmission({ b2bConfirmed, kvkNummer }, NOW, COLLECT)).toBeNull()
    }
  })

  it('rejects a ticked box without a valid KvK number when collection is on', () => {
    expect(b2bFromSubmission({ b2bConfirmed: true }, NOW, COLLECT)).toBeNull()
    expect(b2bFromSubmission({ b2bConfirmed: true, kvkNummer: '123' }, NOW, COLLECT)).toBeNull()
    expect(b2bFromSubmission({ b2bConfirmed: true, kvkNummer: 'ABCD' }, NOW, COLLECT)).toBeNull()
    expect(b2bFromSubmission({ b2bConfirmed: true, kvkNummer: 'BE0123456789' }, NOW, COLLECT)).toBeNull()
    expect(b2bFromSubmission({ b2bConfirmed: true, kvkNummer: 'HRB 12345' }, NOW, COLLECT)).toBeNull()
  })

  it('stores the confirmation and ignores a submitted number when collection is off', () => {
    const stored = b2bFromSubmission(
      {
        b2bConfirmed: true,
        kvkNummer: '1234-5678',
        b2bConfirmedAt: CLIENT_TIME,
      },
      NOW,
    )
    expect(stored).toEqual({
      b2bConfirmed: true,
      b2bConfirmedAt: '2026-11-26T15:59:00.000Z',
    })
    expect(stored).not.toHaveProperty('kvkNummer')
    expect(b2bFromSubmission({ b2bConfirmed: true, kvkNummer: 'NOT-A-NUMBER' }, NOW)).toEqual({
      b2bConfirmed: true,
      b2bConfirmedAt: '2026-11-26T15:59:00.000Z',
    })
    expect(b2bFromSubmission({ b2bConfirmed: true }, NOW)).toEqual({
      b2bConfirmed: true,
      b2bConfirmedAt: '2026-11-26T15:59:00.000Z',
    })
  })
})

describe('b2b field access', () => {
  it('uses adminFieldOnly for read and keeps updates closed', () => {
    for (const field of b2bConfirmationFields()) {
      expect(field.access?.read).toBe(adminFieldOnly)
      expect(field.admin?.readOnly).toBe(true)
      const update = field.access?.update
      if (!update) throw new Error(`${field.name} is missing update access`)
      expect(update({ req: { user: null } } as Parameters<typeof update>[0])).toBe(false)
    }
  })
})
