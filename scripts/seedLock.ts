/**
 * DF1 seed lock. accp D1 is the source of truth for rinsly.com copy; this seed
 * only bootstraps. It creates pages that do not exist, and it finishes an
 * incomplete locale: no published document and no layout in the draft (a
 * title-only stub, including a crash between pass 1 and pass 2), a published
 * locale with no layout blocks and no editor draft on that locale, or a
 * header/footer locale with no copy text. A published locale that already
 * has layout blocks, a never-published draft that already has layout
 * (editor-owned: Keep, do not publish or overwrite), a locale whose draft is
 * newer than the published version, or a header/footer locale that already
 * has a label, is left alone, so a content-endpoint or editor edit is not
 * reverted or promoted by the next seed run.
 *
 * Finishing a missing locale on an already-published page writes that locale
 * onto the published version (locale + _status, publishSpecificLocale) and
 * does not publish the document, so another locale's unpublished draft stays
 * unpublished and onContentPublished does not fire for that draft.
 *
 * Header and footer are decided per locale (fallbackLocale: false). All-blank
 * copy in a locale (no labels, tagline, or copyright) is treated as truly
 * unseeded and is refilled; a locale with any of those strings is kept, even
 * if other fields are empty. Shared nav/menu rows written with the first
 * locale do not count as copy in the other locale until that locale has labels.
 *
 * RINSLY_HANDED_OVER is default-open by design: unset, empty, 0, false, or no
 * (case-insensitive) means not handed over, so a first accp seed can run
 * before the variable is set. 1, true, or yes means handed over. Any other
 * value fails closed with InvalidHandoverFlagError and does not seed. A
 * handed-over run is blocked when SEED_COMMAND=seed-accp, SEED_TARGET=accp,
 * or NODE_ENV=production (a production seed against remote bindings is
 * treated as seed-accp). Local seeds (none of those values) may still run
 * after handover, to build a fresh dev database. An invalid
 * RINSLY_HANDED_OVER value fails closed on local seeds too, before any
 * database access.
 *
 * Known limit: deleting a page on accp and then seeding recreates it with a
 * new id. Internal links (header nav, in-page buttons) on pages that were
 * kept still point at the old id, which Payload nulls on delete, and this
 * seed does not rewrite them. Remove the slug from `sitePages` as well, or
 * relink by hand.
 */

import { assertSeedAllowed } from '@rinsly-com/site-core/content'

type Env = Record<string, string | undefined>

type PageLocale = { layout?: unknown; _status?: unknown; [key: string]: unknown } | null | undefined

type LocaleDocs = {
  nl: PageLocale
  en: PageLocale
}

export type LocalesToWrite = { nl: boolean; en: boolean }

export type SeedSession = {
  /** NODE_ENV=production: skip orphan repair and admin-role promotion. */
  production: boolean
}

/** True when this locale has no layout blocks (or no document). */
export function pageLocaleIsStub(doc: PageLocale): boolean {
  if (!doc) return true
  const layout = doc.layout
  return !Array.isArray(layout) || layout.length === 0
}

/**
 * True when this locale still needs a bootstrap write. Pass the document
 * from `draft: false` (fallbackLocale: false). Payload still returns a
 * never-published draft on that query, so only `_status === 'published'`
 * counts as published. Empty layout, no document, or a draft-only row is
 * unseeded. A published locale with layout blocks is finished and must not
 * be overwritten, even if a draft also exists.
 */
export function pageLocaleNeedsSeed(published: PageLocale): boolean {
  if (!published || published._status !== 'published') return true
  return pageLocaleIsStub(published)
}

/**
 * Which locales would be written if only the published document is considered.
 * Pass 2 uses `pageSeedPlan`, which also inspects drafts (editor-owned and
 * newer drafts are kept). Returns null when both published locales already
 * have blocks.
 */
export function localesToWrite(createdThisRun: boolean, published: LocaleDocs): LocalesToWrite | null {
  if (createdThisRun) return { nl: true, en: true }
  const needs: LocalesToWrite = {
    nl: pageLocaleNeedsSeed(published.nl),
    en: pageLocaleNeedsSeed(published.en),
  }
  if (!needs.nl && !needs.en) return null
  return needs
}

export type PageSeedAction =
  | { action: 'keep'; reason: string }
  | {
      action: 'write'
      locales: LocalesToWrite
      /** Always per-locale: write with locale + _status, never a document-wide publish. */
      publish: 'locale'
    }

function dateOf(value: unknown): number | undefined {
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const ms = new Date(value).getTime()
    return Number.isFinite(ms) ? ms : undefined
  }
  return undefined
}

/**
 * Draft has layout and the published locale does not: the editor owns this
 * locale. A title-only or empty-layout draft is a stub, not editor-owned.
 * A crash after the seed wrote layouts and before publish cannot be told
 * apart from this case, so it is also kept.
 */
export function localeIsEditorOwned(published: PageLocale, draft: PageLocale): boolean {
  if (pageLocaleIsStub(draft)) return false
  return pageLocaleNeedsSeed(published)
}

/** Compare copy only; row/block ids can differ between the published row and a version. */
function copySignature(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(copySignature)
    return items.length === 0 ? null : items
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(record).sort()) {
      if (key === 'id' || key === 'blockName') continue
      const inner = copySignature(record[key])
      if (inner === null || inner === undefined) continue
      out[key] = inner
    }
    return Object.keys(out).length === 0 ? null : out
  }
  if (typeof value === 'string' && value.trim() === '') return null
  return value
}

export function localeCopyDiffers(a: PageLocale, b: PageLocale): boolean {
  const signature = (doc: PageLocale) =>
    JSON.stringify(copySignature({ title: doc?.title, layout: doc?.layout, meta: doc?.meta }))
  return signature(a) !== signature(b)
}

/**
 * True when this locale already has a published layout and a pending draft
 * whose copy differs from (or is timestamped after) the published version.
 * A leftover draft snapshot with the same copy is not treated as editor work.
 * The seed must not publish a real pending draft.
 */
export function localeDraftIsNewer(published: PageLocale, draft: PageLocale): boolean {
  if (!draft || pageLocaleNeedsSeed(published)) return false
  if (draft._status === 'published') return false
  if (!localeCopyDiffers(published, draft)) return false
  if (draft._status === 'draft') return true
  const draftAt = dateOf(draft.updatedAt)
  const publishedAt = dateOf(published?.updatedAt)
  return draftAt !== undefined && publishedAt !== undefined && draftAt > publishedAt
}

/**
 * What pass 2 should do with one page, given the published document and the
 * latest draft per locale.
 *
 * - A row this run just created is written in both locales and published
 *   per locale.
 * - A title-only / empty-layout stub (crash between pass 1 and pass 2) is
 *   finished and published per locale.
 * - S7: a never-published draft that already has layout is editor-owned:
 *   Keep and do not publish or overwrite.
 * - S4: a published page with a missing locale is filled on the published
 *   version only (`publish: 'locale'`). Another locale's unpublished draft
 *   is not published.
 * - A locale whose draft is newer than the published version is kept; if
 *   that leaves nothing to write, the page is skipped.
 */
export function pageSeedPlan(
  createdThisRun: boolean,
  published: LocaleDocs,
  drafts: LocaleDocs = { nl: undefined, en: undefined },
): PageSeedAction {
  if (createdThisRun) {
    return { action: 'write', locales: { nl: true, en: true }, publish: 'locale' }
  }

  const editorNl = localeIsEditorOwned(published.nl, drafts.nl)
  const editorEn = localeIsEditorOwned(published.en, drafts.en)
  const neverPublished = pageLocaleNeedsSeed(published.nl) && pageLocaleNeedsSeed(published.en)

  if (neverPublished && (editorNl || editorEn)) {
    return { action: 'keep', reason: 'editor draft; not overwriting or publishing' }
  }

  const locales: LocalesToWrite = {
    nl: pageLocaleNeedsSeed(published.nl) && !editorNl,
    en: pageLocaleNeedsSeed(published.en) && !editorEn,
  }
  if (!locales.nl && !locales.en) {
    const pending =
      editorNl ||
      editorEn ||
      localeDraftIsNewer(published.nl, drafts.nl) ||
      localeDraftIsNewer(published.en, drafts.en)
    return {
      action: 'keep',
      reason: pending ? 'editor draft; not overwriting or publishing' : 'exists; copy lives in D1',
    }
  }

  return { action: 'write', locales, publish: 'locale' }
}

type LinkFields = { page?: unknown; label?: unknown; url?: unknown }

export type GlobalLinks = {
  navItems?: LinkFields[] | null
  cta?: LinkFields | null
  menuItems?: LinkFields[] | null
  infoLinks?: LinkFields[] | null
}

/**
 * Paths in a live header/footer that should point at `pageId` (the slug the
 * seed just recreated) but are null or still on another id. Used to warn
 * that those links need relinking; the seed does not rewrite them.
 */
export function unrelinkedPaths(
  slug: string,
  pageId: number,
  expected: GlobalLinks,
  actual: GlobalLinks | null | undefined,
  globalSlug: 'header' | 'footer',
): string[] {
  const paths: string[] = []
  const push = (path: string, label: unknown) => {
    const name = typeof label === 'string' && label.trim() ? label : slug
    paths.push(`${globalSlug}.${path} ("${name}")`)
  }
  const items = (list: LinkFields[] | null | undefined) => list ?? []
  const expectedNav = items(expected.navItems)
  const actualNav = items(actual?.navItems)
  for (let i = 0; i < expectedNav.length; i++) {
    const want = expectedNav[i] as LinkFields | undefined
    if (want === undefined || want.page !== pageId) continue
    const got = actualNav[i] as LinkFields | undefined
    if (got === undefined || got.page !== pageId) push(`navItems[${i}]`, want.label)
  }
  if (expected.cta?.page === pageId && actual?.cta?.page !== pageId) {
    push('cta', expected.cta.label)
  }
  for (const field of ['menuItems', 'infoLinks'] as const) {
    const wantList = items(expected[field])
    const gotList = items(actual?.[field])
    for (let i = 0; i < wantList.length; i++) {
      const want = wantList[i] as LinkFields | undefined
      if (want === undefined || want.page !== pageId) continue
      const got = gotList[i] as LinkFields | undefined
      if (got === undefined || got.page !== pageId) push(`${field}[${i}]`, want.label)
    }
  }
  return paths
}

/** One warning line, or null when every expected link already points at the new id. */
export function recreateLinkWarning(slug: string, pageId: number, paths: readonly string[]): string | null {
  if (!paths.length) return null
  const path = slug === 'home' ? '/' : `/${slug}`
  return `Seed recreated ${path} with a new id (${pageId}). These header/footer links still point at the old page and need relinking: ${paths.join(', ')}`
}

/** Null, undefined, whitespace, an empty list, or an object whose values are all blank (ids ignored). */
export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).every(([key, inner]) => key === 'id' || isBlank(inner))
  }
  return false
}

const GLOBAL_CONTENT = {
  header: ['navItems', 'cta'],
  footer: ['tagline', 'menuItems', 'infoLinks', 'copyright'],
} as const

const COPY_KEYS = new Set(['label', 'tagline', 'copyright'])
const STRUCTURAL_KEYS = new Set([
  'id',
  'type',
  'page',
  'url',
  'anchor',
  'variant',
  'newTab',
  'label',
  'tagline',
  'copyright',
])

/**
 * True when there is no copy text (label, tagline, copyright) in this value.
 * Structural fields (ids, link type, page references, urls) are ignored, so
 * shared nav rows written with NL do not make EN look seeded.
 */
function copyTextBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.every(copyTextBlank)
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const parts: unknown[] = []
    for (const key of COPY_KEYS) {
      if (Object.prototype.hasOwnProperty.call(record, key)) parts.push(record[key])
    }
    for (const [key, inner] of Object.entries(record)) {
      if (STRUCTURAL_KEYS.has(key)) continue
      if (inner && typeof inner === 'object') parts.push(inner)
    }
    if (parts.length === 0) return true
    return parts.every(copyTextBlank)
  }
  return true
}

/**
 * True when this locale has no copy text, i.e. it was never seeded or was
 * left all-blank. Call once per locale with fallbackLocale: false, so a
 * written NL cannot hide a missing EN (or the other way around). An
 * all-blank locale is treated as truly unseeded and is refilled; a locale
 * with any label, tagline, or copyright is kept.
 */
export function globalIsUnseeded(slug: keyof typeof GLOBAL_CONTENT, doc: Record<string, unknown> | null | undefined): boolean {
  if (!doc) return true
  return GLOBAL_CONTENT[slug].every((field) => copyTextBlank(doc[field]))
}

const HANDOVER_OFF = new Set(['', '0', 'false', 'no'])
const HANDOVER_ON = new Set(['1', 'true', 'yes'])

export class InvalidHandoverFlagError extends Error {
  readonly code = 'invalid-handover-flag'
  constructor(value: string) {
    super(
      `RINSLY_HANDED_OVER must be unset, empty, 0, false, or no (not handed over), or 1, true, or yes (handed over); got ${JSON.stringify(value)}`,
    )
    this.name = 'InvalidHandoverFlagError'
  }
}

/**
 * Strict parse. Default-open by design: unset, empty, 0, false, or no means
 * not handed over. 1, true, or yes means handed over. Unknown values fail
 * closed, including on local seeds; they do not run the seed.
 */
export function parseHandoverFlag(value: string | undefined): 'off' | 'on' {
  if (value === undefined) return 'off'
  const normalized = value.trim().toLowerCase()
  if (HANDOVER_OFF.has(normalized)) return 'off'
  if (HANDOVER_ON.has(normalized)) return 'on'
  throw new InvalidHandoverFlagError(value)
}

function isProductionEnv(env: Env): boolean {
  return env['NODE_ENV'] === 'production'
}

function isAccpTarget(command: string | undefined, target: string | undefined, env: Env): boolean {
  const resolvedCommand = (command ?? env['SEED_COMMAND'] ?? '').trim().toLowerCase()
  const resolvedTarget = (target ?? env['SEED_TARGET'] ?? '').trim().toLowerCase()
  return resolvedCommand === 'seed-accp' || resolvedTarget === 'accp' || isProductionEnv(env)
}

/**
 * Call this before getPayload, repairOrphanedVersions, or any other database
 * access. Parses RINSLY_HANDED_OVER strictly (unknown values throw
 * InvalidHandoverFlagError). A handed-over accp or production run throws
 * SeedAccpBlockedError. NODE_ENV=production is treated as seed-accp, so a
 * production seed against remote bindings cannot bypass the guard by omitting
 * SEED_COMMAND. Returns `{ production }` so the caller can skip orphan
 * repair and oldest-user admin promotion in production.
 */
export function beginSeed(options?: { command?: string; target?: string; env?: Env }): SeedSession {
  const env = options?.env ?? process.env
  parseHandoverFlag(env['RINSLY_HANDED_OVER'])
  const production = isProductionEnv(env)
  if (isAccpTarget(options?.command, options?.target, env)) {
    assertSeedAllowed({
      command: 'seed-accp',
      ...(options?.target !== undefined ? { target: options.target } : {}),
      env: { ...env, SEED_COMMAND: 'seed-accp' },
    })
  }
  return { production }
}
