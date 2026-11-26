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
  '¹ Stopt u binnen de 36 maanden (gerekend vanaf de startdatum in uw offerte), dan betaalt u een uitstapbedrag: de bouwwaarde uit uw offerte × het aantal resterende maanden ÷ 36, ten hoogste de hostingkosten voor de resterende maanden. Het bedrag staat in uw offerte. Uw gegevens krijgt u altijd mee; de website en de broncode zodra het uitstapbedrag en openstaande facturen zijn betaald. Zie de algemene voorwaarden en uw offerte.'
const FOOTNOTE_EN =
  '¹ If you stop within the 36 months (counted from the start date in your quote), you pay an exit amount: the build value in your quote × the number of remaining months ÷ 36, at most the hosting fees for the remaining months. The amount is in your quote. You always receive your data; the website and source code once the exit amount and any open invoices are paid. See the general terms and your quote.'

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

  it('carries the exit-formula footnote exactly, in both languages, with no euro amounts', () => {
    expect(seed).toContain(FOOTNOTE_NL)
    expect(seed).toContain(FOOTNOTE_EN)
    expect(FOOTNOTE_NL).not.toMatch(/€/)
    expect(FOOTNOTE_EN).not.toMatch(/€/)
    expect(seed).not.toMatch(/uitstapkosten|exit costs/)
  })

  it('uses the Legal ownership wording on pricing, partner and platform', () => {
    expect(seed).toContain('Bij beëindiging krijgt de klant de gegevens, de website en de broncode mee, mits openstaande facturen zijn betaald (art. 10 algemene voorwaarden).')
    expect(seed).toContain('Klant krijgt site, gegevens en broncode mee bij beëindiging')
    expect(seed).toContain('In de overeenkomst staat dat de klant bij beëindiging de gegevens, de website en de broncode meekrijgt (art. 10 algemene voorwaarden). Wat er gebeurt bij een faillissement van Rinsly leggen we op aanvraag uit.')
    expect(seed).toContain('De klant houdt zijn gegevens en krijgt bij beëindiging de website en de broncode mee (art. 10 algemene voorwaarden).')
  })

  it('uses the Legal wording for the partner step 2 line', () => {
    expect(seed).toContain('Geen bouwkosten voor de klant bij 36 maanden hosting (zie voorwaarden en het uitstapbedrag op /prijzen)')
    expect(seed).toContain('No build fee for the client on 36 months of hosting (see the terms and the exit amount on the pricing page)')
  })

  it('pins the pricing hero: u-form, and what the example amount is', () => {
    expect(seed).toContain('Kiest u een hostingabonnement met een minimumlooptijd van 36 maanden (bijvoorbeeld Care: 36 × €49 = €1.764 aan hostingkosten, excl. btw, bij het huidige tarief), dan')
    expect(seed).toContain('If you choose a hosting plan with a minimum term of 36 months (for example Care: 36 × €49 = €1,764 in hosting fees, excl. VAT, at the current rate), we charge')
    expect(seed).not.toContain('Kies je een hostingabonnement')
  })

  it('names the one month notice in both FAQ answers and keeps continuation apart from early exit', () => {
    expect(seed.match(/net zo goed maandelijks opzegbaar, met een opzegtermijn van één maand\. Stopt u binnen de 36 maanden/g)).toHaveLength(1)
    expect(seed.match(/Na die 36 maanden is het maandelijks opzegbaar, met een opzegtermijn van één maand\. Stopt u binnen de 36 maanden/g)).toHaveLength(1)
    expect(seed.match(/just as monthly-cancellable, with one month’s notice\. If you stop within the 36 months/g)).toHaveLength(1)
    expect(seed.match(/After those 36 months it is monthly cancellable, with one month’s notice\. If you stop within the 36 months/g)).toHaveLength(1)
    expect(seed).not.toMatch(/Daarna loopt het abonnement door|After that the subscription continues/)
  })

  it('points the /website step at the pricing page and the exit amount', () => {
    expect(seed).toContain('Zie Prijzen voor de voorwaarden en het uitstapbedrag.')
    expect(seed).toContain('See Pricing for the terms and the exit amount.')
    expect(seed).toContain('de bouw vanaf €2.500 (excl. btw) met maandelijks opzegbare hosting (opzegtermijn van één maand), of geen bouwkosten bij 36 maanden hosting')
  })

  it('does not put the SLA on every end-client agreement (partner ladder, Legal 7.2)', () => {
    expect(ladder).not.toMatch(/de SLA,|the SLA,/)
    expect(ladder).toContain('Een SLA alleen bij Op maat, en alleen als die is overeengekomen.')
    expect(ladder).toContain('An SLA only on the Custom plan, and only if one is agreed.')
  })

  it('has no ownership question title on /platform and names the exit amount on the /check scorecard', () => {
    expect(seed).not.toMatch(/Van wie is de website\?|Who owns the website\?/)
    expect(seed).toContain("t(locale, 'Wat krijgt de klant mee bij beëindiging?', 'What does the client get on termination?')")
    expect(seed).not.toContain('the business whose website it is')
    expect(checkConfig).toContain('Stopt u binnen die 36 maanden, dan betaalt u een uitstapbedrag; het staat in uw offerte (zie ook de voetnoot bij de prijs op rinsly.com/prijzen).')
  })
})
