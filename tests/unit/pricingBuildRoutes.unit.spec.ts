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
    const paid = layout.indexOf('betaal de bouw: vanaf €2.500')

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
    expect(layout).toContain('daarna doorlopend en maandelijks opzegbaar met een opzegtermijn van één maand')
    expect(layout).toContain('then ongoing and cancellable monthly with one month’s notice')
    expect(layout).toContain('Alle prijzen exclusief 21% btw.')
    expect(layout).toContain('All prices exclude 21% VAT.')
  })

  it('keeps the paid route on the quieter note, not a new block', () => {
    const note = layout.indexOf("blockType: 'note'")
    expect(note).toBeGreaterThan(-1)
    expect(note).toBeLessThan(tiers)
    expect(layout.slice(note, tiers)).toContain('betaal de bouw: vanaf €2.500')
    expect(layout).toContain('bij een normale bedrijfs- of brochurewebsite')
    expect(layout).toContain('typical business or brochure site')
    expect(layout).toContain('gespreid worden over het eerste jaar')
    expect(layout).toContain('spread over the first year')

    const lock = layout.indexOf('Zit ik ergens aan vast?')
    const lockIn = layout.slice(lock, lock + 1500)
    expect(lockIn.indexOf('Eerder stoppen kan via een afkoop')).toBeLessThan(lockIn.indexOf('Betaalt u de bouw'))
    expect(lockIn.indexOf('You can leave earlier through a buy-out')).toBeLessThan(
      lockIn.indexOf('If you pay for the build'),
    )
  })
})
