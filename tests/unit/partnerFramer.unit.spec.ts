import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Partner page section "Framer of Rinsly?": an honest split, plus a trademark
 * footnote in the following `note` block. Final Lawyer-checked copy
 * (Yaron OK 26 Nov via Marketeer card). The framer block itself has no
 * ownership, free-build, percentage or price lines; the footnote is tested
 * separately because it contains the word "eigenaar" / "owner".
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

function noteAfterFramer(): string {
  const layout = partnerLayoutSource()
  const framer = layout.indexOf("anchor: 'framer'")
  if (framer < 0) throw new Error('framer section not found')
  const note = layout.indexOf("\n  {\n    blockType: 'note',", framer)
  if (note < 0) throw new Error('note after framer not found')
  const how = layout.indexOf("anchor: 'hoe'", note)
  return layout.slice(note, how < 0 ? undefined : how)
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

  it('gives the honest split: portfolio or campaign vs a studio that does not itself build', () => {
    const s = framerSection()
    expect(s).toMatch(/portfolio of campagne/)
    expect(s).toMatch(/portfolio or (a )?campaign/)
    expect(s).toContain('studio die niet zelf bouwt en beheert')
    expect(s).toContain('does not itself build and manage sites')
    expect(s).toMatch(/afhankelijk van wat je oppakt \(zie de ladder\)/)
    expect(s).toMatch(/depending on what you take on \(see the ladder\)/)
    expect(s).toContain('zelf verantwoordelijk voor bouw, beheer en support')
    expect(s).toContain('responsible for build, management and support yourself')
  })

  it('has no blocked lines: ownership, free build, percentages, prices', () => {
    const s = framerSection()
    expect(s).not.toMatch(/eigenaar|eigendom|domein op|van jou|van hem|owns|ownership|your name|export/i)
    expect(s).not.toMatch(/gratis bouw|free build|36 maanden|36 months/i)
    expect(s).not.toMatch(/%|€/)
  })

  it('omits the dropped klantcontact feature and does not claim Framer limits', () => {
    const s = framerSection()
    expect(s).not.toMatch(/klantcontact|client relationship/)
    expect(s).not.toMatch(/trademark/)
    expect(s).not.toMatch(/(Framer)[^.]*(kan niet|geen |cannot|lacks|no editors)/i)
  })

  it('uses no absolutes (BW 6:194 copy rule) and no em dashes', () => {
    const s = framerSection()
    expect(s).not.toMatch(/\b(altijd|nooit|always|never|garantie|gegarandeerd|guarantee|guaranteed|perfect|beste|best)\b/i)
    expect(s).not.toContain('—')
  })
})

describe('partner page Framer footnote', () => {
  it('is a note block immediately after the framer section, with the exact Lawyer text', () => {
    const layout = partnerLayoutSource()
    const framerEnd = framerSection()
    const note = noteAfterFramer()
    expect(note).toContain("blockType: 'note'")
    expect(note).toContain(
      'Framer is een merk van de eigenaar. Rinsly is niet verbonden aan Framer. Informatie over Framer gecontroleerd op framer.com, 26 november 2026.',
    )
    expect(note).toContain(
      'Framer is a brand of its owner. Rinsly is not affiliated with Framer. Information about Framer checked on framer.com, 26 November 2026.',
    )
    // The note sits after the framer slice and before "How it works".
    const framerPos = layout.indexOf("anchor: 'framer'")
    const notePos = layout.indexOf("blockType: 'note'", framerPos)
    const howPos = layout.indexOf("anchor: 'hoe'")
    expect(notePos).toBeGreaterThan(framerPos)
    expect(howPos).toBeGreaterThan(notePos)
    expect(framerEnd).not.toContain('merk van de eigenaar')
  })
})
