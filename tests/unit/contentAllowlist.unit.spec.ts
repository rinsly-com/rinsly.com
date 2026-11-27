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
  LOCALES,
  PAGE_SCALARS,
  PINNED_BLOCKS,
  collectPins,
  findBlock,
  parseArgs,
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

describe('src/contentAllowlist.ts', () => {
  it('parses as an allowlist and loses no entry to the endpoint parser', () => {
    const parsed = parseAllowlist(contentAllowlist)
    expect(parsed).not.toBeNull()
    expect(parsed?.collections?.pages).toEqual(pagePaths)
    expect(parsed?.globals).toEqual({})
  })

  it('covers only pages, with SEO title/description plus one pinned heading per page and locale', () => {
    expect(Object.keys(contentAllowlist)).toEqual(['collections'])
    expect(Object.keys(contentAllowlist.collections)).toEqual(['pages'])
    expect(pagePaths.slice(0, 2)).toEqual(['meta.title', 'meta.description'])
    expect(pinnedPaths).toHaveLength(PINNED_BLOCKS.length * LOCALES.length)
    expect(pagePaths).toHaveLength(PAGE_SCALARS.length + pinnedPaths.length)
    expect(new Set(pagePaths).size).toBe(pagePaths.length)
  })

  it('has no wildcard, index or env-style entry, only exact row ids', () => {
    for (const path of pinnedPaths) {
      expect(path).toMatch(/^layout\.[0-9a-f]{24}\.header\.title$/)
    }
    expect(pagePaths.some((path) => path.includes('*'))).toBe(false)
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
      'layout.000000000000000000000000.header.title',
      'layout.ffffffffffffffffffffffff.header.title',
      `layout.${id}.header.title `,
      `layout.${id.toUpperCase()}.header.title`,
      '__proto__.title',
      'meta.token',
    ]
    for (const path of rejected) expect(allowed(path), path).toBe(false)
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
      expect(isWritableLeafPath(alone, `layout.row1.${spec.field}`), spec.blockType).toBe(true)
    }
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

type Block = { blockType: string; id?: string; header: { title: string } }
type Doc = { id: number; slug: string; layout: Block[] }
type Responses = { nl: { docs: Doc[] }; en: { docs: Doc[] } }

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
    ],
  }
}

const fixture = (): Responses => ({
  nl: response('nl', { website: 'aaaaaaaaaaaaaaaaaaaa0001', contact: 'bbbbbbbbbbbbbbbbbbbb0001' }),
  en: response('en', { website: 'aaaaaaaaaaaaaaaaaaaa0002', contact: 'bbbbbbbbbbbbbbbbbbbb0002' }),
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

describe('scripts/content-allowlist-ids.mjs', () => {
  it('pins the website hero and the contact block heading, per locale, in a fixed order', () => {
    expect(collectPins(fixture()).map((pin) => pin.path)).toEqual([
      'layout.aaaaaaaaaaaaaaaaaaaa0001.header.title',
      'layout.aaaaaaaaaaaaaaaaaaaa0002.header.title',
      'layout.bbbbbbbbbbbbbbbbbbbb0001.header.title',
      'layout.bbbbbbbbbbbbbbbbbbbb0002.header.title',
    ])
  })

  it('is deterministic: same output however the API orders pages and blocks, and on repeat runs', () => {
    const a = fixture()
    const b = fixture()
    for (const locale of ['nl', 'en'] as const) {
      b[locale].docs.reverse()
      for (const doc of b[locale].docs) doc.layout.reverse()
    }
    const first = renderModule(collectPins(a))
    expect(renderModule(collectPins(b))).toBe(first)
    expect(renderModule(collectPins(a))).toBe(first)
    expect(first.endsWith('\n')).toBe(true)
    expect(first).not.toMatch(/\d{4}-\d{2}-\d{2}|Date\(|undefined/)
  })

  it('renders a module whose entries pass the endpoint matcher and nothing else does', () => {
    const text = renderModule(collectPins(fixture()))
    const paths = [...text.matchAll(/^\s+'([^']+)',/gm)].map((match) => match[1])
    expect(paths).toEqual([
      'meta.title',
      'meta.description',
      'layout.aaaaaaaaaaaaaaaaaaaa0001.header.title',
      'layout.aaaaaaaaaaaaaaaaaaaa0002.header.title',
      'layout.bbbbbbbbbbbbbbbbbbbb0001.header.title',
      'layout.bbbbbbbbbbbbbbbbbbbb0002.header.title',
    ])
    const list = parseAllowlist({ collections: { pages: paths } })
    expect(list).not.toBeNull()
    const ok = (path: string) => isAllowlisted(list as never, target(path))
    for (const path of paths) expect(ok(path)).toBe(true)
    expect(ok('layout.b2.header.title')).toBe(false)
    expect(ok('layout.aaaaaaaaaaaaaaaaaaaa0001.header.intro')).toBe(false)
  })

  it('stops instead of guessing when a page or block is missing or ambiguous', () => {
    const missingPage = fixture()
    missingPage.nl.docs = missingPage.nl.docs.filter((doc) => doc.slug !== 'contact')
    expect(() => collectPins(missingPage)).toThrow(/nl: expected one page with slug "contact"/)

    const twoPages = fixture()
    twoPages.en.docs.push(structuredClone(pageOf(twoPages, 'en', 'website')))
    expect(() => collectPins(twoPages)).toThrow(
      /en: expected one page with slug "website", found 2/,
    )

    const twoBlocks = fixture()
    pageOf(twoBlocks, 'nl', 'website').layout.push({
      blockType: 'hero',
      id: 'dup',
      header: { title: 'again' },
    })
    expect(() => collectPins(twoBlocks)).toThrow(/expected one "hero" block on "website", found 2/)

    const noBlock = fixture()
    const contact = pageOf(noBlock, 'en', 'contact')
    contact.layout = contact.layout.filter((block) => block.blockType !== 'contact')
    expect(() => collectPins(noBlock)).toThrow(/found 0/)
  })

  it('refuses a block with no usable id or an empty heading, and a response with no docs', () => {
    const badId = fixture()
    blockOf(badId, 'nl', 'website', 'hero').id = '../x'
    expect(() => collectPins(badId)).toThrow(/no usable row id/)

    for (const bad of ['42', 'AAAAAAAAAAAAAAAAAAAA0001', 'aaaaaaaaaaaaaaaaaaaa001']) {
      const res = fixture()
      blockOf(res, 'nl', 'website', 'hero').id = bad
      expect(() => collectPins(res)).toThrow(/no usable row id/)
    }

    const noId = fixture()
    delete blockOf(noId, 'nl', 'website', 'hero').id
    expect(() => collectPins(noId)).toThrow(/no usable row id/)

    const empty = fixture()
    blockOf(empty, 'en', 'website', 'hero').header.title = '  '
    expect(() => collectPins(empty)).toThrow(/empty or not text/)

    expect(() => collectPins({ nl: {}, en: {} })).toThrow(/no docs array/)
    expect(() => {
      findBlock([], PINNED_BLOCKS[0], 'nl')
    }).toThrow()
  })

  it('has a write-safe CLI: --write only from the real API, both fixture files or none', () => {
    expect(parseArgs([]).mode).toBe('print')
    expect(parseArgs(['--check']).mode).toBe('check')
    expect(parseArgs(['--write', '--url', 'http://localhost:3000']).url).toBe(
      'http://localhost:3000',
    )
    expect(() => parseArgs(['--write', '--nl', 'a.json', '--en', 'b.json'])).toThrow(/needs --url/)
    expect(() => parseArgs(['--nl', 'a.json'])).toThrow(/both/)
    expect(() => parseArgs(['--bogus'])).toThrow(/unknown argument/)
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
