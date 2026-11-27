// @vitest-environment node
// The content-endpoint allowlist (src/contentAllowlist.ts) and the script that
// generates it (scripts/content-allowlist-ids.mjs). The endpoint is default-deny:
// these tests pin down what it may write, against the real pages schema.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// site-core only exports its content module's index; the matcher itself is the
// exact code the endpoint runs, so import that file directly.
import {
  isAllowlisted,
  parseAllowlist,
} from '../../node_modules/@rinsly-com/site-core/src/content/allowlist'
import { isWritableLeafPath } from '../../node_modules/@rinsly-com/site-core/src/content/fields'
import type { ConfigField } from '../../node_modules/@rinsly-com/site-core/src/content/fields'

import { contentAllowlist } from '@/contentAllowlist'
import {
  LEGAL_SLUGS,
  PAGE_SCALARS,
  PINNED_BLOCKS,
  collectPins,
  findBlock,
  parseArgs,
  pinsForBlock,
  renderModule,
} from '../../scripts/content-allowlist-ids.mjs'

const root = resolve(__dirname, '../..')
const read = (file: string) => readFileSync(resolve(root, file), 'utf8')

const pagePaths = contentAllowlist.collections.pages as readonly string[]
const pinnedPaths = pagePaths.filter((path) => path.startsWith('layout.'))
const target = (path: string, slug = 'pages', kind: 'collection' | 'global' = 'collection') => ({
  kind,
  slug,
  path,
})
const allowed = (path: string, slug?: string, kind?: 'collection' | 'global') =>
  isAllowlisted(contentAllowlist, target(path, slug, kind))

/** Depth-first lookup through tabs, groups and rows. */
function findField(
  fields: readonly ConfigField[] | undefined,
  name: string,
): ConfigField | undefined {
  for (const field of fields ?? []) {
    if (field.name === name) return field
    const nested =
      findField(field.fields, name) ??
      findField(
        field.tabs?.flatMap((tab) => tab.fields ?? []),
        name,
      )
    if (nested) return nested
  }
  return undefined
}

const PINNED_PATH_RE =
  /^layout\.[0-9a-f]{24}\.(header\.(title|eyebrow|intro)|text|eyebrow|title|cards\.[0-9a-f]{24}\.(title|description)|items\.[0-9a-f]{24}\.title)$/

describe('src/contentAllowlist.ts', () => {
  it('parses as an allowlist and loses no entry to the endpoint parser', () => {
    const parsed = parseAllowlist(contentAllowlist)
    expect(parsed).not.toBeNull()
    expect(parsed?.collections?.pages).toEqual(pagePaths)
    expect(parsed?.globals).toEqual({})
  })

  it('covers only pages, with SEO title/description plus the pinned block and row paths', () => {
    expect(Object.keys(contentAllowlist)).toEqual(['collections'])
    expect(Object.keys(contentAllowlist.collections)).toEqual(['pages'])
    expect(pagePaths.slice(0, 2)).toEqual(['meta.title', 'meta.description'])
    expect(pagePaths).toHaveLength(PAGE_SCALARS.length + pinnedPaths.length)
    expect(new Set(pagePaths).size).toBe(pagePaths.length)
    // Locales plus array rows (Woerden cards and FAQ questions) expand the spec.
    expect(pinnedPaths.length).toBeGreaterThan(PINNED_BLOCKS.length)
  })

  it('has no wildcard, index or env-style entry, only exact row ids', () => {
    for (const path of pinnedPaths) {
      expect(path).toMatch(PINNED_PATH_RE)
    }
    expect(pagePaths.some((path) => path.includes('*'))).toBe(false)
    expect(pagePaths.some((path) => /layout\.\d+\./.test(path))).toBe(false)
  })

  it('does not pin legal-page blocks or any rich-text leaf', () => {
    const pages = new Set(PINNED_BLOCKS.map((spec) => spec.page))
    for (const slug of LEGAL_SLUGS) expect(pages.has(slug)).toBe(false)
    expect(pages).toEqual(
      new Set(['website', 'contact', 'partnerprogramma', 'website-laten-maken-woerden']),
    )
    for (const spec of PINNED_BLOCKS) {
      expect(
        spec.field === 'content' || spec.field === 'body' || /\.(content|body)$/.test(spec.field),
      ).toBe(false)
    }
    for (const path of pinnedPaths) {
      expect(path.endsWith('.content') || path.endsWith('.body')).toBe(false)
    }
    const text = read('src/contentAllowlist.ts')
    expect(text).not.toMatch(/privacy|voorwaarden/i)
  })

  it('accepts exactly the listed paths', () => {
    for (const path of pagePaths) expect(allowed(path)).toBe(true)
  })

  it('rejects other fields, rows, indexes and wildcards on pages', () => {
    const id = pinnedPaths[0]?.split('.')[1] ?? ''
    const rejected = [
      'title',
      'slug',
      'layout',
      'meta',
      'meta.noindex',
      'meta.image',
      'meta.title.extra',
      `layout.${id}.header.intro`,
      `layout.${id}.header`,
      `layout.${id}.content`,
      `layout.${id}.header.title.extra`,
      `layout.0.header.title`,
      `layout.0@${id}.header.title`,
      `layout.*.header.title`,
      `layout.*.text`,
      'layout.000000000000000000000000.header.title',
      'layout.ffffffffffffffffffffffff.header.title',
      `layout.${id}.header.title `,
      `layout.${id.toUpperCase()}.header.title`,
      '__proto__.title',
      'meta.token',
    ]
    for (const path of rejected) expect(allowed(path), path).toBe(false)
  })

  it('rejects rich-text and privacy/legal paths that #107 must not unlock', () => {
    const privacyNl = '6b0871a7bb5dd40a0f68b126'
    const privacyEn = '6b0871a9bb5dd40a0f68b127'
    const faqItem = pinnedPaths.find((path) => path.includes('.items.'))?.split('.') ?? []
    const accordionId = faqItem[1]
    const itemId = faqItem[3]
    const rejected = [
      `layout.${privacyNl}.content`,
      `layout.${privacyEn}.content`,
      `layout.${privacyNl}.header.title`,
      `layout.${privacyEn}.header.title`,
      `layout.${privacyNl}.header.eyebrow`,
      'layout.6b0871aabb5dd40a0f68b128.content', // voorwaarden-shaped id, not pinned
      `layout.*.content`,
      `layout.*.items.*.body`,
    ]
    if (accordionId && itemId) {
      rejected.push(`layout.${accordionId}.items.${itemId}.body`)
      rejected.push(`layout.${accordionId}.content`)
    }
    for (const path of rejected) expect(allowed(path), path).toBe(false)
  })

  it('rejects the other partner CTA and Woerden rich-text body', () => {
    // Pins mention the check-CTA in comments; any other 24-hex CTA id is denied.
    const checkCta = pinnedPaths.find((path) => path.endsWith('.text'))
    expect(checkCta).toBeTruthy()
    const otherCta = '6b087147bb5dd40a0f68aff7' // partner closing CTA (nl), not the check button
    expect(allowed(`layout.${otherCta}.text`), 'other partner CTA').toBe(false)
    expect(allowed(`layout.${otherCta}.title`)).toBe(false)
    const woerdenRichTextNl = '6b08719cbb5dd40a0f68b116'
    const woerdenRichTextEn = '6b08719fbb5dd40a0f68b121'
    expect(allowed(`layout.${woerdenRichTextNl}.content`)).toBe(false)
    expect(allowed(`layout.${woerdenRichTextEn}.content`)).toBe(false)
    expect(allowed(`layout.${woerdenRichTextNl}.header.eyebrow`)).toBe(true)
    expect(allowed(`layout.${woerdenRichTextNl}.header.title`)).toBe(true)
    const woerdenCtaNl = '6b08719cbb5dd40a0f68b11a'
    expect(allowed(`layout.${woerdenCtaNl}.eyebrow`)).toBe(true)
    expect(allowed(`layout.${woerdenCtaNl}.title`)).toBe(true)
    expect(allowed(`layout.${woerdenCtaNl}.text`)).toBe(true)
    expect(allowed(`layout.${woerdenCtaNl}.button`)).toBe(false)
    expect(allowed(`layout.${woerdenCtaNl}.button.label`)).toBe(false)
  })

  it('rejects every other collection and every global', () => {
    for (const slug of [
      'users',
      'media',
      'offertes',
      'check-aanvragen',
      'check-runs',
      'partner-aanvragen',
      'content-audit',
      'content-replay',
      'payload-preferences',
      'payload-kv',
    ]) {
      expect(allowed('meta.title', slug), slug).toBe(false)
    }
    for (const slug of ['header', 'footer', 'pages']) {
      expect(allowed('meta.title', slug, 'global'), slug).toBe(false)
      expect(allowed('label', slug, 'global'), slug).toBe(false)
    }
  })

  it('points at writable text leaves in the real pages schema', async () => {
    const config = await (await import('@/payload.config')).default
    const pages = config.collections.find((collection) => collection.slug === 'pages')
    expect(pages).toBeTruthy()
    const fields = pages?.fields as unknown as ConfigField[]
    for (const path of pagePaths) expect(isWritableLeafPath(fields, path), path).toBe(true)
    // The pinned heading exists on the block types the pins were generated from.
    const layout = findField(fields, 'layout')
    for (const spec of PINNED_BLOCKS) {
      const block = layout?.blocks?.find((candidate) => candidate.slug === spec.blockType)
      expect(block, spec.blockType).toBeTruthy()
      const alone: ConfigField[] = [{ name: 'layout', type: 'blocks', blocks: [block as never] }]
      const leaf = spec.rows
        ? `layout.row1.${spec.rows}.row2.${spec.field}`
        : `layout.row1.${spec.field}`
      expect(isWritableLeafPath(alone, leaf), `${spec.blockType} ${spec.field}`).toBe(true)
    }
    // Nested rich text is a schema-writable leaf (the walk still refuses a
    // value that is not one plain paragraph). The allowlist is what keeps
    // these paths closed until Part C; they must not be pinned.
    const accordion = layout?.blocks?.find((candidate) => candidate.slug === 'accordion')
    const richText = layout?.blocks?.find((candidate) => candidate.slug === 'richText')
    expect(
      isWritableLeafPath(
        [{ name: 'layout', type: 'blocks', blocks: [accordion as never] }],
        'layout.row1.items.row2.body',
      ),
    ).toBe(true)
    expect(
      isWritableLeafPath(
        [{ name: 'layout', type: 'blocks', blocks: [richText as never] }],
        'layout.row1.content',
      ),
    ).toBe(true)
    // Not writable even if somebody allowlisted them: non-text leaves.
    expect(isWritableLeafPath(fields, 'meta.noindex')).toBe(false)
    expect(isWritableLeafPath(fields, 'meta.image')).toBe(false)
  })

  it('is wired into the Payload config, and the env override is never set in the repo', () => {
    expect(read('src/payload.config.ts')).toMatch(/^\s*contentAllowlist,$/m)
    expect(read('src/payload.config.ts')).toMatch(
      /import \{ contentAllowlist \} from '\.\/contentAllowlist'/,
    )
    for (const file of ['wrangler.jsonc', 'wrangler.static.jsonc']) {
      expect(read(file).replace(/\/\/.*$/gm, ''), file).not.toContain('RINSLY_CONTENT_ALLOWLIST')
    }
    expect(read('wrangler.jsonc').replace(/\/\/.*$/gm, '')).not.toContain('RINSLY_CONTENT_ENABLED')
  })

  it('is byte-for-byte what the generator renders for its own pins (no hand edits)', () => {
    const text = read('src/contentAllowlist.ts')
    const pins = [...text.matchAll(/^\s+'(layout\.[^']+)', \/\/ (.+)$/gm)].map((match) => ({
      path: match[1],
      comment: match[2],
    }))
    expect(pins).toHaveLength(pinnedPaths.length)
    expect(renderModule(pins)).toBe(text)
  })
})

type Locale = 'nl' | 'en'
type Pin = { path: string; comment: string }
type Button = { url?: string }
type Card = { id?: string; title: string; description: string }
type FaqItem = { id?: string; title: string; body: unknown }
type Block = {
  blockType: string
  id?: string
  header?: { eyebrow?: string; title?: string; intro?: string }
  eyebrow?: string
  title?: string
  text?: string
  button?: Button
  cards?: Card[]
  items?: FaqItem[]
  content?: unknown
}
type Doc = { id: number; slug: string; layout: Block[] }
type Responses = { nl: { docs: Doc[] }; en: { docs: Doc[] } }

const IDS = {
  website: { nl: 'aaaaaaaaaaaaaaaaaaaa0001', en: 'aaaaaaaaaaaaaaaaaaaa0002' },
  contact: { nl: 'bbbbbbbbbbbbbbbbbbbb0001', en: 'bbbbbbbbbbbbbbbbbbbb0002' },
  checkCta: { nl: 'cccccccccccccccccccc0001', en: 'cccccccccccccccccccc0002' },
  otherCta: { nl: 'cccccccccccccccccccc0003', en: 'cccccccccccccccccccc0004' },
  woerdenHero: { nl: 'dddddddddddddddddddd0001', en: 'dddddddddddddddddddd0002' },
  woerdenServices: { nl: 'dddddddddddddddddddd0010', en: 'dddddddddddddddddddd0011' },
  woerdenCards: {
    nl: ['dddddddddddddddddddd0020', 'dddddddddddddddddddd0021', 'dddddddddddddddddddd0022'],
    en: ['dddddddddddddddddddd0023', 'dddddddddddddddddddd0024', 'dddddddddddddddddddd0025'],
  },
  woerdenFaq: { nl: 'dddddddddddddddddddd0030', en: 'dddddddddddddddddddd0031' },
  woerdenFaqItems: {
    nl: ['dddddddddddddddddddd0040', 'dddddddddddddddddddd0041'],
    en: ['dddddddddddddddddddd0042', 'dddddddddddddddddddd0043'],
  },
  woerdenRichText: { nl: 'dddddddddddddddddddd0050', en: 'dddddddddddddddddddd0051' },
  woerdenCta: { nl: 'dddddddddddddddddddd0060', en: 'dddddddddddddddddddd0061' },
  // The real accp privacy richText block ids (page 2), not made-up ones.
  privacy: { nl: '6b0871a7bb5dd40a0f68b126', en: '6b0871a9bb5dd40a0f68b127' },
}

function woerden(locale: 'nl' | 'en'): Doc {
  const cards = IDS.woerdenCards[locale].map((id, index) => ({
    id,
    title: `card ${index + 1} ${locale}`,
    description: `desc ${index + 1} ${locale}`,
  }))
  const items = IDS.woerdenFaqItems[locale].map((id, index) => ({
    id,
    title: `question ${index + 1} ${locale}`,
    body: { root: { type: 'root', children: [] } },
  }))
  return {
    id: 11,
    slug: 'website-laten-maken-woerden',
    layout: [
      {
        blockType: 'hero',
        id: IDS.woerdenHero[locale],
        header: { eyebrow: `eyebrow ${locale}`, title: `hero ${locale}`, intro: `intro ${locale}` },
      },
      {
        blockType: 'services',
        id: IDS.woerdenServices[locale],
        header: {
          eyebrow: `svc-eye ${locale}`,
          title: `svc ${locale}`,
          intro: `svc-intro ${locale}`,
        },
        cards,
      },
      {
        blockType: 'richText',
        id: IDS.woerdenRichText[locale],
        header: { eyebrow: `regio ${locale}`, title: `regio title ${locale}` },
        content: { root: { type: 'root', children: [] } },
      },
      {
        blockType: 'accordion',
        id: IDS.woerdenFaq[locale],
        header: { eyebrow: `faq-eye ${locale}`, title: `faq ${locale}` },
        items,
      },
      {
        blockType: 'cta',
        id: IDS.woerdenCta[locale],
        eyebrow: `cta-eye ${locale}`,
        title: `cta ${locale}`,
        text: `cta text ${locale}`,
      },
    ],
  }
}

function partner(locale: 'nl' | 'en'): Doc {
  return {
    id: 4,
    slug: 'partnerprogramma',
    layout: [
      {
        blockType: 'cta',
        id: IDS.otherCta[locale],
        title: `closing ${locale}`,
        text: `closing text ${locale}`,
        button: { url: '/contact' },
      },
      {
        blockType: 'cta',
        id: IDS.checkCta[locale],
        title: `check ${locale}`,
        text: `check text ${locale}`,
        button: { url: '/check' },
      },
    ],
  }
}

/** A trimmed copy of what GET /api/pages?depth=0 returns, per locale. */
function response(locale: 'nl' | 'en', ids: { website: string; contact: string }): { docs: Doc[] } {
  return {
    docs: [
      {
        id: 1,
        slug: 'home',
        layout: [{ blockType: 'hero', id: 'a1', header: { title: `home ${locale}` } }],
      },
      {
        id: 2,
        slug: 'privacy',
        layout: [
          {
            blockType: 'richText',
            id: IDS.privacy[locale],
            header: { title: `privacy ${locale}` },
            content: { root: { type: 'root', children: [] } },
          },
        ],
      },
      {
        id: 7,
        slug: 'website',
        layout: [
          { blockType: 'hero', id: ids.website, header: { title: `h1 ${locale}` } },
          { blockType: 'services', id: 'b2', header: { title: 'other' } },
        ],
      },
      {
        id: 9,
        slug: 'contact',
        layout: [
          { blockType: 'hero', id: 'c1', header: { title: 'x' } },
          { blockType: 'contact', id: ids.contact, header: { title: `form ${locale}` } },
        ],
      },
      partner(locale),
      woerden(locale),
    ],
  }
}

const fixture = (): Responses => ({
  nl: response('nl', { website: IDS.website.nl, contact: IDS.contact.nl }),
  en: response('en', { website: IDS.website.en, contact: IDS.contact.en }),
})

function pageOf(res: Responses, locale: 'nl' | 'en', slug: string): Doc {
  const doc = res[locale].docs.find((candidate) => candidate.slug === slug)
  if (!doc) throw new Error(`fixture has no ${slug}`)
  return doc
}

function blockOf(res: Responses, locale: 'nl' | 'en', slug: string, blockType: string): Block {
  const block = pageOf(res, locale, slug).layout.find(
    (candidate) => candidate.blockType === blockType,
  )
  if (!block) throw new Error(`fixture has no ${blockType} on ${slug}`)
  return block
}

function pinsOf(responses: Responses): Pin[] {
  return collectPins(responses) as Pin[]
}

function expectedFixturePaths(): string[] {
  const locales: readonly Locale[] = ['nl', 'en']
  const paths = [
    `layout.${IDS.website.nl}.header.title`,
    `layout.${IDS.website.en}.header.title`,
    `layout.${IDS.contact.nl}.header.title`,
    `layout.${IDS.contact.en}.header.title`,
    `layout.${IDS.checkCta.nl}.text`,
    `layout.${IDS.checkCta.en}.text`,
    `layout.${IDS.woerdenHero.nl}.header.eyebrow`,
    `layout.${IDS.woerdenHero.en}.header.eyebrow`,
    `layout.${IDS.woerdenHero.nl}.header.title`,
    `layout.${IDS.woerdenHero.en}.header.title`,
    `layout.${IDS.woerdenHero.nl}.header.intro`,
    `layout.${IDS.woerdenHero.en}.header.intro`,
    `layout.${IDS.woerdenServices.nl}.header.eyebrow`,
    `layout.${IDS.woerdenServices.en}.header.eyebrow`,
    `layout.${IDS.woerdenServices.nl}.header.title`,
    `layout.${IDS.woerdenServices.en}.header.title`,
    `layout.${IDS.woerdenServices.nl}.header.intro`,
    `layout.${IDS.woerdenServices.en}.header.intro`,
  ]
  for (const locale of locales) {
    const blockId = IDS.woerdenServices[locale]
    for (const cardId of [...IDS.woerdenCards[locale]].sort()) {
      paths.push(`layout.${blockId}.cards.${cardId}.title`)
    }
  }
  for (const locale of locales) {
    const blockId = IDS.woerdenServices[locale]
    for (const cardId of [...IDS.woerdenCards[locale]].sort()) {
      paths.push(`layout.${blockId}.cards.${cardId}.description`)
    }
  }
  paths.push(
    `layout.${IDS.woerdenFaq.nl}.header.eyebrow`,
    `layout.${IDS.woerdenFaq.en}.header.eyebrow`,
    `layout.${IDS.woerdenFaq.nl}.header.title`,
    `layout.${IDS.woerdenFaq.en}.header.title`,
  )
  for (const locale of locales) {
    const blockId = IDS.woerdenFaq[locale]
    for (const itemId of [...IDS.woerdenFaqItems[locale]].sort()) {
      paths.push(`layout.${blockId}.items.${itemId}.title`)
    }
  }
  paths.push(
    `layout.${IDS.woerdenRichText.nl}.header.eyebrow`,
    `layout.${IDS.woerdenRichText.en}.header.eyebrow`,
    `layout.${IDS.woerdenRichText.nl}.header.title`,
    `layout.${IDS.woerdenRichText.en}.header.title`,
    `layout.${IDS.woerdenCta.nl}.eyebrow`,
    `layout.${IDS.woerdenCta.en}.eyebrow`,
    `layout.${IDS.woerdenCta.nl}.title`,
    `layout.${IDS.woerdenCta.en}.title`,
    `layout.${IDS.woerdenCta.nl}.text`,
    `layout.${IDS.woerdenCta.en}.text`,
  )
  return paths
}

describe('scripts/content-allowlist-ids.mjs', () => {
  it('pins the website, contact, partner check-CTA and all #107 Woerden plain-text fields in a fixed order', () => {
    expect(pinsOf(fixture()).map((pin) => pin.path)).toEqual(expectedFixturePaths())
  })

  it('is deterministic: same output however the API orders pages and blocks, and on repeat runs', () => {
    const a = fixture()
    const b = fixture()
    for (const locale of ['nl', 'en'] as const) {
      b[locale].docs.reverse()
      for (const doc of b[locale].docs) {
        doc.layout.reverse()
        for (const block of doc.layout) {
          if (block.cards) block.cards.reverse()
          if (block.items) block.items.reverse()
        }
      }
    }
    const first = renderModule(pinsOf(a))
    expect(renderModule(pinsOf(b))).toBe(first)
    expect(renderModule(pinsOf(a))).toBe(first)
    expect(first.endsWith('\n')).toBe(true)
    expect(first).not.toMatch(/\d{4}-\d{2}-\d{2}|Date\(|undefined/)
  })

  it('renders a module whose entries pass the endpoint matcher and nothing else does', () => {
    const text = renderModule(pinsOf(fixture()))
    const paths = [...text.matchAll(/^\s+'([^']+)',/gm)].map((match) => match[1])
    expect(paths).toEqual(['meta.title', 'meta.description', ...expectedFixturePaths()])
    const list = parseAllowlist({ collections: { pages: paths } })
    expect(list).not.toBeNull()
    const ok = (path: string) => isAllowlisted(list as never, target(path))
    for (const path of paths) expect(ok(path)).toBe(true)
    expect(ok('layout.b2.header.title')).toBe(false)
    expect(ok(`layout.${IDS.website.nl}.header.intro`)).toBe(false)
    expect(ok(`layout.${IDS.otherCta.nl}.text`)).toBe(false)
    expect(ok(`layout.${IDS.otherCta.en}.text`)).toBe(false)
    expect(ok(`layout.${IDS.woerdenFaq.nl}.items.${IDS.woerdenFaqItems.nl[0]}.body`)).toBe(false)
    expect(ok(`layout.${IDS.woerdenRichText.nl}.content`)).toBe(false)
    expect(ok(`layout.${IDS.woerdenRichText.nl}.header.eyebrow`)).toBe(true)
    expect(ok(`layout.${IDS.woerdenCta.nl}.text`)).toBe(true)
    expect(ok(`layout.${IDS.woerdenCta.nl}.button`)).toBe(false)
    expect(ok(`layout.${IDS.privacy.nl}.content`)).toBe(false)
    expect(ok(`layout.${IDS.privacy.nl}.header.title`)).toBe(false)
    expect(ok(`layout.${IDS.privacy.en}.content`)).toBe(false)
  })

  it('picks the partner check-CTA by button URL and stops when that match is ambiguous or missing', () => {
    const check = PINNED_BLOCKS.find((spec) => spec.page === 'partnerprogramma')
    expect(check?.match).toEqual({ path: 'button.url', equals: '/check' })
    expect(pinsOf(fixture()).some((pin) => pin.path === `layout.${IDS.checkCta.nl}.text`)).toBe(
      true,
    )
    expect(pinsOf(fixture()).some((pin) => pin.path === `layout.${IDS.otherCta.nl}.text`)).toBe(
      false,
    )

    const twoChecks = fixture()
    pageOf(twoChecks, 'nl', 'partnerprogramma').layout.push({
      blockType: 'cta',
      id: 'cccccccccccccccccccc00ff',
      text: 'also check',
      button: { url: '/check' },
    })
    expect(() => {
      collectPins(twoChecks)
    }).toThrow(
      /expected one "cta" block on "partnerprogramma" matching button.url="\/check", found 2/,
    )

    const none = fixture()
    const block = pageOf(none, 'en', 'partnerprogramma').layout.find(
      (candidate) => candidate.id === IDS.checkCta.en,
    )
    if (block?.button) block.button.url = '/elsewhere'
    expect(() => {
      collectPins(none)
    }).toThrow(
      /expected one "cta" block on "partnerprogramma" matching button.url="\/check", found 0/,
    )
  })

  it('stops instead of guessing when a page or block is missing or ambiguous', () => {
    const missingPage = fixture()
    missingPage.nl.docs = missingPage.nl.docs.filter((doc) => doc.slug !== 'contact')
    expect(() => {
      collectPins(missingPage)
    }).toThrow(/nl: expected one page with slug "contact"/)

    const twoPages = fixture()
    twoPages.en.docs.push(structuredClone(pageOf(twoPages, 'en', 'website')))
    expect(() => {
      collectPins(twoPages)
    }).toThrow(/en: expected one page with slug "website", found 2/)

    const twoBlocks = fixture()
    pageOf(twoBlocks, 'nl', 'website').layout.push({
      blockType: 'hero',
      id: 'dup',
      header: { title: 'again' },
    })
    expect(() => {
      collectPins(twoBlocks)
    }).toThrow(/expected one "hero" block on "website", found 2/)

    const noBlock = fixture()
    const contact = pageOf(noBlock, 'en', 'contact')
    contact.layout = contact.layout.filter((block) => block.blockType !== 'contact')
    expect(() => {
      collectPins(noBlock)
    }).toThrow(/found 0/)
  })

  it('refuses a block with no usable id or an empty heading, and a response with no docs', () => {
    const badId = fixture()
    blockOf(badId, 'nl', 'website', 'hero').id = '../x'
    expect(() => {
      collectPins(badId)
    }).toThrow(/no usable row id/)

    for (const bad of ['42', 'AAAAAAAAAAAAAAAAAAAA0001', 'aaaaaaaaaaaaaaaaaaaa001']) {
      const res = fixture()
      blockOf(res, 'nl', 'website', 'hero').id = bad
      expect(() => {
        collectPins(res)
      }).toThrow(/no usable row id/)
    }

    const noId = fixture()
    delete blockOf(noId, 'nl', 'website', 'hero').id
    expect(() => {
      collectPins(noId)
    }).toThrow(/no usable row id/)

    const empty = fixture()
    const hero = blockOf(empty, 'en', 'website', 'hero')
    if (hero.header) hero.header.title = '  '
    expect(() => {
      collectPins(empty)
    }).toThrow(/empty or not text/)

    const emptyCard = fixture()
    const services = blockOf(emptyCard, 'nl', 'website-laten-maken-woerden', 'services')
    if (services.cards?.[0]) services.cards[0].title = '  '
    expect(() => {
      collectPins(emptyCard)
    }).toThrow(/empty or not text/)

    const badRowId = fixture()
    const services2 = blockOf(badRowId, 'nl', 'website-laten-maken-woerden', 'services')
    if (services2.cards?.[0]) services2.cards[0].id = '42'
    expect(() => {
      collectPins(badRowId)
    }).toThrow(/no usable row id/)

    const noRows = fixture()
    const services3 = blockOf(noRows, 'en', 'website-laten-maken-woerden', 'services')
    services3.cards = []
    expect(() => {
      collectPins(noRows)
    }).toThrow(/expected cards/)

    expect(() => {
      collectPins({ nl: {}, en: {} })
    }).toThrow(/no docs array/)
    expect(() => {
      findBlock([], PINNED_BLOCKS[0], 'nl')
    }).toThrow()
  })

  it('refuses to pin a legal page or a rich-text leaf, even if a caller passes that spec', () => {
    expect(() => {
      findBlock(
        fixture().nl.docs,
        {
          page: 'privacy',
          blockType: 'richText',
          field: 'header.title',
          label: 'should not pin',
        },
        'nl',
      )
    }).toThrow(/legal page "privacy"/)
    expect(() => {
      pinsForBlock(
        { id: IDS.woerdenFaq.nl, blockType: 'accordion', items: [] },
        {
          page: 'website-laten-maken-woerden',
          blockType: 'accordion',
          rows: 'items',
          field: 'body',
          label: 'should not pin',
        },
        'nl',
      )
    }).toThrow(/rich-text field "body"/)
    expect(() => {
      findBlock(
        fixture().nl.docs,
        {
          page: 'voorwaarden',
          blockType: 'richText',
          field: 'header.title',
          label: 'should not pin',
        },
        'nl',
      )
    }).toThrow(/legal page "voorwaarden"/)
  })

  it('has a write-safe CLI: --write only from the real API, both fixture files or none', () => {
    expect(parseArgs([]).mode).toBe('print')
    expect(parseArgs(['--check']).mode).toBe('check')
    expect(parseArgs(['--write', '--url', 'http://localhost:3000']).url).toBe(
      'http://localhost:3000',
    )
    expect(() => {
      parseArgs(['--write', '--nl', 'a.json', '--en', 'b.json'])
    }).toThrow(/needs --url/)
    expect(() => {
      parseArgs(['--nl', 'a.json'])
    }).toThrow(/both/)
    expect(() => {
      parseArgs(['--bogus'])
    }).toThrow(/unknown argument/)
  })

  it('only reads: no write, delete or credential code besides the generated module', () => {
    const source = read('scripts/content-allowlist-ids.mjs')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    expect(source).not.toMatch(/method:\s*['"](POST|PUT|PATCH|DELETE)/i)
    expect(source).not.toMatch(/process\.env|authorization|wrangler|\bD1\b/i)
    expect(source.match(/writeFileSync\(/g)).toHaveLength(1)
  })
})

type SnapRow = { id?: string; [key: string]: unknown }
type SnapBlock = { id: string; blockType: string; [key: string]: unknown }
type SnapDoc = { id: number; slug: string; layout: SnapBlock[] }
const snapshot = (locale: Locale): { docs: SnapDoc[] } =>
  JSON.parse(read(`tests/unit/fixtures/accp-pages-${locale}.json`)) as { docs: SnapDoc[] }

describe('page ownership of the pinned ids (accp snapshot, depth 0)', () => {
  const locales: readonly Locale[] = ['nl', 'en']
  const snaps = { nl: snapshot('nl'), en: snapshot('en') }

  /** Which page of the snapshot holds a block id, found by scanning every page. */
  const ownersOf = (locale: Locale, blockId: string) =>
    snaps[locale].docs.filter((doc) => doc.layout.some((block) => block.id === blockId))

  /** The generator's own source map: pin path to the page its spec names. */
  const buildSourceMap = () => {
    const sourceMap = new Map<string, { page: string; locale: Locale }>()
    for (const locale of locales) {
      for (const spec of PINNED_BLOCKS) {
        const block = findBlock(snaps[locale].docs, spec, locale) as SnapBlock
        for (const pin of pinsForBlock(block, spec, locale) as Pin[]) {
          sourceMap.set(pin.path, { page: spec.page, locale })
        }
      }
    }
    return sourceMap
  }

  const committed = [
    ...read('src/contentAllowlist.ts').matchAll(/^\s+'(layout\.[^']+)', \/\/ (nl|en) /gm),
  ].map((match) => ({ path: match[1], locale: match[2] as Locale }))

  it('snapshot regenerates exactly the committed allowlist (the snapshot is not stale)', () => {
    expect(committed.map((pin) => pin.path)).toEqual(pinnedPaths)
    expect(renderModule(collectPins(snaps) as Pin[])).toBe(read('src/contentAllowlist.ts'))
    expect([...buildSourceMap().keys()].sort()).toEqual([...pinnedPaths].sort())
  })

  it('block ids are unique across pages and locales, so an id names exactly one page', () => {
    const seen = new Set<string>()
    for (const locale of locales) {
      for (const doc of snaps[locale].docs) {
        for (const block of doc.layout) {
          expect(seen.has(block.id), block.id).toBe(false)
          seen.add(block.id)
        }
      }
    }
  })

  it('each pinned block id belongs to the page its spec names, in its own locale', () => {
    expect(committed).toHaveLength(pinnedPaths.length)
    const sourceMap = buildSourceMap()
    for (const { path, locale } of committed) {
      const [, blockId] = path.split('.')
      const expected = sourceMap.get(path)
      expect(expected, path).toBeTruthy()
      expect(expected?.locale, path).toBe(locale)
      const other = locales.find((candidate) => candidate !== locale) as Locale
      const owners = ownersOf(locale, blockId)
      expect(
        owners.map((doc) => doc.slug),
        path,
      ).toEqual([expected?.page])
      // An nl row id is never an en row id: the other locale does not hold this block.
      expect(ownersOf(other, blockId), path).toHaveLength(0)
    }
  })

  it('each pinned row id is a row of that block, and the leaf is non-empty text', () => {
    for (const { path, locale } of committed) {
      const [, blockId, ...rest] = path.split('.')
      const block = ownersOf(locale, blockId)[0]?.layout.find(
        (candidate) => candidate.id === blockId,
      )
      expect(block, path).toBeTruthy()
      let node: unknown = block
      const leaf = rest.pop() as string
      // Walk `field`, or `header.field`, or `<array>.<rowId>.field`.
      for (let index = 0; index < rest.length; index += 1) {
        const segment = rest[index]
        const next = (node as Record<string, unknown>)[segment]
        if (Array.isArray(next)) {
          const rowId = rest[index + 1]
          const row = (next as SnapRow[]).find((candidate) => candidate.id === rowId)
          expect(row, `${path} row ${rowId}`).toBeTruthy()
          node = row
          index += 1
        } else {
          node = next
        }
      }
      const text = (node as Record<string, unknown>)[leaf]
      expect(typeof text === 'string' && text.trim() !== '', path).toBe(true)
    }
  })

  it('no pinned id is on a legal page, and the real privacy ids are refused', () => {
    const real = {
      nl: { privacy: '6b0871a7bb5dd40a0f68b126', voorwaarden: '6b0871afbb5dd40a0f68b128' },
      en: { privacy: '6b0871a9bb5dd40a0f68b127', voorwaarden: '6b0871b0bb5dd40a0f68b129' },
    }
    expect(IDS.privacy).toEqual({ nl: real.nl.privacy, en: real.en.privacy })
    for (const locale of locales) {
      for (const slug of LEGAL_SLUGS as readonly ('privacy' | 'voorwaarden')[]) {
        const doc = snaps[locale].docs.find((candidate) => candidate.slug === slug)
        const ids = doc?.layout.map((block) => block.id)
        expect(ids, `${locale} ${slug}`).toEqual([real[locale][slug]])
        for (const pin of pinnedPaths) expect(pin).not.toContain(real[locale][slug])
        for (const leaf of ['content', 'header.title', 'header.intro', 'header.eyebrow', 'text']) {
          expect(allowed(`layout.${real[locale][slug]}.${leaf}`)).toBe(false)
        }
      }
    }
    expect(read('src/contentAllowlist.ts')).not.toMatch(
      /6b0871a7bb5dd40a0f68b126|6b0871a9bb5dd40a0f68b127|6b0871afbb5dd40a0f68b128|6b0871b0bb5dd40a0f68b129/,
    )
  })
})
