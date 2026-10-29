import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The pricing page must lead with the free build and keep the paid build as
 * the later, secondary route, using blocks that already exist. Figures are
 * the build-fee table in BUSINESS.md: €0 / 36 months minimum, then monthly
 * cancellable; or from €2.500, ongoing, cancel monthly with one month's notice.
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
  const tiers = layout.indexOf("blockType: 'pricing'")

  it('puts the free build before the paid alternative, and both before the plans', () => {
    const free = layout.indexOf("t(locale, 'Gratis bouw', 'Free build')")
    const paid = layout.indexOf('Betaal de bouw, vanaf €2.500')

    expect(free).toBeGreaterThan(-1)
    expect(paid).toBeGreaterThan(free)
    expect(paid).toBeLessThan(tiers)
    expect(layout.indexOf('€0')).toBeLessThan(paid)
    expect(layout).not.toContain('buildRoutes')
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

  it('keeps the paid route on the quieter note, not a new block', () => {
    const note = layout.indexOf("blockType: 'note'")
    expect(note).toBeGreaterThan(-1)
    expect(note).toBeLessThan(tiers)
    expect(layout.slice(note, tiers)).toContain('Betaal de bouw, vanaf €2.500')
    expect(layout).not.toContain('brochure')
    expect(layout).not.toContain('eerste jaar')
    expect(layout).not.toContain('first year')
  })
})
