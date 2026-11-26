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
    hs.forEach((h, i) => {
      expect(h.startsWith(`${i + 1}. `)).toBe(true)
    })
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


function namedSection(locale: 'nl' | 'en', heading: string): string {
  const slice = privacySlice(locale)
  const from = slice.indexOf(heading)
  if (from < 0) throw new Error(`heading not found: ${heading}`)
  const rest = slice.slice(from + heading.length)
  const next = rest.search(/\{ h: ['"]/)
  return heading + (next < 0 ? rest : rest.slice(0, next))
}

describe('privacy Lawyer review (F1–F5)', () => {
  it('F1: §8 states non-EEA transfers as fact, points to art. 9, and offers a copy of the safeguards (NL+EN)', () => {
    const nl = section8(privacySlice('nl'))
    const en = section8(privacySlice('en'))
    expect(nl).toContain('Sommige verwerkers zijn gevestigd buiten de Europese Economische Ruimte')
    expect(nl).toContain('hoe u een kopie daarvan kunt krijgen, staan in artikel 9')
    expect(en).toContain('Some processors are established outside the European Economic Area')
    expect(en).toContain('how you can obtain a copy of them, are set out in section 9')
    expect(nl).not.toMatch(/Zit een verwerker/)
    expect(en).not.toMatch(/If a processor is outside/)
  })

  it('F2: §9 covers the §8 AI and storage category, DPF if certified else SCCs/art. 46, and how to get a copy', () => {
    const nl = namedSection('nl', '9. Doorgifte buiten de EER')
    const en = namedSection('en', '9. Transfers outside the EEA')
    expect(nl).toContain('AI- en opslagdiensten van artikel 8')
    expect(nl).toContain('EU-VS Data Privacy Framework')
    expect(nl).toContain('voor zover de betreffende verwerker daarvoor is gecertificeerd')
    expect(nl).toContain('modelcontractbepalingen')
    expect(nl).toContain('artikel 46 AVG')
    expect(nl).toContain('contact@rinsly.com')
    expect(nl).toContain('Cloudflare, Inc.')
    expect(nl).toContain('Anthropic, PBC')
    expect(nl).toContain('alleen de websitebeoordelingen van artikel 7')
    expect(en).toContain('AI and storage services in section 8')
    expect(en).toContain('EU-US Data Privacy Framework')
    expect(en).toContain('to the extent the relevant processor is certified under it')
    expect(en).toContain('Standard Contractual Clauses')
    expect(en).toContain('GDPR Article 46')
    expect(en).toContain('contact@rinsly.com')
    expect(en).toContain('only the website assessments in section 7')
    expect(nl + en).not.toMatch(/Grok|xAI|\bGoogle\b/)
  })

  it('F3: art. 21 objection is available at any time, without using altijd/always', () => {
    const nl = section8(privacySlice('nl'))
    const en = section8(privacySlice('en'))
    expect(nl).toContain('U heeft te allen tijde het recht om bezwaar te maken')
    expect(nl).toContain('art. 21 lid 2 AVG')
    expect(en).toContain('You have the right to object at any time')
    expect(en).toContain('GDPR art. 21(2)')
    expect(nl).not.toMatch(/\baltijd\b/i)
    expect(en).not.toMatch(/\balways\b/i)
  })

  it('F4: §1 covers all processing in the statement; §6 points to artikel/section 8', () => {
    const nl1 = namedSection('nl', '1. Verwerkingsverantwoordelijke')
    const en1 = namedSection('en', '1. Controller')
    const nl6 = namedSection('nl', '6. Verwerkers en derden')
    const en6 = namedSection('en', '6. Processors and third parties')
    expect(nl1).toContain('voor de in deze verklaring beschreven verwerkingen van persoonsgegevens')
    expect(nl1).not.toContain('via deze website')
    expect(en1).toContain('for the processing of personal data described in this policy')
    expect(en1).not.toContain('through this website')
    expect(nl6).toContain('Voor de verwerkers die wij inzetten bij zakelijke benadering, zie artikel 8')
    expect(en6).toContain('For the processors we use in business outreach, see section 8')
  })

  it('F5: legal basis names the partner programme (NL+EN)', () => {
    const nl = section8(privacySlice('nl'))
    const en = section8(privacySlice('en'))
    expect(nl).toContain('ontwerpstudio')
    expect(nl).toContain('partnerprogramma te benaderen')
    expect(en).toContain('approaching design studios about our partner programme')
  })
})
