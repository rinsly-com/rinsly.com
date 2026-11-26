/**
 * DF1 seed lock. accp D1 is the source of truth for rinsly.com copy; this seed
 * only bootstraps. It creates pages that do not exist, and it finishes an
 * incomplete locale: no published document (draft-only, including a crash
 * between pass 1 and pass 2, or after layouts were written but before
 * publish), a published locale with no layout blocks, or a header/footer
 * locale with no copy text. A published locale that already has layout
 * blocks, or a header/footer locale that already has a label, is left alone,
 * so a content-endpoint or editor edit is not reverted by the next seed run.
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
 * treated as seed-accp). Local seeds (no those values) may still run after
 * handover, to build a fresh dev database.
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
 * True when this locale still needs a bootstrap write. Pass the published
 * document (draft: false, fallbackLocale: false). Empty layout or no
 * published document (draft-only) is unseeded. A published locale with
 * layout blocks is finished and must not be overwritten, even if a draft
 * also exists.
 */
export function pageLocaleNeedsSeed(published: PageLocale): boolean {
  return pageLocaleIsStub(published)
}

/**
 * Which locales pass 2 should write. A row this run just created is written
 * in both locales. Otherwise each locale is decided on its published
 * document: missing or empty layout is filled; a published layout is kept.
 * Returns null when both published locales already have blocks.
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
 * closed; they do not run the seed.
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
