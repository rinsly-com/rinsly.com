#!/usr/bin/env node
/**
 * Generates src/contentAllowlist.ts: the content-endpoint allowlist for
 * rinsly.com, with every block (and array row) id pinned.
 *
 *   node scripts/content-allowlist-ids.mjs                 print the module (accp public API)
 *   node scripts/content-allowlist-ids.mjs --write         rewrite src/contentAllowlist.ts
 *   node scripts/content-allowlist-ids.mjs --check         exit 1 when src/contentAllowlist.ts is stale
 *   --url <origin>      read pages from <origin>/api/pages (default https://accp.rinsly.com).
 *                       A local dev server on a seeded local D1 works the same way.
 *   --nl <file> --en <file>
 *                       read the two REST responses from files instead (offline, tests)
 *
 * Read-only. It only does GET requests against the public pages API (published
 * documents, no credentials) or reads files. It never touches a database, a
 * secret, or the content endpoint itself.
 *
 * Why ids are pinned: the allowlist cannot be scoped to one page, only a
 * nested field path can be pinned to one row by its Payload row id
 * (`layout.<blockId>.header.title`). Block ids are unique per row and per
 * locale and are stable since the DF1 seed lock (#100). A seed run that
 * rebuilds a layout gives its blocks new ids; the old pins then match nothing,
 * so the endpoint denies the write (fails closed). Regenerate with --write.
 *
 * Output is deterministic: it depends only on the pinned spec below and on the
 * ids found, never on the order the API returns pages or blocks.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const LOCALES = ['nl', 'en']

/**
 * Document-level SEO fields. Payload's `meta` group is localized and applies to
 * every page: the endpoint's allowlist cannot scope a top-level path to one
 * page, so `meta.title` and `meta.description` are writable on all pages
 * (including the noindex legal pages). Accepted in the plan (PLAN.md, 2).
 */
export const PAGE_SCALARS = ['meta.title', 'meta.description']

/** Legal pages: never add these slugs to PINNED_BLOCKS. */
export const LEGAL_SLUGS = ['privacy', 'voorwaarden']

/** Array fields that a spec may expand into per-row pins. */
const ROW_FIELDS = new Set(['cards', 'items'])

/** Leaf names that are rich text in the pages schema. Never pin them. */
const RICH_TEXT_LEAVES = new Set(['content', 'body'])

/**
 * Block fields pinned to one block row on one page, per locale. Exactly one
 * block of `blockType` must exist on the page (after `match`, if any), or the
 * script stops.
 *
 * `field` is a dotted path on the block (`header.title`, `text`) or, when
 * `rows` is set, on each array row (`title`, `description`).
 * `match` disambiguates when a page has more than one block of that type
 * (`{ path, equals }`, compared as strings).
 */
export const PINNED_BLOCKS = [
  { page: 'website', blockType: 'hero', field: 'header.title', label: '/website H1' },
  {
    page: 'contact',
    blockType: 'contact',
    field: 'header.title',
    label: '/contact form section heading',
  },
  // #107: partner check-CTA body text. Two CTA blocks live on this page; the
  // button URL is not itself allowlisted, so it is a stable discriminator.
  {
    page: 'partnerprogramma',
    blockType: 'cta',
    field: 'text',
    match: { path: 'button.url', equals: '/check' },
    label: '/partnerprogramma check-CTA text',
  },
  // #107: Woerden hero, services, regio header, FAQ and page-CTA plain-text
  // fields. Rich-text leaves (regio body, FAQ answers) stay out; they wait
  // for Part C.
  {
    page: 'website-laten-maken-woerden',
    blockType: 'hero',
    field: 'header.eyebrow',
    label: '/woerden hero eyebrow',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'hero',
    field: 'header.title',
    label: '/woerden hero title',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'hero',
    field: 'header.intro',
    label: '/woerden hero intro',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'services',
    field: 'header.eyebrow',
    label: '/woerden services eyebrow',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'services',
    field: 'header.title',
    label: '/woerden services title',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'services',
    field: 'header.intro',
    label: '/woerden services intro',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'services',
    rows: 'cards',
    field: 'title',
    label: '/woerden services card title',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'services',
    rows: 'cards',
    field: 'description',
    label: '/woerden services card text',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'accordion',
    field: 'header.eyebrow',
    label: '/woerden FAQ eyebrow',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'accordion',
    field: 'header.title',
    label: '/woerden FAQ title',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'accordion',
    rows: 'items',
    field: 'title',
    label: '/woerden FAQ question',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'richText',
    field: 'header.eyebrow',
    label: '/woerden regio eyebrow',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'richText',
    field: 'header.title',
    label: '/woerden regio title',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'cta',
    field: 'eyebrow',
    label: '/woerden page CTA eyebrow',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'cta',
    field: 'title',
    label: '/woerden page CTA title',
  },
  {
    page: 'website-laten-maken-woerden',
    blockType: 'cta',
    field: 'text',
    label: '/woerden page CTA text',
  },
]

// Payload row ids on D1 are 24-char lowercase hex (ObjectId-style). Anything else is refused.
const ID_RE = /^[0-9a-f]{24}$/
const FETCH_TIMEOUT_MS = 15_000
const DEFAULT_URL = 'https://accp.rinsly.com'
const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/contentAllowlist.ts')

/** Read a dotted path on a plain object. Missing segments yield undefined. */
export function readField(value, path) {
  if (typeof path !== 'string' || path === '') return undefined
  let current = value
  for (const segment of path.split('.')) {
    if (current == null || typeof current !== 'object' || !Object.hasOwn(current, segment)) {
      return undefined
    }
    current = current[segment]
  }
  return current
}

function leafName(field) {
  const parts = typeof field === 'string' ? field.split('.') : []
  return parts[parts.length - 1] ?? ''
}

function assertSpec(spec) {
  if (LEGAL_SLUGS.includes(spec.page)) {
    throw new Error(`refusing to pin a field on legal page "${spec.page}"`)
  }
  if (RICH_TEXT_LEAVES.has(leafName(spec.field))) {
    throw new Error(`refusing to pin rich-text field "${spec.field}" on "${spec.page}"`)
  }
  if (spec.rows && !ROW_FIELDS.has(spec.rows)) {
    throw new Error(`unsupported rows field "${spec.rows}" on "${spec.page}"`)
  }
}

function describeMatch(spec) {
  if (!spec.match) return ''
  return ` matching ${spec.match.path}=${JSON.stringify(spec.match.equals)}`
}

function assertText(value, locale, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${locale}: ${label} is empty or not text; refusing to pin it`)
  }
}

function assertId(id, locale, label) {
  if (typeof id !== 'string' || !ID_RE.test(id)) {
    throw new Error(`${locale}: ${label} has no usable row id`)
  }
}

/** The block row of a page that a spec entry points at. Throws unless there is exactly one. */
export function findBlock(docs, spec, locale) {
  assertSpec(spec)
  const pages = docs.filter((doc) => doc && doc.slug === spec.page)
  if (pages.length !== 1) {
    throw new Error(`${locale}: expected one page with slug "${spec.page}", found ${pages.length}`)
  }
  const layout = Array.isArray(pages[0].layout) ? pages[0].layout : []
  let blocks = layout.filter((block) => block && block.blockType === spec.blockType)
  if (spec.match) {
    const { path, equals } = spec.match
    if (typeof path !== 'string' || path === '' || typeof equals !== 'string') {
      throw new Error(`${locale}: "${spec.blockType}" on "${spec.page}" has an unusable match`)
    }
    blocks = blocks.filter((block) => readField(block, path) === equals)
  }
  if (blocks.length !== 1) {
    throw new Error(
      `${locale}: expected one "${spec.blockType}" block on "${spec.page}"${describeMatch(spec)}, found ${blocks.length}`,
    )
  }
  const block = blocks[0]
  assertId(block.id, locale, `"${spec.blockType}" block on "${spec.page}"`)
  if (!spec.rows) {
    assertText(readField(block, spec.field), locale, `${spec.page} ${spec.blockType} ${spec.field}`)
  }
  return block
}

/** Pins for one spec on one already-located block, including array rows. */
export function pinsForBlock(block, spec, locale) {
  assertSpec(spec)
  if (!spec.rows) {
    return [
      {
        path: `layout.${block.id}.${spec.field}`,
        comment: `${locale} ${spec.label}`,
      },
    ]
  }
  const rows = Array.isArray(block[spec.rows]) ? block[spec.rows].slice() : []
  if (rows.length === 0) {
    throw new Error(
      `${locale}: expected ${spec.rows} on "${spec.page}" ${spec.blockType}, found ${rows.length}`,
    )
  }
  // Sort by id so the module does not depend on the API's array order.
  rows.sort((a, b) => String(a?.id ?? '').localeCompare(String(b?.id ?? '')))
  return rows.map((row, index) => {
    assertId(row.id, locale, `${spec.page} ${spec.blockType} ${spec.rows} row`)
    assertText(
      readField(row, spec.field),
      locale,
      `${spec.page} ${spec.blockType} ${spec.rows}.${spec.field}`,
    )
    return {
      path: `layout.${block.id}.${spec.rows}.${row.id}.${spec.field}`,
      comment: `${locale} ${spec.label} ${index + 1}`,
    }
  })
}

/** Pure: REST responses (`{ docs }` per locale) to the ordered pin list. */
export function collectPins(responses) {
  const pins = []
  for (const spec of PINNED_BLOCKS) {
    for (const locale of LOCALES) {
      const docs = responses[locale]?.docs
      if (!Array.isArray(docs)) throw new Error(`${locale}: response has no docs array`)
      const block = findBlock(docs, spec, locale)
      pins.push(...pinsForBlock(block, spec, locale))
    }
  }
  return pins
}

/** Pure: the full text of src/contentAllowlist.ts. */
export function renderModule(pins) {
  const lines = [
    '// GENERATED by scripts/content-allowlist-ids.mjs --write. Do not edit by hand:',
    '// `node scripts/content-allowlist-ids.mjs --check` fails when this file is stale.',
    '// How and when to regenerate: docs/content-endpoint.md.',
    "import type { ContentAllowlist } from '@rinsly-com/site-core/content'",
    '',
    '/**',
    ' * What the content endpoint may write on rinsly.com (POST /api/rinsly/content).',
    ' * Anything not listed is denied. RINSLY_CONTENT_ALLOWLIST stays unset: when it',
    ' * is set it replaces this list, and a secret cannot be reviewed in a PR.',
    ' */',
    'export const contentAllowlist = {',
    '  collections: {',
    '    pages: [',
    '      // SEO title and description, localized. Applies to every page: a top-level',
    '      // path cannot be scoped to one page.',
    ...PAGE_SCALARS.map((path) => `      '${path}',`),
    '      // Pinned to one block row by its Payload row id (per locale).',
    ...pins.map((pin) => `      '${pin.path}', // ${pin.comment}`),
    '    ],',
    '  },',
    '} as const satisfies ContentAllowlist',
    '',
  ]
  return lines.join('\n')
}

async function fetchResponses(origin) {
  const out = {}
  for (const locale of LOCALES) {
    const url = new URL('/api/pages', origin)
    url.search = new URLSearchParams({
      limit: '100',
      depth: '0',
      pagination: 'false',
      draft: 'false',
      locale,
    }).toString()
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok)
      throw new Error(`GET ${url.origin}${url.pathname} (${locale}) -> HTTP ${res.status}`)
    out[locale] = await res.json()
  }
  return out
}

function readResponses(files) {
  const out = {}
  for (const locale of LOCALES) out[locale] = JSON.parse(readFileSync(files[locale], 'utf8'))
  return out
}

export function parseArgs(argv) {
  const opts = { mode: 'print', url: DEFAULT_URL, files: {} }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--write') opts.mode = 'write'
    else if (arg === '--check') opts.mode = 'check'
    else if (arg === '--url') opts.url = argv[++i]
    else if (arg === '--nl' || arg === '--en') opts.files[arg.slice(2)] = argv[++i]
    else throw new Error(`unknown argument: ${arg}`)
  }
  const given = LOCALES.filter((locale) => opts.files[locale])
  if (given.length !== 0 && given.length !== LOCALES.length)
    throw new Error('pass both --nl and --en')
  if (opts.mode === 'write' && opts.files.nl) {
    // Fixture files are not accp: writing pins from them would be a quiet mistake.
    throw new Error('--write needs --url (the real pages API), not fixture files')
  }
  return opts
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const responses = opts.files.nl ? readResponses(opts.files) : await fetchResponses(opts.url)
  const text = renderModule(collectPins(responses))
  if (opts.mode === 'print') {
    process.stdout.write(text)
  } else if (opts.mode === 'write') {
    writeFileSync(OUTPUT, text)
    console.log(`wrote ${OUTPUT}`)
  } else {
    const current = readFileSync(OUTPUT, 'utf8')
    if (current === text) console.log('src/contentAllowlist.ts is up to date')
    else {
      console.error('src/contentAllowlist.ts is stale: run with --write and review the diff')
      process.exitCode = 1
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
