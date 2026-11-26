import { describe, expect, it } from 'vitest'

import {
  B2B_CONFIRMATION_TEXT,
  b2bFromSubmission,
  normalizeKvk,
} from '../../src/lib/b2bConfirmation'

const NOW = new Date('2026-11-26T15:59:00.000Z')
const CLIENT_TIME = '1999-01-01T00:00:00.000Z'

describe('normalizeKvk', () => {
  it('keeps eight digits and strips spaces and dots', () => {
    expect(normalizeKvk('12345678')).toBe('12345678')
    expect(normalizeKvk('1234 5678')).toBe('12345678')
    expect(normalizeKvk('1234.5678')).toBe('12345678')
    expect(normalizeKvk('12 34.56 78')).toBe('12345678')
  })

  it('rejects wrong length, letters, dashes, non-strings, and oversized raw input', () => {
    expect(normalizeKvk('1234567')).toBeNull()
    expect(normalizeKvk('123456789')).toBeNull()
    expect(normalizeKvk('1234567a')).toBeNull()
    expect(normalizeKvk('1234-5678')).toBeNull()
    expect(normalizeKvk('')).toBeNull()
    expect(normalizeKvk(12345678)).toBeNull()
    expect(normalizeKvk(`1234 5678${' '.repeat(20)}`)).toBeNull()
  })
})

describe('b2bFromSubmission', () => {
  it('stores the normalized KvK and a server timestamp only for boolean true', () => {
    const stored = b2bFromSubmission(
      {
        b2bConfirmed: true,
        kvkNummer: '1234.5678',
        b2bConfirmedAt: CLIENT_TIME,
      },
      NOW,
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
  })

  it('rejects a missing checkbox and truthy values that are not boolean true', () => {
    const kvkNummer = '12345678'
    for (const b2bConfirmed of [undefined, false, 'true', 'false', 1, '1', 'yes', 'on', null]) {
      expect(b2bFromSubmission({ b2bConfirmed, kvkNummer }, NOW)).toBeNull()
    }
  })

  it('rejects a ticked box without a valid KvK number', () => {
    expect(b2bFromSubmission({ b2bConfirmed: true }, NOW)).toBeNull()
    expect(b2bFromSubmission({ b2bConfirmed: true, kvkNummer: '123' }, NOW)).toBeNull()
  })
})
