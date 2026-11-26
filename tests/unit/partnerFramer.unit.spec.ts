import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Partner page section "Framer of Rinsly?": an honest split between a portfolio
 * or campaign site (Framer is fine) and a business site that has to run for
 * years (Rinsly). Approved scope: no ownership or contract lines (blocked until
 * the exit terms are final), no free-build line, no percentages, no absolutes.
 */
const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')

function partnerLayoutSource(): string {
  const start = seed.indexOf('const partnerLayout')
  const end = seed.indexOf('\n/* ---', start)
  if (start < 0 || end < start) throw new Error('partnerLayout slice not found')
  return seed.slice(start, end)
}

function framerSection(): string {
  const layout = partnerLayoutSource()
  const start = layout.indexOf("anchor: 'framer'")
  if (start < 0) throw new Error('framer section not found')
  const next = layout.indexOf('\n  {\n    blockType:', start)
  return layout.slice(start, next < 0 ? undefined : next)
}

describe('partner page Framer or Rinsly section', () => {
  it('exists in NL and EN, with the question as its title', () => {
    const s = framerSection()
    expect(s).toContain("t(locale, 'Framer of Rinsly?', 'Framer or Rinsly?')")
  })

  it('sits between "Why Rinsly" and "How it works"', () => {
    const layout = partnerLayoutSource()
    const why = layout.indexOf("anchor: 'waarom'")
    const framer = layout.indexOf("anchor: 'framer'")
    const how = layout.indexOf("anchor: 'hoe'")
    expect(why).toBeGreaterThan(-1)
    expect(framer).toBeGreaterThan(why)
    expect(how).toBeGreaterThan(framer)
  })

  it('gives the honest split: portfolio or campaign vs business site', () => {
    const s = framerSection()
    expect(s).toMatch(/portfolio of campagne/)
    expect(s).toMatch(/portfolio or (a )?campaign/)
    expect(s).toMatch(/bedrijfssite die jaren moet draaien/)
    expect(s).toMatch(/business site that has to run for years/)
    expect(s).toMatch(/redacteuren/)
    expect(s).toMatch(/editors/)
  })

  it('has no blocked lines: ownership, free build, percentages, prices', () => {
    const s = framerSection()
    expect(s).not.toMatch(/eigenaar|eigendom|domein op|van jou|van hem|owns|ownership|your name|export/i)
    expect(s).not.toMatch(/gratis bouw|free build|36 maanden|36 months/i)
    expect(s).not.toMatch(/%|€/)
  })

  it('uses no absolutes (BW 6:194 copy rule) and no em dashes', () => {
    const s = framerSection()
    expect(s).not.toMatch(/\b(altijd|nooit|always|never|garantie|gegarandeerd|guarantee|guaranteed|perfect|beste|best)\b/i)
    expect(s).not.toContain('—')
  })
})
