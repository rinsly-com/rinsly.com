import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Privacy statement section 8 "Zakelijke benadering" / "Business outreach".
 * It must be on the page (NL and EN) before any outbound letter, call, DM or
 * mail, so it has to carry the facts the lawyer asked for and no leftovers from
 * the drafting stage (placeholders, bracketed notes), and the numbering and
 * cross references around it must still be consistent.
 */
const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')

function privacySlice(locale: 'nl' | 'en'): string {
  const start = seed.indexOf('const privacyNodes')
  if (start < 0) throw new Error('privacyNodes not found')
  const end = seed.indexOf('\n}\n', start)
  const block = seed.slice(start, end < 0 ? undefined : end)
  const nl = block.indexOf('  nl: [')
  const en = block.indexOf('  en: [')
  if (nl < 0 || en < nl) throw new Error('privacyNodes locales not found')
  return locale === 'nl' ? block.slice(nl, en) : block.slice(en)
}

function headings(slice: string): string[] {
  return [...slice.matchAll(/\{ h: ['"]([^'"]+)['"] \}/g)].map((m) => m[1])
}

function section8(slice: string): string {
  const hs = headings(slice)
  const i = hs.findIndex((h) => h.startsWith('8. '))
  if (i < 0) throw new Error('no section 8')
  const from = slice.indexOf(hs[i])
  const to = hs[i + 1] ? slice.indexOf(hs[i + 1]) : slice.length
  return slice.slice(from, to)
}

describe.each([
  ['nl', '8. Zakelijke benadering (acquisitie)'],
  ['en', '8. Business outreach'],
] as const)('privacy section 8 (%s)', (locale, title) => {
  const slice = privacySlice(locale)

  it('has the outreach section as number 8, in a gapless 1..N numbering', () => {
    const hs = headings(slice)
    expect(hs[7]).toBe(title)
    hs.forEach((h, i) => expect(h.startsWith(`${i + 1}. `)).toBe(true))
    expect(hs.length).toBe(12)
  })

  it('has no drafting leftovers', () => {
    const s8 = section8(slice)
    // visitor text only: drop the `{ p: '...' },` / `{ h: '...' },` source wrappers first
    const text = s8
      .split('\n')
      .map((l) => l.replace(/^\s*\{ [ph]: /, '').replace(/ \},?\s*$/, ''))
      .join('\n')
    expect(text).not.toMatch(/[{}]/)
    expect(s8).not.toMatch(/\[(If|Als|BLOCKED|P\d)/i)
    expect(s8).not.toMatch(/DRAFT|TODO/)
  })

  it('uses no absolutes (BW 6:194 copy rule)', () => {
    const s8 = section8(slice)
    expect(s8).not.toMatch(/\b(altijd|nooit|always|never|100%|garantie|guarantee)\b/i)
  })

  it('states retention, opt-out and complaint routes', () => {
    const s8 = section8(slice)
    expect(s8).toContain('contact@rinsly.com')
    expect(s8).toMatch(/6 ?24118912/)
    expect(s8).toMatch(/12 (maanden|months)/)
    expect(s8).toMatch(/5 (jaar|years)/)
    expect(s8).toContain('art. 21')
    expect(s8).toContain('Autoriteit Persoonsgegevens')
    expect(s8).toContain('ACM')
  })

  it('keeps cross references pointing at the rights section', () => {
    const hs = headings(slice)
    const rights = hs.findIndex((h) => /rechten|rights/i.test(h)) + 1
    expect(rights).toBe(10)
    const ref = locale === 'nl' ? /artikel (\d+) \(inzage/ : /section (\d+) \(access/
    expect(slice.match(ref)?.[1]).toBe(String(rights))
  })
})

describe('privacy section 8 wording', () => {
  it('says e-mail only with consent or for clients (NL and EN)', () => {
    expect(section8(privacySlice('nl'))).toMatch(/per e-mail \*\*alleen als u daarvoor toestemming gaf\*\* of klant/)
    expect(section8(privacySlice('en'))).toMatch(/by e-mail \*\*only with your consent\*\* or if you are a client/)
  })
})
