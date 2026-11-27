import { describe, expect, it } from 'vitest'

import preimage from '@/lib/contentRefactor/accpPreimage.json'
import * as COPY from '@/lib/contentRefactor/copy'
import { SOURCE_QUOTES, V5, type V5String } from '@/lib/contentRefactor/copyV5'
import { type Obj, sameValue } from '@/lib/contentRefactor/edit'
import { type Locale, PAGE_SLUGS, type PageDoc } from '@/lib/contentRefactor/pages'
import { fromSlugRefs } from '@/lib/contentRefactor/refs'
import { V5_SLUGS, page122, runRedesignV5, splitRung, v5Page } from '@/lib/contentRefactor/redesignV5'
import { productBlocks } from '@/blocks/product'

const LOCALES: Locale[] = ['nl', 'en']
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Keys whose values are structure, not copy. */
const NOT_COPY = new Set([
  'id', 'blockType', 'blockName', 'variant', 'type', 'page', 'kind', 'frameKind', 'anchor', 'layout', 'format',
  'indent', 'version', 'direction', 'mode', 'style', 'detail', 'textFormat', 'textStyle', 'linkType', 'newTab',
])

function leaves(value: unknown, out: string[] = [], key = ''): string[] {
  if (typeof value === 'string') {
    if (!NOT_COPY.has(key) && value.trim() && !value.startsWith('@')) out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) leaves(item, out, key)
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) leaves(v, out, k)
  }
  return out
}

const fold = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim()
const CORPUS = fold(
  [
    ...leaves([COPY.HOME, COPY.PRICING, COPY.PARTNER, COPY.CONTACT, COPY.NAV]),
    ...leaves(preimage),
    ...PAGE_SLUGS.flatMap((slug) => LOCALES.flatMap((l) => leaves(page122(slug, l)))),
    ...SOURCE_QUOTES,
  ].join('\n'),
)

function v5Strings(): V5String[] {
  const out: V5String[] = []
  const walk = (value: unknown) => {
    if (value && typeof value === 'object' && 'nl' in value && 'en' in value) out.push(value as V5String)
    else if (Array.isArray(value)) value.forEach(walk)
    else if (value && typeof value === 'object') Object.values(value).forEach(walk)
  }
  walk(V5)
  return out
}
const toConfirm = (l: Locale) => new Set(v5Strings().filter((s) => s.confirm?.includes(l)).map((s) => fold(s[l])))

describe('redesign v5 copy provenance', () => {
  for (const slug of V5_SLUGS) {
    for (const l of LOCALES) {
      it(`${slug}.${l}: every string is sourced or listed for Marketeer to confirm`, () => {
        const confirm = toConfirm(l)
        const unsourced = leaves(v5Page(slug, l)).filter((text) => !CORPUS.includes(fold(text)) && !confirm.has(fold(text)))
        expect(unsourced).toEqual([])
      })
    }
  }

  it('the copy-to-confirm list contains the partner steps heading', () => {
    expect(toConfirm('nl').has(fold('Zo werkt de samenwerking'))).toBe(true)
  })

  it('no prices outside the live set, no Cloudflare, no "altijd" in the trust bar, no "tot 35%" in headings', () => {
    for (const slug of V5_SLUGS) {
      for (const l of LOCALES) {
        const page = v5Page(slug, l)
        const before = new Set((JSON.stringify(page122(slug, l)).match(/€\s?[\d.,]+/g) ?? []).map((p) => p.replace(/\s/g, '')))
        const live = new Set(['€49', '€99', '€149', '€199', ...before])
        for (const price of JSON.stringify(page).match(/€\s?[\d.,]+/g) ?? []) expect(live).toContain(price.replace(/\s/g, ''))
        const added = leaves(page).filter((text) => !leaves(page122(slug, l)).includes(text))
        for (const text of added) expect(text).not.toMatch(/cloudflare/i)
        for (const block of page.layout as Obj[]) {
          if (block.blockType === 'trustBar') expect(JSON.stringify(block)).not.toMatch(/altijd|always/i)
          for (const heading of [block.title, (block.header as Obj | undefined)?.title]) {
            if (typeof heading === 'string') expect(heading).not.toMatch(/tot 35%|up to 35%/i)
          }
        }
      }
    }
  })
})

describe('redesign v5 layouts', () => {
  const types = (slug: (typeof V5_SLUGS)[number], l: Locale) => (v5Page(slug, l).layout as Obj[]).map((b) => b.blockType)

  it('home: hero, doors, steps, trust, FAQ, quote CTA (NL and EN the same)', () => {
    for (const l of LOCALES) expect(types('home', l)).toEqual(['productHero', 'doorCards', 'stepsShowcase', 'trustBar', 'accordion', 'cta'])
  })

  it('one primary CTA per hero, and the home H1 and buttons from the brief', () => {
    for (const slug of V5_SLUGS) {
      for (const l of LOCALES) {
        const hero = (v5Page(slug, l).layout as Obj[])[0]
        expect(hero.blockType).toBe('productHero')
        expect((hero.buttons as Obj[]).filter((b) => b.variant === 'primary')).toHaveLength(1)
      }
    }
    const home = (v5Page('home', 'nl').layout as Obj[])[0]
    expect(home.title).toBe('Wij bouwen en hosten uw website.')
    expect((home.buttons as Obj[]).map((b) => b.label)).toEqual(['Website laten maken', 'Voor ontwerpstudio’s'])
  })

  it('the hero frame differs per page; the CMS phone is on home only; one chip each', () => {
    const show = (slug: (typeof V5_SLUGS)[number]) => (v5Page(slug, 'nl').layout as Obj[])[0].showcase as Obj
    expect([show('home').kind, show('prijzen').kind, show('partnerprogramma').kind]).toEqual(['business', 'plans', 'studio'])
    expect([show('home').showPhone, show('prijzen').showPhone, show('partnerprogramma').showPhone]).toEqual([true, false, false])
    expect([show('home').badge, show('prijzen').badge, show('partnerprogramma').badge]).toEqual(['vanaf €49 / mnd', 'Managed · Aanbevolen €99', 'basis 10%'])
  })

  it('partner: the lower heading does not repeat the H1', () => {
    for (const l of LOCALES) {
      const layout = v5Page('partnerprogramma', l).layout as Obj[]
      const h1 = layout[0].title as string
      const steps = layout.find((b) => b.blockType === 'stepsShowcase')
      expect(steps?.title).toBe(V5.partner.stepsTitle[l])
      const heading = steps?.title as string
      expect(fold(heading)).not.toBe(fold(h1))
      expect(heading.slice(0, 8)).not.toBe(h1.slice(0, 8))
    }
  })

  it('every new block has an anchor or sits in the hero; contact is not touched', () => {
    for (const slug of V5_SLUGS) for (const l of LOCALES) for (const block of v5Page(slug, l).layout as Obj[]) {
      if (['doorCards', 'stepsShowcase', 'pricingCards', 'ladderSteps', 'productShowcase'].includes(block.blockType as string)) expect(block.anchor).toBeTruthy()
    }
    expect(V5_SLUGS).not.toContain('contact')
  })

  it('splitRung', () => {
    expect(splitRung('Basis 10%')).toEqual(['Basis', '10%'])
    expect(splitRung('Eerste lijn +10%')).toEqual(['Eerste lijn', '+10%'])
    expect(() => splitRung('Basis')).toThrow()
  })

  it('every product block config has an anchor field', () => {
    expect(productBlocks.map((b) => b.slug).sort()).toEqual(['doorCards', 'ladderSteps', 'pricingCards', 'productHero', 'productShowcase', 'stepsShowcase', 'trustBar'])
    for (const block of productBlocks) expect(block.fields.some((f) => 'name' in f && f.name === 'anchor')).toBe(true)
  })
})

/* ── Guards: a fake Payload with drafts and published versions per page-locale ── */
type Row = { draft: Obj; published: Obj }
/** The four pages plus every page the drafts link to (`@slug` refs). */
const REFERENCED = [
  ...new Set(
    [...PAGE_SLUGS.flatMap((slug) => LOCALES.map((l) => page122(slug, l))), ...V5_SLUGS.flatMap((slug) => LOCALES.map((l) => v5Page(slug, l)))]
      .flatMap((page) => JSON.stringify(page).match(/"@[a-z0-9-]+"/g) ?? [])
      .map((ref) => ref.slice(2, -1)),
  ),
].filter((slug) => !(PAGE_SLUGS as readonly string[]).includes(slug))
const SLUG_IDS = Object.fromEntries([...PAGE_SLUGS, ...REFERENCED].map((slug, i) => [slug, i + 1])) as Record<string, number>
const idBySlug = new Map(Object.entries(SLUG_IDS))

function fakePayload(start: (slug: string, l: Locale) => PageDoc, extraDocs: { id: number; slug: string }[] = []) {
  const db = new Map<string, Row>()
  for (const slug of PAGE_SLUGS) for (const l of LOCALES) {
    const doc = fromSlugRefs(clone(start(slug, l)), idBySlug) as unknown as Obj
    // The published side stands for the accp snapshot: never equal to a draft here.
    db.set(`${String(SLUG_IDS[slug])}.${l}`, { draft: doc, published: { layout: [], meta: { title: 'published' } } })
  }
  const writes: string[] = []
  const payload = {
    collections: { pages: { config: { flattenedFields: [{ name: 'slug' }] } } },
    logger: { info: () => undefined, warn: () => undefined },
    find: () => Promise.resolve({ docs: [...Object.keys(SLUG_IDS).map((slug) => ({ id: SLUG_IDS[slug], slug })), ...extraDocs] }),
    findByID: ({ id, locale, draft }: { id: number; locale: Locale; draft: boolean }) => {
      const row = db.get(`${String(id)}.${locale}`)
      return Promise.resolve(clone(draft ? row?.draft : row?.published))
    },
    update: ({ id, locale, draft, data }: { id: number; locale: Locale; draft: boolean; data: Obj }) => {
      expect(draft).toBe(true)
      expect(data._status).toBe('draft')
      const row = db.get(`${String(id)}.${locale}`)
      if (row) row.draft = { layout: clone(data.layout), meta: clone(data.meta) }
      writes.push(`${String(id)}.${locale}`)
      return Promise.resolve(data)
    },
  }
  const draftOf = (slug: string, l: Locale) => db.get(`${String(SLUG_IDS[slug])}.${l}`)
  return { payload: payload as never, db, writes, draftOf }
}

const isV5 = (slug: string): slug is (typeof V5_SLUGS)[number] => (V5_SLUGS as readonly string[]).includes(slug)

describe('redesign v5 migration guards', () => {
  it('up from the #122 drafts writes 6 drafts and leaves contact; a second up is a no-op', async () => {
    const fake = fakePayload(page122)
    const first = await runRedesignV5({ payload: fake.payload, direction: 'up' })
    expect(first.written).toHaveLength(6)
    expect(first.skipped).toEqual([])
    for (const slug of V5_SLUGS) for (const l of LOCALES) expect(sameValue(fake.draftOf(slug, l)?.draft, fromSlugRefs(v5Page(slug, l), idBySlug))).toBe(true)
    expect(fake.writes.some((w) => w.startsWith(`${String(SLUG_IDS.contact)}.`))).toBe(false)
    const second = await runRedesignV5({ payload: fake.payload, direction: 'up' })
    expect(second.written).toEqual([])
    expect(second.unchanged).toHaveLength(6)
  })

  it('up skips an edited draft and still migrates the others', async () => {
    const fake = fakePayload((slug, l) => {
      const page = page122(slug, l)
      return slug === 'prijzen' && l === 'en' ? { ...page, meta: { ...page.meta, title: 'edited' } } : page
    })
    const report = await runRedesignV5({ payload: fake.payload, direction: 'up' })
    expect(report.written).toHaveLength(5)
    expect(report.skipped).toHaveLength(1)
    expect(report.skipped[0]).toMatch(/^prijzen\.en/)
  })

  it('down restores the #122 drafts; skips edited v5 drafts and published v5 drafts', async () => {
    const fake = fakePayload((slug, l) => (isV5(slug) ? v5Page(slug, l) : page122(slug, l)))
    // home.nl: v5 went live; partnerprogramma.en: edited after v5
    const homeNl = fake.draftOf('home', 'nl')
    if (homeNl) homeNl.published = clone(homeNl.draft)
    const partnerEn = fake.draftOf('partnerprogramma', 'en')
    if (partnerEn) partnerEn.draft = { ...partnerEn.draft, meta: { title: 'edited' } }
    const report = await runRedesignV5({ payload: fake.payload, direction: 'down' })
    expect(report.written).toHaveLength(4)
    expect(report.skipped.map((s) => s.split(':')[0]).sort()).toEqual(['home.nl', 'partnerprogramma.en'])
    expect(sameValue(fake.draftOf('prijzen', 'nl')?.draft, fromSlugRefs(page122('prijzen', 'nl'), idBySlug))).toBe(true)
  })

  it('a duplicate slug aborts before any write', async () => {
    const fake = fakePayload(page122, [{ id: 99, slug: 'home' }])
    await expect(runRedesignV5({ payload: fake.payload, direction: 'up' })).rejects.toThrow(/more than one page/)
    expect(fake.writes).toEqual([])
  })
})
