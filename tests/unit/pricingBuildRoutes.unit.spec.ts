import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The pricing page must lead with the free build and keep the paid build as
 * the later, secondary route. Figures are the build-fee table in BUSINESS.md:
 * €0 / 36 months minimum, then monthly cancellable; or from €2.500, ongoing,
 * cancel monthly with one month's notice.
 */
const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')

function prijzenLayoutSource(): string {
  const start = seed.indexOf('const prijzenLayout')
  const end = seed.indexOf('/* -------------------------------- /website')
  if (start < 0 || end < start) throw new Error('prijzenLayout slice not found')
  return seed.slice(start, end)
}

describe('pricing page build routes', () => {
  const layout = prijzenLayoutSource()

  it('puts the free build before the paid alternative', () => {
    const free = layout.indexOf("primaryLabel: t(locale, 'Gratis bouw', 'Free build')")
    const paid = layout.indexOf("alternativeLabel: t(locale, 'Betaal de bouw', 'Pay the build')")
    const routes = layout.indexOf("blockType: 'buildRoutes'")
    const tiers = layout.indexOf("blockType: 'pricing'")

    expect(free).toBeGreaterThan(-1)
    expect(paid).toBeGreaterThan(free)
    expect(routes).toBeGreaterThan(-1)
    expect(routes).toBeLessThan(tiers)
    expect(layout.indexOf('€0')).toBeLessThan(layout.indexOf('vanaf €2.500'))
  })

  it('states the build terms from the commercial table', () => {
    expect(layout).toContain('36 maanden minimum, daarna maandelijks opzegbaar')
    expect(layout).toContain('36 months minimum, then monthly cancellable')
    expect(layout).toContain('from €2,500')
    expect(layout).toContain('doorlopend, maandelijks opzegbaar met een opzegtermijn van één maand')
    expect(layout).toContain('ongoing, cancel monthly with one month’s notice')
    expect(layout).toContain('Alle prijzen exclusief 21% btw.')
    expect(layout).toContain('All prices exclude 21% VAT.')
  })

  it('does not limit the free build to a brochure site or a spread payment', () => {
    expect(layout).not.toContain('brochure')
    expect(layout).not.toContain('eerste jaar')
    expect(layout).not.toContain('first year')
  })
})
