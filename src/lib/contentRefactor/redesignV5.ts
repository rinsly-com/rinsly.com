/**
 * Redesign direction B v5 (27 Nov 2026): the target layout of the home,
 * prijzen and partnerprogramma drafts, built from the #122 drafts.
 * Used by migration 20261127_200500_redesign_v5_content and by the publish
 * manifest (publish.ts).
 *
 * `buildV5Page` is pure: it takes the #122 draft of a page-locale (as the #122
 * migration produces it from the accp snapshot) and returns the v5 draft. Text
 * that already exists in the #122 draft is carried over by reference; new
 * strings come from copyV5.ts. The contact page is not part of the redesign
 * (V5_SLUGS) and is never read or written here.
 *
 * Safety rules (the same as #122, run.ts):
 *  - Whole-document compare-and-set per page-locale. Up writes only when the
 *    latest draft is exactly the #122 draft; down only when it is exactly the
 *    v5 draft and the v5 draft was never published. Anything else is skipped
 *    and logged, never overwritten.
 *  - Drafts only (`_status: 'draft'`, `draft: true`). Nothing is published;
 *    the publish step (publish.ts, manifest) is a separate, guarded run.
 *  - Page lookup fails closed (duplicate slug, tenant field) before any read.
 *  - Every target is computed before the first write.
 */
import type { Payload, PayloadRequest } from 'payload'

import preimage from './accpPreimage.json'
import { NAV, PARTNER, PRICING } from './copy'
import { V5, type V5String } from './copyV5'
import { type Json, type Obj, lexicalParagraphs, sameValue } from './edit'
import { IDS, type Locale, type PageDoc, type PageSlug, newId, transformPage } from './pages'
import { fromSlugRefs, toSlugRefs } from './refs'
import { pageIds } from './run'

const SNAPSHOT = (preimage as unknown as { pages: Record<PageSlug, Record<Locale, PageDoc>> }).pages

/** The #122 draft of a page-locale: the #122 transform applied to the accp snapshot (as publish.ts migratedPage). */
export function page122(slug: PageSlug, locale: Locale): PageDoc {
  const { layout, meta } = SNAPSHOT[slug][locale]
  const pre: PageDoc = { layout, meta }
  return transformPage(slug, locale, pre, pre).doc
}

/** The pages this redesign changes. Contact stays as the #122 draft. */
export const V5_SLUGS = ['home', 'prijzen', 'partnerprogramma'] as const satisfies readonly PageSlug[]
export type V5Slug = (typeof V5_SLUGS)[number]
const LOCALES: Locale[] = ['nl', 'en']

/** Deterministic ids for v5 blocks and rows, so a re-run finds them. */
export const v5Id = (locale: Locale, name: string): string => `v5-20261127-${locale}-${name}`

const tx = (value: V5String, l: Locale): string => value[l]
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Exactly one block in the #122 draft matching `pred`, or the transform is wrong. */
function only(base: PageDoc, what: string, pred: (block: Obj) => boolean): Obj {
  const found = base.layout.filter((block): block is Obj => isObj(block) && pred(block))
  if (found.length !== 1) throw new Error(`[redesign-v5] expected one ${what} in the #122 draft, found ${String(found.length)}`)
  return clone(found[0])
}
const byBlockId = (base: PageDoc, id: string) => only(base, `block ${id}`, (block) => block.id === id)
const str = (value: Json | undefined): string => (typeof value === 'string' ? value : '')
const obj = (value: Json | undefined): Obj => (isObj(value) ? value : {})
const list = (value: Json | undefined): Obj[] => (Array.isArray(value) ? value.filter(isObj) : [])

/**
 * A link in the shape Payload reads back (site-core link fields), so a
 * re-run compares equal: every select/radio default is written explicitly.
 */
const link = (id: string | null, label: string, page: string, variant: 'primary' | 'secondary' = 'primary'): Obj => ({
  ...(id ? { id } : {}),
  label,
  variant,
  type: 'internal',
  page,
  url: null,
  anchor: null,
  newTab: false,
})
const lines = (l: Locale, prefix: string, items: readonly V5String[]): Obj[] =>
  items.map((item, i) => ({ id: v5Id(l, `${prefix}-${String(i + 1)}`), text: tx(item, l) }))
const steps = (l: Locale, prefix: string, rows: { title: string; text: string | null; frameKind: string }[]): Obj[] =>
  rows.map((row, i) => ({
    id: v5Id(l, `${prefix}-${String(i + 1)}`),
    label: tx(V5.common.step[i], l),
    title: row.title,
    text: row.text,
    frameKind: row.frameKind,
  }))
const faqItem = (id: string, title: string, body: string): Obj => ({ id, title, body: lexicalParagraphs(body) })
const stripNumber = (title: string): string => title.replace(/^\d+\.\s*/, '')
/** Text of the first paragraph of a Lexical value (the #122 rich-text blocks are one text node per paragraph). */
function firstParagraph(content: Json | undefined): string {
  const para = list(obj(obj(content).root).children).at(0)
  const text = list(para?.children).map((child) => str(child.text)).join('')
  if (!text) throw new Error('[redesign-v5] #122 rich text has no first paragraph')
  return text
}

const quote = (l: Locale) => (l === 'nl' ? 'Vraag een offerte aan' : 'Request a quote')

function home(base: PageDoc, l: Locale): PageDoc {
  const hero = byBlockId(base, IDS.home[l].hero)
  const header = obj(hero.header)
  const h = V5.home
  return {
    meta: clone(base.meta),
    layout: [
      {
        id: v5Id(l, 'home-hero'),
        blockType: 'productHero',
        eyebrow: str(header.eyebrow),
        title: tx(h.h1, l),
        sub: tx(h.sub, l),
        priceChip: { amount: '€49', suffix: tx(V5.common.perMonthExcl, l) },
        buttons: [
          link(v5Id(l, 'home-hero-b1'), NAV.website[l], '@website'),
          link(v5Id(l, 'home-hero-b2'), NAV.studios[l], '@partnerprogramma', 'secondary'),
        ],
        variant: 'split',
        showcase: { kind: 'business', url: tx(h.url, l), badge: tx(h.badge, l), caption: tx(V5.common.caption, l), showPhone: true },
        anchor: null,
      },
      {
        id: v5Id(l, 'home-doors'),
        blockType: 'doorCards',
        eyebrow: null,
        title: null,
        doors: [
          {
            id: v5Id(l, 'home-door-1'),
            label: tx(h.door1Label, l),
            title: NAV.studios[l],
            price: '10%',
            priceNote: tx(V5.partner.chipSuffix, l),
            howLine: tx(h.howLine, l),
            bullets: lines(l, 'home-door-1-b', h.studioBullets),
            finePrint: null,
            button: link(null, NAV.studios[l], '@partnerprogramma', 'secondary'),
          },
          {
            id: v5Id(l, 'home-door-2'),
            label: tx(h.door2Label, l),
            title: NAV.website[l],
            price: '€49',
            priceNote: tx(V5.common.perMonthExcl, l),
            howLine: tx(h.howLine, l),
            bullets: lines(l, 'home-door-2-b', h.businessBullets),
            finePrint: tx(h.businessFine, l),
            button: link(null, quote(l), '@contact'),
          },
        ],
        anchor: 'deuren',
      },
      {
        id: v5Id(l, 'home-steps'),
        blockType: 'stepsShowcase',
        eyebrow: null,
        title: tx(h.stepsTitle, l),
        intro: null,
        steps: steps(l, 'home-step', [
          { title: tx(h.steps[0], l), text: null, frameKind: 'wireframe' },
          { title: tx(h.steps[1], l), text: null, frameKind: 'live' },
          { title: tx(h.steps[2], l), text: tx(h.step3Text, l), frameKind: 'cms' },
        ]),
        anchor: 'zo-werkt-het',
      },
      { id: v5Id(l, 'home-trust'), blockType: 'trustBar', items: lines(l, 'home-trust', h.trust), anchor: null },
      {
        id: v5Id(l, 'home-faq'),
        blockType: 'accordion',
        header: { eyebrow: null, title: tx(h.faqTitle, l), subtitle: null, intro: null },
        items: [
          faqItem(v5Id(l, 'home-faq-dpa'), tx(V5.common.dpaFaqTitle, l), PRICING.dpaFaqBody[l]),
          faqItem(v5Id(l, 'home-faq-data'), tx(h.dataFaqTitle, l), tx(h.dataFaqBody, l)),
        ],
        anchor: 'faq',
      },
      {
        id: v5Id(l, 'home-cta'),
        blockType: 'cta',
        eyebrow: null,
        title: quote(l),
        text: tx(h.sub, l),
        button: link(null, quote(l), '@contact'),
        anchor: 'offerte',
      },
    ],
  }
}

function prijzen(base: PageDoc, l: Locale): PageDoc {
  const id = IDS.prijzen[l]
  const hero = byBlockId(base, id.hero)
  const pricing = byBlockId(base, id.pricing)
  const faq = byBlockId(base, id.faq)
  const cta = byBlockId(base, id.cta)
  const p = V5.prijzen
  const tiers = list(pricing.tiers)
  if (tiers.length !== 4) throw new Error(`[redesign-v5] prijzen.${l}: expected 4 plans, found ${String(tiers.length)}`)
  const plans = tiers.map((tier, i) => ({
    id: v5Id(l, `prijzen-plan-${String(i + 1)}`),
    title: str(tier.name),
    tag: tier.recommended ? str(tier.badge) || null : null,
    tagline: str(tier.for) || null,
    price: str(tier.price),
    period: str(tier.per) || null,
    priceNote: str(tier.priceNote) || null,
    features: list(tier.features).map((feature, j) => ({
      id: v5Id(l, `prijzen-plan-${String(i + 1)}-f${String(j + 1)}`),
      text: str(feature.text),
      included: feature.included !== false,
    })),
    button: link(null, quote(l), '@contact', tier.recommended ? 'primary' : 'secondary'),
    featured: Boolean(tier.recommended),
  }))
  const pricingHeader = obj(pricing.header)
  const intro = str(pricingHeader.intro)
  const firstSentence = intro.slice(0, intro.indexOf('.') + 1)
  if (!firstSentence) throw new Error(`[redesign-v5] prijzen.${l}: pricing intro has no first sentence`)

  // FAQ: DPA, Care e-mail, the remaining #122 items, invoice, then indexation (P-14, from the #122 note).
  const items = list(faq.items)
  const dpaId = newId(l, 'prijzen-faq-dpa')
  const dpa = items.find((item) => item.id === dpaId) ?? faqItem(v5Id(l, 'prijzen-faq-dpa'), tx(V5.common.dpaFaqTitle, l), PRICING.dpaFaqBody[l])
  const care = items.find((item) => item.id === id.faqCare)
  const invoice = items.find((item) => item.id === id.faqInvoice)
  if (!care || !invoice) throw new Error(`[redesign-v5] prijzen.${l}: FAQ items missing in the #122 draft`)
  const rest = items.filter((item) => ![dpaId, id.faqCare, id.faqInvoice].includes(str(item.id)))
  const indexation = byBlockId(base, newId(l, 'prijzen-indexation'))

  return {
    meta: clone(base.meta),
    layout: [
      {
        id: v5Id(l, 'prijzen-hero'),
        blockType: 'productHero',
        eyebrow: str(obj(hero.header).eyebrow),
        title: PRICING.h1[l],
        sub: tx(p.sub, l),
        priceChip: { amount: '€49', suffix: tx(p.chipSuffix, l) },
        buttons: [link(v5Id(l, 'prijzen-hero-b1'), quote(l), '@contact')],
        variant: 'split',
        showcase: { kind: 'plans', url: tx(p.url, l), badge: tx(p.badge, l), caption: tx(V5.common.caption, l), showPhone: false },
        anchor: null,
      },
      {
        id: v5Id(l, 'prijzen-plans'),
        blockType: 'pricingCards',
        eyebrow: null,
        title: null,
        plans,
        sharedLine: PRICING.dpaLine[l],
        limitsNote: PRICING.limitNote[l],
        // Same public hash as the #122 pricing block, so existing links keep working.
        anchor: str(pricing.anchor) || 'pakketten',
      },
      {
        id: v5Id(l, 'prijzen-showcase'),
        blockType: 'productShowcase',
        eyebrow: str(pricingHeader.eyebrow),
        title: str(pricingHeader.title),
        sub: firstSentence,
        bullets: [],
        layout: 'copyLeft',
        frame: { kind: 'invoice', url: tx(p.invoiceUrl, l), title: tx(p.invoiceTitle, l) },
        invoiceRows: tiers.map((tier, i) => ({ id: v5Id(l, `prijzen-row-${String(i + 1)}`), label: str(tier.name), amount: str(tier.price) })),
        button: { label: null, variant: 'primary', type: 'internal', page: null, url: null, anchor: null, newTab: false },
        anchor: 'wat-de-klant-betaalt',
      },
      {
        ...faq,
        items: [dpa, care, ...rest, invoice, faqItem(v5Id(l, 'prijzen-faq-indexation'), tx(p.indexationFaqTitle, l), str(indexation.text))],
      },
      {
        ...cta,
        // No eyebrow (v5 mockup): the core cta eyebrow is accent on the dark band, 2.96:1 (axe color-contrast).
        eyebrow: null,
        title: quote(l),
        text: tx(p.sub, l),
        button: { ...obj(cta.button), label: quote(l), variant: 'primary' },
      },
    ],
  }
}

function partner(base: PageDoc, l: Locale): PageDoc {
  const id = IDS.partnerprogramma[l]
  const hero = byBlockId(base, id.hero)
  const ladder = byBlockId(base, id.ladder)
  const caveat = byBlockId(base, newId(l, 'partner-ladder-caveat'))
  const basis = byBlockId(base, id.base)
  const how = byBlockId(base, id.how)
  const calculator = byBlockId(base, id.calculator)
  const routes = only(base, 'invoicingRoutes diagram', (block) => block.blockType === 'diagram' && block.kind === 'invoicingRoutes')
  const faq = byBlockId(base, id.faq)
  const closing = byBlockId(base, id.closing)
  const p = V5.partner

  // H1 + sub: the #122 hero title is PA-01's three sentences; v5 splits it after the second.
  const heroTitle = str(obj(hero.header).title)
  const cut = heroTitle.indexOf('.', heroTitle.indexOf('.') + 1) + 1
  if (cut <= 0) throw new Error(`[redesign-v5] partnerprogramma.${l}: hero title is not PA-01`)
  const rungs = list(ladder.cards).map((card, i) => {
    const [name, percent] = splitRung(str(card.title))
    return { id: v5Id(l, `partner-rung-${String(i + 1)}`), name, percent, text: tx(p.rungTexts[i], l) }
  })
  if (rungs.length !== 4) throw new Error(`[redesign-v5] partnerprogramma.${l}: expected 4 rungs`)
  const howCards = list(how.cards)
  if (howCards.length !== 3) throw new Error(`[redesign-v5] partnerprogramma.${l}: expected 3 steps`)
  const items = list(faq.items)
  const cost = items.find((item) => item.id === id.faqCost)
  if (!cost) throw new Error(`[redesign-v5] partnerprogramma.${l}: cost FAQ missing`)

  return {
    meta: clone(base.meta),
    layout: [
      {
        id: v5Id(l, 'partner-hero'),
        blockType: 'productHero',
        eyebrow: NAV.studios[l],
        title: heroTitle.slice(0, cut).trim(),
        sub: heroTitle.slice(cut).trim(),
        priceChip: { amount: '10%', suffix: tx(p.chipSuffix, l) },
        buttons: [
          link(v5Id(l, 'partner-hero-b1'), PARTNER.closingTitle[l], '@contact'),
          link(v5Id(l, 'partner-hero-b2'), l === 'nl' ? 'Prijzen' : 'Pricing', '@prijzen', 'secondary'),
        ],
        variant: 'split',
        showcase: { kind: 'studio', url: tx(p.url, l), badge: tx(p.badge, l), caption: tx(V5.common.caption, l), showPhone: false },
        anchor: null,
      },
      {
        id: v5Id(l, 'partner-ladder'),
        blockType: 'ladderSteps',
        eyebrow: str(obj(ladder.header).eyebrow),
        title: str(obj(ladder.header).title),
        intro: null,
        rungs,
        footnote: str(caveat.text),
        anchor: 'ladder',
      },
      {
        id: v5Id(l, 'partner-steps'),
        blockType: 'stepsShowcase',
        eyebrow: str(obj(how.header).eyebrow),
        title: tx(p.stepsTitle, l),
        intro: null,
        steps: steps(l, 'partner-step', [
          { title: stripNumber(str(howCards[0]?.title)), text: tx(p.step1Text, l), frameKind: 'wireframe' },
          { title: stripNumber(str(howCards[1]?.title)), text: str(howCards[1]?.description), frameKind: 'live' },
          { title: stripNumber(str(howCards[2]?.title)), text: str(howCards[2]?.description), frameKind: 'cms' },
        ]),
        anchor: 'hoe',
      },
      calculator,
      routes,
      {
        ...faq,
        items: [
          cost,
          faqItem(v5Id(l, 'partner-faq-basis'), tx(p.basisFaqTitle, l), firstParagraph(basis.content)),
          ...items.filter((item) => item.id !== id.faqCost),
        ],
      },
      // No eyebrow, as on prijzen (v5 mockup; contrast on the dark band).
      { ...closing, eyebrow: null, button: { ...obj(closing.button), label: PARTNER.closingTitle[l] } },
    ],
  }
}

/** "Basis 10%" → ["Basis", "10%"], "Eerste lijn +10%" → ["Eerste lijn", "+10%"]. */
export function splitRung(title: string): [string, string] {
  const match = /^(.*?)\s+(\+?\d+%)$/.exec(title.trim())
  if (!match?.[1] || !match[2]) throw new Error(`[redesign-v5] ladder card "${title}" is not "<name> <percent>"`)
  return [match[1], match[2]]
}

const BUILDERS: Record<V5Slug, (base: PageDoc, l: Locale) => PageDoc> = { home, prijzen, partnerprogramma: partner }

/** The v5 draft of a page-locale, from its #122 draft. */
export function buildV5Page(slug: V5Slug, locale: Locale, base: PageDoc): PageDoc {
  return BUILDERS[slug](base, locale)
}

/** The v5 draft as the migration writes it on accp: from the #122 draft of the accp snapshot. */
export function v5Page(slug: V5Slug, locale: Locale): PageDoc {
  return buildV5Page(slug, locale, page122(slug, locale))
}

export type V5Report = { written: string[]; unchanged: string[]; skipped: string[] }
type Args = { payload: Payload; req?: PayloadRequest; direction: 'up' | 'down' }

const asPage = (raw: Obj, slugById: Map<number, string>): PageDoc =>
  toSlugRefs({ layout: (raw.layout ?? []) as PageDoc['layout'], meta: (raw.meta ?? {}) as Obj }, slugById)

export async function runRedesignV5({ payload, req, direction }: Args): Promise<V5Report> {
  const report: V5Report = { written: [], unchanged: [], skipped: [] }
  const { idBySlug, slugById } = await pageIds(payload, req)
  const say = (line: string) => {
    payload.logger.info(`[redesign-v5 ${direction}] ${line}`)
  }
  const writes: { where: string; write: () => Promise<unknown> }[] = []

  for (const slug of V5_SLUGS) {
    const id = idBySlug.get(slug)
    if (id === undefined) {
      report.skipped.push(`${slug}: page not found`)
      continue
    }
    for (const locale of LOCALES) {
      const where = `${slug}.${locale}`
      const read = async (draft: boolean) =>
        asPage((await payload.findByID({ collection: 'pages', id, locale, fallbackLocale: false, depth: 0, draft, req })) as unknown as Obj, slugById)
      const current = await read(true)
      const before = page122(slug, locale)
      const after = buildV5Page(slug, locale, before)
      let target: PageDoc
      if (direction === 'up') {
        if (sameValue(current, after)) {
          report.unchanged.push(where)
          continue
        }
        if (!sameValue(current, before)) {
          report.skipped.push(`${where}: latest draft is not the #122 draft (edited, published or not migrated), not overwriting`)
          continue
        }
        target = after
      } else {
        if (sameValue(current, before)) {
          report.unchanged.push(where)
          continue
        }
        if (!sameValue(current, after)) {
          report.skipped.push(`${where}: edited after the v5 migration, not reverting`)
          continue
        }
        // The v5 draft went live: putting the #122 draft back is a decision for a person.
        if (sameValue(await read(false), after)) {
          report.skipped.push(`${where}: v5 draft was published, not reverting (restore by hand from the version history)`)
          continue
        }
        target = before
      }
      const data = { ...fromSlugRefs(target, idBySlug), _status: 'draft' }
      writes.push({
        where: `${where} (draft)`,
        write: () => payload.update({ collection: 'pages', id, locale, depth: 0, draft: true, req, data: data as never }),
      })
    }
  }

  for (const { where, write } of writes) {
    await write()
    report.written.push(where)
    say(`wrote ${where}`)
  }
  for (const line of report.unchanged) say(`unchanged ${line}`)
  for (const line of report.skipped) payload.logger.warn(`[redesign-v5 ${direction}] SKIPPED ${line}`)
  return report
}
