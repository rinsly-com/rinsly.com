import { describe, expect, it } from 'vitest'

import preimage from '@/lib/contentRefactor/accpPreimage.json'
import { EditLog, sameValue, setField } from '@/lib/contentRefactor/edit'
import { type FooterDoc, type HeaderDoc, transformFooter, transformHeader } from '@/lib/contentRefactor/globals'
import { type Locale, PAGE_SLUGS, type PageDoc, type PageSlug, transformPage } from '@/lib/contentRefactor/pages'
import { fromSlugRefs, toSlugRefs } from '@/lib/contentRefactor/refs'
import { indexPages } from '@/lib/contentRefactor/run'

type Snapshot = {
  pages: Record<PageSlug, Record<Locale, PageDoc>>
  globals: { header: Record<Locale, HeaderDoc>; footer: Record<Locale, FooterDoc> }
}
const SNAP = preimage as unknown as Snapshot
const LOCALES: Locale[] = ['nl', 'en']
const text = (value: unknown) => JSON.stringify(value)

/** Strings the brief (§1) and the flags table keep off every page while the flags are off. */
const FORBIDDEN = [
  /Gratis bouw/i,
  /Free build/i,
  /€0\b/,
  /afkoop/i,
  /resterende maanden/i,
  /remaining months/i,
  /(^|[^0-9])0%/,
  /van 0% tot 35%|from 0% to 35%/,
  /halve minuut|half a minute/i,
  /nooit stilletjes|never throttle/i,
  /Time Travel/,
  /al onze sites|every site at the same time/i,
  /Rinse|Yaron|Schaeffer/,
  /Volledig ontzorgd/,
  /geen enkele overbodige|none of the pointless/,
  /Framer/,
  /uptime/i,
  /back-ups|backups/i,
  /Snel, ook op een telefoon|binnen een (week|dag|werkdag)|gegarandeerde reactietijd/i,
]
/** Dutch left on EN pages (brief §0.8). */
const FORBIDDEN_EN = [/meerwerk/, /€2\.500/, /\bOp maat\b/]

describe('content refactor: pages (accp snapshot of 27 Nov 16:15)', () => {
  for (const slug of PAGE_SLUGS) {
    for (const l of LOCALES) {
      const pre = SNAP.pages[slug][l]
      it(`${slug}.${l}: applies cleanly, with no conflicts`, () => {
        const { log } = transformPage(slug, l, pre, pre)
        expect(log.conflicts).toEqual([])
        expect(log.applied.length).toBeGreaterThan(0)
      })
      it(`${slug}.${l}: is idempotent`, () => {
        const once = transformPage(slug, l, pre, pre).doc
        const twice = transformPage(slug, l, once, pre)
        expect(twice.log.conflicts).toEqual([])
        expect(twice.log.applied).toEqual([])
        expect(sameValue(twice.doc, once)).toBe(true)
      })
      it(`${slug}.${l}: leaves no forbidden string`, () => {
        const out = text(transformPage(slug, l, pre, pre).doc)
        for (const pattern of FORBIDDEN) expect(out, String(pattern)).not.toMatch(pattern)
        if (l === 'en') for (const pattern of FORBIDDEN_EN) expect(out, String(pattern)).not.toMatch(pattern)
      })
      it(`${slug}.${l}: keeps every page relation as a known slug`, () => {
        const out = text(transformPage(slug, l, pre, pre).doc)
        const refs = [...out.matchAll(/"page":"@([a-z-]+)"/g)].map((m) => m[1])
        for (const ref of refs) expect(['home', 'partnerprogramma', 'platform', 'prijzen', 'website', 'over', 'contact']).toContain(ref)
      })
    }
  }

  it('skips a page whose guarded field changed after the snapshot', () => {
    const pre = SNAP.pages.prijzen.nl
    const edited = JSON.parse(JSON.stringify(pre)) as PageDoc
    ;(edited.meta as { title: string }).title = 'Iemand heeft dit via het endpoint aangepast'
    const { log } = transformPage('prijzen', 'nl', edited, pre)
    expect(log.conflicts.some((c) => c.includes('meta.title'))).toBe(true)
  })

  it('keeps edits made elsewhere on the page (Batch A/B/C carry-over)', () => {
    const pre = SNAP.pages.home.nl
    const edited = JSON.parse(JSON.stringify(pre)) as PageDoc
    const tech = edited.layout.find((b) => (b as { id: string }).id === '6b08713abb5dd40a0f68afaa') as { title: string }
    tech.title = 'Endpoint-tekst die blijft'
    const { doc, log } = transformPage('home', 'nl', edited, pre)
    expect(log.conflicts).toEqual([])
    expect(text(doc)).toContain('Endpoint-tekst die blijft')
  })

  it('home: doors are the verbatim H-04 texts, whole', () => {
    const out = text(transformPage('home', 'nl', SNAP.pages.home.nl, SNAP.pages.home.nl).doc)
    expect(out).toContain('Ontwerpstudio’s en freelance ontwerpers: jullie ontwerpen, wij bouwen en hosten.')
    expect(out).toContain('Bedrijven: een website die wij bouwen en onderhouden.')
  })

  it('EN gets no untraced strings: no steps title, no DPA FAQ item', () => {
    const home = transformPage('home', 'en', SNAP.pages.home.en, SNAP.pages.home.en).doc
    const steps = home.layout.find((b) => (b as { id: string }).id === 'refactor-20261127-en-home-steps') as { header: { title: unknown } }
    expect(steps.header.title).toBeNull()
    expect(text(transformPage('prijzen', 'en', SNAP.pages.prijzen.en, SNAP.pages.prijzen.en).doc)).not.toContain('refactor-20261127-en-prijzen-faq-dpa')
  })

  it('home: doors, steps and trust strip sit directly under the hero, business CTA closes', () => {
    const ids = transformPage('home', 'nl', SNAP.pages.home.nl, SNAP.pages.home.nl).doc.layout.map((b) => (b as { id: string }).id)
    expect(ids.slice(1, 4)).toEqual([
      '6b08713abb5dd40a0f68afab',
      'refactor-20261127-nl-home-steps',
      'refactor-20261127-nl-home-trust',
    ])
    expect(ids.at(-1)).toBe('refactor-20261127-nl-home-closing-business')
  })

  it('prijzen: plans directly under the H1, DPA line once, cost/lock-in FAQs out', () => {
    const doc = transformPage('prijzen', 'nl', SNAP.pages.prijzen.nl, SNAP.pages.prijzen.nl).doc
    const types = doc.layout.map((b) => (b as { blockType: string }).blockType)
    expect(types.slice(0, 2)).toEqual(['hero', 'pricing'])
    const out = text(doc)
    expect(out).toContain('Prijzen: hosting vanaf €49 per maand')
    expect(out.match(/Verwerkersovereenkomst \(AVG\)/g)?.length).toBe(1)
    expect(out).not.toContain('Wat kost het bouwen van de website?')
    expect(out).not.toContain('Zit ik ergens aan vast?')
    expect(out).toContain('Wat houdt e-mailondersteuning bij Care in?')
  })

  it('partnerprogramma: ladder is v3.3 (Basis 10, Eerste lijn +10, Verkoop +10, Volume +5)', () => {
    const out = text(transformPage('partnerprogramma', 'nl', SNAP.pages.partnerprogramma.nl, SNAP.pages.partnerprogramma.nl).doc)
    for (const rung of ['Basis 10%', 'Eerste lijn +10%', 'Verkoop +10%', 'Volume +5%']) expect(out).toContain(rung)
    expect(out).not.toMatch(/Exclusiviteit|Relatiebeheer|Portfolio boven/)
    expect(out).toContain('volgens de partnervoorwaarden')
  })
})

describe('content refactor: header and footer', () => {
  for (const l of LOCALES) {
    it(`header.${l}: business door first, studios second, Websitecheck out, idempotent`, () => {
      const pre = SNAP.globals.header[l]
      const { doc, log } = transformHeader(l, pre, pre)
      expect(log.conflicts).toEqual([])
      const labels = doc.navItems.map((n) => (n as { label: string }).label)
      expect(labels[0]).toBe(l === 'nl' ? 'Website laten maken' : 'Get a website built')
      expect(labels[1]).toBe(l === 'nl' ? 'Voor ontwerpstudio’s' : 'For design studios')
      expect(labels).not.toContain(l === 'nl' ? 'Websitecheck' : 'Website check')
      expect(doc.cta).toEqual(pre.cta)
      expect(transformHeader(l, doc, pre).log.applied).toEqual([])
    })
    it(`footer.${l}: tagline for both audiences, address, no owner name, idempotent`, () => {
      const pre = SNAP.globals.footer[l]
      const { doc, log } = transformFooter(l, pre, pre)
      expect(log.conflicts).toEqual([])
      expect(doc.address).toBe('Kazernestraat 6, 3441 BB Woerden')
      expect(doc.phone).toBeNull()
      expect(text(doc)).not.toMatch(/Rinse|Yaron|Schaeffer/)
      expect(transformFooter(l, doc, pre).log.applied).toEqual([])
    })
  }
})

describe('content refactor: helpers', () => {
  it('setField refuses to overwrite an unexpected value', () => {
    const log = new EditLog()
    const holder = { title: 'anders' }
    setField(log, 'x', holder, 'title', 'oud', 'nieuw')
    expect(holder.title).toBe('anders')
    expect(log.conflicts).toHaveLength(1)
  })
  it('slug refs round-trip', () => {
    const doc = { a: [{ page: 9 }, { page: { id: 4, slug: 'x' } }] }
    const slugs = new Map([[9, 'contact'], [4, 'partnerprogramma']])
    const refs = toSlugRefs(doc, slugs)
    expect(refs).toEqual({ a: [{ page: '@contact' }, { page: '@partnerprogramma' }] })
    expect(fromSlugRefs(refs, new Map([['contact', 2], ['partnerprogramma', 3]]))).toEqual({ a: [{ page: 2 }, { page: 3 }] })
  })

  it('page lookup fails closed on a duplicate slug', () => {
    expect(() => indexPages([{ id: 1, slug: 'home' }, { id: 2, slug: 'home' }])).toThrow(/more than one page with slug "home"/)
    expect(indexPages([{ id: 1, slug: 'home' }, { id: 2, slug: null }]).idBySlug.get('home')).toBe(1)
  })
})
