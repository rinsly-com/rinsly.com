import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { productHeroBlock } from '@/blocks/product'
import { V5 } from '@/lib/contentRefactor/copyV5'
import { V8 } from '@/lib/contentRefactor/copyV8'
import { type Obj, sameValue } from '@/lib/contentRefactor/edit'
import { type Locale, PAGE_SLUGS, type PageDoc, type PageSlug } from '@/lib/contentRefactor/pages'
import { V5_SLUGS, page122, v5Page } from '@/lib/contentRefactor/redesignV5'
import { V8_SHOWCASE_FIELDS, V8_SLUGS, buildV8Page, runRedesignV8, v8Page } from '@/lib/contentRefactor/redesignV8'
import { fromSlugRefs } from '@/lib/contentRefactor/refs'

const LOCALES: Locale[] = ['nl', 'en']
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const layout = (doc: PageDoc) => doc.layout as Obj[]
const hero = (slug: (typeof V8_SLUGS)[number], l: Locale) => layout(v8Page(slug, l))[0]
const showcase = (slug: (typeof V8_SLUGS)[number], l: Locale) => hero(slug, l).showcase as Obj
const byType = (doc: PageDoc, type: string) => layout(doc).filter((b) => b.blockType === type)

/** Sources, read from the box at test time when present (CI has no /workspace): a missing file skips the quote check. */
const read = (path: string): string | null => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}
const CHANGE_TABLE = read('/workspace/redesign-2026-11-27/v6/CHANGE-TABLE.md')

describe('redesign v8 drafts: CHANGE-TABLE (v6 first-screen dedupe)', () => {
  it('home: sub and closing CTA text are the new home sub; no €49 in the sub, frame badge or door 2 bullets', () => {
    for (const l of LOCALES) {
      const doc = v8Page('home', l)
      expect(hero('home', l).sub).toBe(V8.home.sub[l])
      expect(byType(doc, 'cta')[0].text).toBe(V8.home.sub[l])
      expect(showcase('home', l).badge).toBe(V8.home.badge[l])
      const door2 = (byType(doc, 'doorCards')[0].doors as Obj[])[1]
      expect((door2.bullets as Obj[]).map((b) => b.text)).toEqual(V8.home.door2Bullets.map((b) => b[l]))
      for (const text of [hero('home', l).sub, showcase('home', l).badge, ...(door2.bullets as Obj[]).map((b) => b.text)]) expect(text).not.toMatch(/€/)
    }
    expect(showcase('home', 'nl').badge).toBe('Bouw · Hosting · Onderhoud')
    expect(showcase('home', 'en').badge).toBe('Build · Hosting · Maintenance')
  })

  it('home: €49 once in the hero (chip) and once in door 2 (price); trust bar item 1 has no price', () => {
    for (const l of LOCALES) {
      const doc = v8Page('home', l)
      expect(hero('home', l).priceChip).toEqual(layout(v5Page('home', l))[0].priceChip)
      expect(JSON.stringify(hero('home', l)).match(/€49/g)).toHaveLength(1)
      const door2 = (byType(doc, 'doorCards')[0].doors as Obj[])[1]
      expect(JSON.stringify(door2).match(/€49/g)).toHaveLength(1)
      const trust = byType(doc, 'trustBar')[0].items as Obj[]
      expect(trust[0].text).toBe(V8.home.trust0[l])
      expect(JSON.stringify(trust)).not.toMatch(/€/)
    }
  })

  it('prijzen: no hero price chip, Managed frame chip unchanged, B2B shared line and P-03 note kept', () => {
    for (const l of LOCALES) {
      const doc = v8Page('prijzen', l)
      const chip = hero('prijzen', l).priceChip as Obj
      expect(chip.amount ?? null).toBeNull()
      expect(chip.suffix ?? null).toBeNull()
      expect(showcase('prijzen', l).badge).toBe(V5.prijzen.badge[l])
      expect(byType(doc, 'pricingCards')[0].sharedLine).toContain(l === 'nl' ? 'Alleen voor zakelijke opdrachtgevers' : 'Business clients only')
      const p03 = layout(page122('prijzen', l)).find((b) => JSON.stringify(b).includes(l === 'nl' ? 'vanaf €2.500' : 'from €2,500'))
      expect(p03).toBeDefined()
      expect(layout(doc)).toContainEqual(p03)
    }
  })

  it('partner: frame chip is the invoice-choice line, 10% only in the hero chip', () => {
    for (const l of LOCALES) {
      expect(showcase('partnerprogramma', l).badge).toBe(V8.partner.badge[l])
      expect(JSON.stringify(hero('partnerprogramma', l)).match(/10%/g)).toHaveLength(1)
    }
    expect(showcase('partnerprogramma', 'nl').badge).toBe('Jij kiest wie de klant factureert.')
  })

  it('every CHANGE-TABLE "New" string used here is quoted verbatim in the table (box only)', () => {
    if (!CHANGE_TABLE) return
    const table = CHANGE_TABLE
    for (const value of [V8.home.sub, V8.home.badge, V8.home.trust0, V8.partner.badge, V8.home.door2Bullets[0]]) {
      expect(table).toContain(value.nl)
      expect(table).toContain(value.en)
    }
  })
})

describe('redesign v8 drafts: frames and the rest', () => {
  it('frame kinds: business + phone on home, Live/Staging on prijzen, studio on partner; caption kept', () => {
    for (const l of LOCALES) {
      expect([showcase('home', l).kind, showcase('prijzen', l).kind, showcase('partnerprogramma', l).kind]).toEqual(['business', 'environments', 'studio'])
      expect(showcase('home', l).showPhone).toBe(true)
      for (const slug of V8_SLUGS) expect(showcase(slug, l).caption).toBe(V5.common.caption[l])
      for (const slug of V8_SLUGS) expect(showcase(slug, l).url).toBe((layout(v5Page(slug, l))[0].showcase as Obj).url)
    }
    expect(showcase('home', 'nl').saveLabel).toBe('Opslaan')
    expect([showcase('prijzen', 'nl').liveLabel, showcase('prijzen', 'nl').stagingLabel]).toEqual(['Live', 'Staging'])
  })

  it('EN gaps stay empty (no invented copy): phone save button, Live/Staging labels', () => {
    expect(showcase('home', 'en').saveLabel ?? null).toBeNull()
    expect(showcase('prijzen', 'en').liveLabel ?? null).toBeNull()
    expect(showcase('prijzen', 'en').stagingLabel ?? null).toBeNull()
    expect([V8.home.saveLabel.en, V8.prijzen.liveLabel.en, V8.prijzen.stagingLabel.en]).toEqual([null, null, null])
  })

  it('only the listed fields change: v8 minus the edits is the v5 draft', () => {
    for (const slug of V8_SLUGS) {
      for (const l of LOCALES) {
        const v5 = v5Page(slug, l)
        const v8 = v8Page(slug, l)
        expect(v8.meta).toEqual(v5.meta)
        expect(layout(v8).map((b) => b.id)).toEqual(layout(v5).map((b) => b.id))
        const changed = layout(v8).filter((b, i) => !sameValue(b, layout(v5)[i])).map((b) => b.id)
        const expected = { home: ['home-hero', 'home-doors', 'home-trust', 'home-cta'], prijzen: ['prijzen-hero'], partnerprogramma: ['partner-hero'] }[slug]
        expect(changed).toEqual(expected.map((name) => `v5-20261127-${l}-${name}`))
      }
    }
  })

  it('the transform refuses a base that is not the v5 draft', () => {
    const base = clone(v5Page('partnerprogramma', 'nl'))
    ;(layout(base)[0].showcase as Obj).badge = 'edited'
    expect(() => buildV8Page('partnerprogramma', 'nl', base)).toThrow(/expected "basis 10%"/)
    expect(() => buildV8Page('home', 'nl', { layout: [], meta: {} })).toThrow(/expected one block/)
  })

  it('the schema has the three frame label fields and the environments kind', () => {
    const group = productHeroBlock.fields.find((f) => 'name' in f && f.name === 'showcase') as { fields: { name?: string; options?: { value: string }[] }[] }
    expect(group.fields.map((f) => f.name)).toEqual(expect.arrayContaining(['saveLabel', 'liveLabel', 'stagingLabel']))
    expect(group.fields.find((f) => f.name === 'kind')?.options?.map((o) => o.value)).toEqual(['business', 'plans', 'studio', 'environments'])
  })

  it('no Cloudflare, no prices outside the v5 set', () => {
    for (const slug of V8_SLUGS) for (const l of LOCALES) {
      const text = JSON.stringify(v8Page(slug, l))
      expect(text).not.toMatch(/cloudflare/i)
      const v5Prices = new Set(JSON.stringify(v5Page(slug, l)).match(/€\s?[\d.,]+/g) ?? [])
      for (const price of text.match(/€\s?[\d.,]+/g) ?? []) expect(v5Prices).toContain(price)
    }
  })
})

/* ── Guards: a fake Payload with drafts and published versions per page-locale ── */
type Row = { draft: Obj; published: Obj }
const REFERENCED = [
  ...new Set(
    [...PAGE_SLUGS.flatMap((slug) => LOCALES.map((l) => page122(slug, l))), ...V5_SLUGS.flatMap((slug) => LOCALES.map((l) => v8Page(slug, l)))]
      .flatMap((page) => JSON.stringify(page).match(/"@[a-z0-9-]+"/g) ?? [])
      .map((ref) => ref.slice(2, -1)),
  ),
].filter((slug) => !(PAGE_SLUGS as readonly string[]).includes(slug))
const SLUG_IDS = Object.fromEntries([...PAGE_SLUGS, ...REFERENCED].map((slug, i) => [slug, i + 1])) as Record<string, number>
const idBySlug = new Map(Object.entries(SLUG_IDS))
const isRedesign = (slug: PageSlug): slug is (typeof V8_SLUGS)[number] => (V8_SLUGS as readonly PageSlug[]).includes(slug)

function fakePayload(start: (slug: PageSlug, l: Locale) => PageDoc) {
  const db = new Map<string, Row>()
  for (const slug of PAGE_SLUGS) for (const l of LOCALES) {
    const doc = fromSlugRefs(clone(start(slug, l)), idBySlug) as unknown as Obj
    db.set(`${String(SLUG_IDS[slug])}.${l}`, { draft: doc, published: { layout: [], meta: { title: 'published' } } })
  }
  const writes: string[] = []
  const sent: Obj[] = []
  const payload = {
    collections: { pages: { config: { flattenedFields: [{ name: 'slug' }] } } },
    logger: { info: () => undefined, warn: () => undefined },
    find: () => Promise.resolve({ docs: Object.keys(SLUG_IDS).map((slug) => ({ id: SLUG_IDS[slug], slug })) }),
    findByID: ({ id, locale, draft }: { id: number; locale: Locale; draft: boolean }) => {
      const row = db.get(`${String(id)}.${locale}`)
      return Promise.resolve(clone(draft ? row?.draft : row?.published))
    },
    update: ({ id, locale, draft, data }: { id: number; locale: Locale; draft: boolean; data: Obj }) => {
      // Drafts only, never a publish.
      expect(draft).toBe(true)
      expect(data._status).toBe('draft')
      const row = db.get(`${String(id)}.${locale}`)
      if (row) row.draft = { layout: clone(data.layout), meta: clone(data.meta) }
      writes.push(`${String(id)}.${locale}`)
      sent.push(clone(data))
      return Promise.resolve(data)
    },
  }
  const draftOf = (slug: string, l: Locale) => db.get(`${String(SLUG_IDS[slug])}.${l}`)
  return { payload: payload as never, writes, sent, draftOf }
}
const v5State = (slug: PageSlug, l: Locale) => (isRedesign(slug) ? v5Page(slug, l) : page122(slug, l))
const v8State = (slug: PageSlug, l: Locale) => (isRedesign(slug) ? v8Page(slug, l) : page122(slug, l))

describe('redesign v8 migration guards', () => {
  it('up from the v5 drafts writes 6 drafts, leaves contact; a second up is a no-op', async () => {
    const fake = fakePayload(v5State)
    const first = await runRedesignV8({ payload: fake.payload, direction: 'up' })
    expect(first.written).toHaveLength(6)
    expect(first.skipped).toEqual([])
    for (const slug of V8_SLUGS) for (const l of LOCALES) expect(sameValue(fake.draftOf(slug, l)?.draft, fromSlugRefs(v8Page(slug, l), idBySlug))).toBe(true)
    expect(fake.writes.some((w) => w.startsWith(`${String(SLUG_IDS.contact)}.`))).toBe(false)
    const second = await runRedesignV8({ payload: fake.payload, direction: 'up' })
    expect(second.written).toEqual([])
    expect(second.unchanged).toHaveLength(6)
  })

  it('up skips a draft a person edited after the v5 migration (and a page still at #122)', async () => {
    const fake = fakePayload((slug, l) => {
      if (slug === 'home' && l === 'en') return { ...v5Page(slug, l), meta: { ...v5Page(slug, l).meta, title: 'edited' } }
      if (slug === 'prijzen' && l === 'nl') return page122(slug, l)
      return v5State(slug, l)
    })
    const report = await runRedesignV8({ payload: fake.payload, direction: 'up' })
    expect(report.written).toHaveLength(4)
    expect(report.skipped.map((s) => s.split(':')[0]).sort()).toEqual(['home.en', 'prijzen.nl'])
    expect(fake.draftOf('home', 'en')?.draft.meta).toMatchObject({ title: 'edited' })
  })

  it('down restores the v5 drafts; skips edited and published v8 drafts; a second down is a no-op', async () => {
    const fake = fakePayload(v8State)
    const homeNl = fake.draftOf('home', 'nl')
    if (homeNl) homeNl.published = clone(homeNl.draft)
    const partnerEn = fake.draftOf('partnerprogramma', 'en')
    if (partnerEn) partnerEn.draft = { ...partnerEn.draft, meta: { title: 'edited' } }
    const report = await runRedesignV8({ payload: fake.payload, direction: 'down' })
    expect(report.written).toHaveLength(4)
    expect(report.skipped.map((s) => s.split(':')[0]).sort()).toEqual(['home.nl', 'partnerprogramma.en'])
    expect(sameValue(fake.draftOf('prijzen', 'nl')?.draft, fromSlugRefs(v5Page('prijzen', 'nl'), idBySlug))).toBe(true)
    // Payload keeps a stored field the update leaves out: down() sends the v8-only frame fields as explicit nulls.
    for (const write of fake.sent) {
      const showcase = (write.layout as Obj[])[0].showcase as Obj
      for (const key of V8_SHOWCASE_FIELDS) expect(showcase).toHaveProperty(key, null)
    }
    const again = await runRedesignV8({ payload: fake.payload, direction: 'down' })
    expect(again.written).toEqual([])
    expect(again.unchanged).toHaveLength(4)
  })
})
