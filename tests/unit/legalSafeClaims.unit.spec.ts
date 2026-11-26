import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Legal-safe claims (Lawyer, site-claims-check §1.3 and §2.5; Yaron, 27 Nov
 * 2026): the public pages do not say "gratis bouw", "altijd eigenaar",
 * "contractueel, geen belofte" or "afkoop", and the exit footnote carries no
 * figures. The terms pages (voorwaarden, art. 9 and 10) are Legal's own text and
 * are not part of this check.
 */
const seedFull = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')
const termsStart = seedFull.indexOf('/* Prose documents')
if (termsStart < 0) throw new Error('prose documents marker not found')
const seed = seedFull.slice(0, termsStart)
const checkConfig = readFileSync(new URL('../../src/check.config.ts', import.meta.url), 'utf8')
const ladder = readFileSync(new URL('../../src/lib/partnerLadder.ts', import.meta.url), 'utf8')

const FOOTNOTE_NL =
  '¹ Stopt u binnen de 36 maanden, dan betaalt u de uitstapkosten die in uw offerte staan. U krijgt de website en de gegevens mee zodra dit is betaald. Zie de algemene voorwaarden en uw offerte.'
const FOOTNOTE_EN =
  '¹ If you stop within the 36 months, you pay the exit costs stated in your quote. You receive the website and the data once this is paid. See the general terms and your quote.'

describe('legal-safe claims', () => {
  it('has no "gratis bouw" / free build claim in the seeded pages, the check page or the ladder', () => {
    for (const src of [seed, checkConfig, ladder]) {
      expect(src).not.toMatch(/gratis bouw|gratis bouwen|website gratis|free build|free client build|build is €0|bouw is €0|€0 bouwkosten|a €0 build fee/i)
      expect(src).not.toMatch(/gratis bouw als u zich drie jaar|free build if you commit/i)
    }
  })

  it('has no "afkoop" / buy-out in the seeded pages (terms excluded)', () => {
    expect(seed).not.toMatch(/afkoop|buy-out/i)
  })

  it('has no "altijd eigenaar" / always-owns / contractual-not-a-promise ownership claim', () => {
    for (const src of [seed, checkConfig, ladder]) {
      expect(src).not.toMatch(/altijd eigenaar|always owns|is eigenaar van de site|Client owns|client owns|Klant is eigenaar|zijn en blijven hun eigendom|are and remain their property/)
      expect(src).not.toMatch(/contractueel, geen belofte|contractual, not a promise/)
      expect(src).not.toMatch(/het eigendom van site en data|ownership of the site and the data/)
    }
  })

  it('carries the exit footnote exactly, once per language, with no figures', () => {
    expect(seed).toContain(FOOTNOTE_NL)
    expect(seed).toContain(FOOTNOTE_EN)
    expect(FOOTNOTE_NL).not.toMatch(/€|\d+ ×/)
    expect(FOOTNOTE_EN).not.toMatch(/€|\d+ ×/)
  })

  it('uses the Legal ownership wording on pricing, partner and platform', () => {
    expect(seed).toContain('Bij beëindiging krijgt de klant de gegevens, de website en de broncode mee, mits openstaande facturen zijn betaald (art. 10 algemene voorwaarden).')
    expect(seed).toContain('Klant krijgt site, gegevens en broncode mee bij beëindiging')
    expect(seed).toContain('In de overeenkomst staat dat de klant bij beëindiging de gegevens, de website en de broncode meekrijgt (art. 10 algemene voorwaarden). Wat er gebeurt bij een faillissement van Rinsly leggen we op aanvraag uit.')
    expect(seed).toContain('De klant houdt zijn gegevens en krijgt bij beëindiging de website en de broncode mee (art. 10 algemene voorwaarden).')
  })

  it('uses the Legal wording for the partner step 2 line', () => {
    expect(seed).toContain('Geen bouwkosten voor de klant bij 36 maanden hosting (zie voorwaarden en uitstapkosten op /prijzen)')
  })
})
