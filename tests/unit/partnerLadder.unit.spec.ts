import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  DUTY_PCT,
  EXAMPLE_PARTNER_PCT,
  EXAMPLE_RINSLY_KEEPS,
  GROWTH_MONTHLY_EUR,
  PARTNER_BASE_PCT,
  PARTNER_MAX_PCT,
  VOLUME_STEP_PCT,
  VOLUME_THRESHOLDS_EUR,
  partnerProgrammeCopy,
  partnerRatePct,
  volumeLevels,
} from '../../src/lib/partnerLadder'

const none = { exclusive: false, relation: false, marketing: false }
const all = { exclusive: true, relation: true, marketing: true }

describe('partner ladder numbers', () => {
  it('is 0% at the base and 35% at the top, with +5% on each cumulative volume level', () => {
    expect(PARTNER_BASE_PCT).toBe(0)
    expect(PARTNER_MAX_PCT).toBe(35)
    expect(VOLUME_STEP_PCT).toBe(5)
    expect(VOLUME_THRESHOLDS_EUR).toEqual([1_000, 5_000, 25_000])
    expect(DUTY_PCT).toEqual({ exclusive: 10, relation: 5, marketing: 5 })
    expect(
      DUTY_PCT.exclusive +
        DUTY_PCT.relation +
        DUTY_PCT.marketing +
        VOLUME_THRESHOLDS_EUR.length * VOLUME_STEP_PCT,
    ).toBe(PARTNER_MAX_PCT)

    // Thresholds are exclusive: sitting on the number has not reached the level.
    expect(volumeLevels(1_000)).toBe(0)
    expect(volumeLevels(1_001)).toBe(1)
    expect(volumeLevels(5_000)).toBe(1)
    expect(volumeLevels(5_001)).toBe(2)
    expect(volumeLevels(25_000)).toBe(2)
    expect(volumeLevels(25_001)).toBe(3)

    expect(partnerRatePct(none, 0)).toBe(0)
    expect(partnerRatePct(none, 25_001)).toBe(15)
    expect(partnerRatePct({ exclusive: true, relation: true, marketing: false }, 0)).toBe(15)
    expect(partnerRatePct(all, 25_001)).toBe(35)
  })

  it('keeps the worked 20% example at €199,20 of a €249 Growth subscription', () => {
    expect(EXAMPLE_PARTNER_PCT).toBe(20)
    expect(GROWTH_MONTHLY_EUR).toBe(249)
    expect(EXAMPLE_RINSLY_KEEPS).toBe('199,20')
    // 249 * 80 cents, so the published €199,20 is the 20% case with no rounding.
    expect(GROWTH_MONTHLY_EUR * (100 - EXAMPLE_PARTNER_PCT)).toBe(19920)
  })
})

describe('partner programme copy', () => {
  it('makes reselling under your own invoice, price and brand the headline', () => {
    expect(partnerProgrammeCopy('nl').hero.title).toBe('Jullie factuur, jullie prijs, jullie merk')
    expect(partnerProgrammeCopy('en').hero.title).toBe('Your invoice, your price, your brand')
    expect(partnerProgrammeCopy('nl').hero.intro).toContain('Doorverkoop en eigen branding zijn toegestaan')
    expect(partnerProgrammeCopy('en').hero.intro).toContain('Reselling and your own branding are allowed')
    expect(partnerProgrammeCopy('nl').hero.intro).toContain('hosting bij Rinsly')
    expect(partnerProgrammeCopy('en').hero.intro).toContain('hosting at Rinsly')
  })

  it('publishes each volume rung as +5%, and the base as settled recurring revenue ex VAT', () => {
    for (const locale of ['nl', 'en'] as const) {
      const copy = partnerProgrammeCopy(locale)
      expect(copy.ladder.rungs.map((rung) => rung.pct)).toEqual([10, 5, 5, 5, 5, 5])
      expect(copy.ladder.rungs.filter((rung) => rung.kind === 'measured').map((rung) => rung.pct)).toEqual([
        5, 5, 5,
      ])
      const blob = JSON.stringify(copy)
      expect(blob).toContain('€1.000')
      expect(blob).toContain('€5.000')
      expect(blob).toContain('€25.000')
      expect(blob).toContain('€199,20')
      expect(blob).not.toContain('€5.000 +10%')
      expect(blob).not.toContain('€25.000 +15%')
      expect(blob).not.toContain('+15%, niet +5%')
      expect(blob).not.toContain('+15%, not +5%')
      expect(blob).not.toContain('—')
      expect(blob).not.toContain('hostingcontract')
      expect(blob).not.toContain('binnen een week')
      expect(blob).not.toContain('partnerportaal')
    }

    const nl = partnerProgrammeCopy('nl').rules.paragraphs.join('\n')
    const en = partnerProgrammeCopy('en').rules.paragraphs.join('\n')
    expect(nl).toContain('doorlopende abonnementsomzet exclusief btw, per factuur die betaald is')
    expect(nl).toContain('Eenmalige bouwkosten en meerwerk worden niet gedeeld')
    expect(nl).toContain('Een jaarplan telt als een twaalfde')
    expect(nl).toContain('één maand respijt')
    expect(en).toContain('recurring subscription revenue excluding VAT, per invoice settled')
    expect(en).toContain('One-off build fees and meerwerk are not shared')
    expect(en).toContain('A yearly plan counts as a twelfth')
    expect(en).toContain('one grace month')
  })

  it('is what the CMS seed writes onto /partnerprogramma', () => {
    const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')
    expect(seed).toContain('partnerProgrammeCopy')
    expect(seed).toContain("anchor: 'ladder'")
    expect(seed).toContain("slug: SLUG.partner")
    expect(seed).not.toContain('boven €5.000 +10%')
    expect(seed).not.toContain('above €5.000 +10%')
    expect(seed).not.toContain('partnerportaal')
    expect(seed).not.toContain('ongeveer €149')
    expect(seed).not.toContain('hostingcontract')
  })
})
