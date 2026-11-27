/**
 * Publish step for the 27 Nov 2026 content refactor: publishes the migrated
 * drafts of home, prijzen, partnerprogramma and contact (NL + EN), and nothing
 * else. Used by scripts/publish-refactor.ts.
 *
 * Guard (the same idea as down() in run.ts), driven by publish-manifest.json:
 * a page-locale is published only when the sha256 of its latest draft is the
 * manifest's `draft` hash and its published version hashes to one of the
 * manifest's `published` hashes (the state before the drafts). Already
 * published (published = draft) counts as done. Anything else blocks the
 * whole run before the first write.
 *
 * The manifest, not the #121 copy, is the contract: a later PR that changes
 * the drafts (the redesign) regenerates or edits publish-manifest.json in the
 * same PR, and this step then publishes exactly that new state.
 *
 * Dry run is the default; writing needs `apply` plus the confirmation phrase,
 * because publishing these pages is the production go-live (see
 * docs/runbook-refactor-part2-content.md).
 */
import { createHash } from 'node:crypto'

import preimage from './accpPreimage.json'
import defaultManifest from './publish-manifest.json'
import { type Obj, normalise, sameValue } from './edit'
import { type Locale, PAGE_SLUGS, type PageDoc, type PageSlug, transformPage } from './pages'
import { toSlugRefs } from './refs'

export const PUBLISH_CONFIRM = 'publish-4-pages-and-go-live'
const LOCALES: Locale[] = ['nl', 'en']
const SNAPSHOT = (preimage as unknown as { pages: Record<PageSlug, Record<Locale, PageDoc>> }).pages

/** sha256 of the normalised document (the normalisation sameValue uses: key order and D1 nulls don't count). */
export const fullHash = (doc: unknown): string => createHash('sha256').update(JSON.stringify(normalise(doc))).digest('hex')
/** First 12 hex characters of fullHash, for logs. */
export const contentHash = (doc: unknown): string => fullHash(doc).slice(0, 12)

/**
 * How a page-locale is hashed. Part of the manifest contract: a manifest whose
 * `hash` differs from this is refused, and any change to `normalise` in
 * edit.ts changes every hash (the pinned unit test then fails until the
 * manifest is regenerated).
 */
export const MANIFEST_HASH = {
  algorithm: 'sha256',
  fields: ['layout', 'meta'],
  input: 'hex(sha256(JSON.stringify(normalise({ layout, meta }))))',
  normalisation:
    'src/lib/contentRefactor/edit.ts normalise(): object keys sorted; null, undefined, false, empty string, empty array and empty object dropped; blockName, createdAt and updatedAt dropped. Page relations are written as "@slug" (refs.ts toSlugRefs) before hashing.',
} as const

export const MANIFEST_VERSION = 1

/**
 * The publish contract (publish-manifest.json). Per page-locale key
 * (`home.nl`, ...; the four slugs are fixed in PAGE_SLUGS): `draft` = hash of
 * the draft to publish, `published` = hashes of the published versions it may
 * replace. Only `layout` and `meta` are covered (title and slug are not).
 * `sourceCommit` = the git commit the file was generated from (filled in by
 * scripts/publish-refactor-manifest.ts). A PR that changes the drafts (the
 * redesign) commits a new manifest. See docs/runbook-refactor-part2-content.md.
 */
export type PublishManifest = {
  version: typeof MANIFEST_VERSION
  hash: typeof MANIFEST_HASH
  sourceCommit: string
  note?: string
  pages: Record<string, { draft: string; published: string[] }>
}

/** Refuses a manifest with another version or hash definition, or a malformed one. */
export function parseManifest(value: unknown): PublishManifest {
  const manifest = value as Partial<PublishManifest> | null
  if (!manifest || manifest.version !== MANIFEST_VERSION) throw new Error(`[publish-refactor] manifest version ${String(manifest?.version)} is not ${MANIFEST_VERSION}`)
  if (JSON.stringify(manifest.hash) !== JSON.stringify(MANIFEST_HASH)) throw new Error('[publish-refactor] manifest hash definition differs from MANIFEST_HASH in publish.ts')
  if (typeof manifest.sourceCommit !== 'string' || !/^[0-9a-f]{40}$/.test(manifest.sourceCommit)) throw new Error('[publish-refactor] manifest sourceCommit is not a full git sha')
  const hex = /^[0-9a-f]{64}$/
  for (const [where, entry] of Object.entries(manifest.pages ?? {})) {
    if (!hex.test(entry.draft) || !entry.published.every((hash) => hex.test(hash))) throw new Error(`[publish-refactor] manifest ${where}: not a sha256 hex hash`)
  }
  return manifest as PublishManifest
}

/** The committed manifest, validated on use (so the generator can still run while it is outdated). */
export const loadPublishManifest = (): PublishManifest => parseManifest(defaultManifest)

/** The manifest for the #121 migration output, generated from `sourceCommit`. */
export function migrationManifest(sourceCommit: string): PublishManifest {
  const pages: PublishManifest['pages'] = {}
  for (const slug of PAGE_SLUGS) {
    for (const locale of LOCALES) {
      pages[`${slug}.${locale}`] = { draft: fullHash(migratedPage(slug, locale)), published: [fullHash(snapshotPage(slug, locale))] }
    }
  }
  return {
    version: MANIFEST_VERSION,
    hash: MANIFEST_HASH,
    sourceCommit,
    note: 'Generated by scripts/publish-refactor-manifest.ts from migration 20261127_170000_content_refactor. A PR that changes the drafts updates this file.',
    pages,
  }
}

export function snapshotPage(slug: PageSlug, locale: Locale): PageDoc {
  const { layout, meta } = SNAPSHOT[slug][locale]
  return { layout, meta }
}

export function migratedPage(slug: PageSlug, locale: Locale): PageDoc {
  const pre = snapshotPage(slug, locale)
  return transformPage(slug, locale, pre, pre).doc
}

export type PageState = { slug: PageSlug; locale: Locale; latestDraft: PageDoc; published: PageDoc }
export type PublishPlan = { ready: PageState[]; already: string[]; blocked: string[] }

const label = (state: { slug: string; locale: string }) => `${state.slug}.${state.locale}`

export function planPublish(states: PageState[], manifest: PublishManifest = loadPublishManifest()): PublishPlan {
  const plan: PublishPlan = { ready: [], already: [], blocked: [] }
  for (const state of states) {
    const expected = manifest.pages[label(state)] as PublishManifest['pages'][string] | undefined
    if (!expected) {
      plan.blocked.push(`${label(state)}: not in the publish manifest`)
      continue
    }
    const draft = fullHash(state.latestDraft)
    const published = fullHash(state.published)
    if (draft !== expected.draft) {
      const why = expected.published.includes(draft) ? 'still the pre-migration version: the migration has not run' : 'not the expected draft (edited since, or the manifest is out of date)'
      plan.blocked.push(`${label(state)}: latest draft ${draft.slice(0, 12)} is not ${expected.draft.slice(0, 12)} (${why})`)
    } else if (published === expected.draft) {
      plan.already.push(label(state))
    } else if (expected.published.includes(published)) {
      plan.ready.push(state)
    } else {
      plan.blocked.push(`${label(state)}: published version ${published.slice(0, 12)} is not one the manifest allows replacing`)
    }
  }
  return plan
}

/** Read side: Payload local API (local or remote D1) or the public accp API. */
export type PageSource = {
  pages: () => Promise<{ id: number; slug?: string | null }[]>
  read: (id: number, locale: Locale, draft: boolean) => Promise<Obj>
}
/** Write side: only the Payload local API has one. */
export type PagePublisher = (id: number, locale: Locale, draft: Obj) => Promise<void>

export type PublishArgs = {
  source: PageSource
  publisher?: PagePublisher
  apply: boolean
  confirm?: string
  manifest?: PublishManifest
  log: (line: string) => void
}

export type PublishResult = { applied: boolean; published: string[]; already: string[] }

const asPage = (raw: Obj, slugById: Map<number, string>): PageDoc =>
  toSlugRefs({ layout: (raw.layout ?? []) as PageDoc['layout'], meta: (raw.meta ?? {}) as Obj }, slugById)

/**
 * The apply/phrase check on its own, so the script can run it before it opens
 * a database connection (getPayload). runPublish repeats it.
 */
export function assertApplyAllowed({ apply, confirm, writable }: { apply: boolean; confirm?: string; writable: boolean }): void {
  if (apply && !writable) throw new Error('[publish-refactor] this source is read-only; apply needs the Payload local API')
  if (apply && confirm !== PUBLISH_CONFIRM) {
    throw new Error('[publish-refactor] apply needs the confirmation phrase from the runbook: publishing these pages is the production go-live')
  }
}

/** The slice of the Payload local API the publish step uses. */
export type PayloadLike = {
  find: (args: Record<string, unknown>) => Promise<{ docs: { id: number; slug?: string | null }[] }>
  findByID: (args: Record<string, unknown>) => Promise<unknown>
  update: (args: Record<string, unknown>) => Promise<unknown>
}

export function payloadSource(payload: PayloadLike): PageSource {
  return {
    pages: async () => (await payload.find({ collection: 'pages', depth: 0, pagination: false, draft: true, select: { slug: true } })).docs,
    read: async (id, locale, draft) => (await payload.findByID({ collection: 'pages', id, locale, fallbackLocale: false, depth: 0, draft })) as Obj,
  }
}

/**
 * Publishes ONE locale. `_status` is document-level on pages, so without
 * publishAllLocales: false + publishSpecificLocale Payload treats a published
 * update as publish-all and promotes the other locale's draft unchecked.
 */
export function payloadPublisher(payload: PayloadLike): PagePublisher {
  return async (id, locale, draft) => {
    await payload.update({
      collection: 'pages',
      id,
      locale,
      depth: 0,
      draft: false,
      publishAllLocales: false,
      publishSpecificLocale: locale,
      data: { layout: draft.layout, meta: draft.meta, _status: 'published' },
    })
  }
}

export async function runPublish({ source, publisher, apply, confirm, manifest = loadPublishManifest(), log }: PublishArgs): Promise<PublishResult> {
  assertApplyAllowed({ apply, confirm, writable: Boolean(publisher) })
  const docs = await source.pages()
  const idBySlug = new Map<string, number>()
  const slugById = new Map<number, string>()
  for (const doc of docs) {
    if (!doc.slug) continue
    if (idBySlug.has(doc.slug)) throw new Error(`[publish-refactor] more than one page with slug "${doc.slug}", aborting`)
    idBySlug.set(doc.slug, doc.id)
    slugById.set(doc.id, doc.slug)
  }

  const states: (PageState & { id: number; raw: Obj })[] = []
  const missing: string[] = []
  for (const slug of PAGE_SLUGS) {
    const id = idBySlug.get(slug)
    if (id === undefined) {
      missing.push(`${slug}: page not found`)
      continue
    }
    for (const locale of LOCALES) {
      const raw = await source.read(id, locale, true)
      const published = await source.read(id, locale, false)
      states.push({ id, raw, slug, locale, latestDraft: asPage(raw, slugById), published: asPage(published, slugById) })
    }
  }

  const plan = planPublish(states, manifest)
  const blocked = [...missing, ...plan.blocked]
  for (const where of plan.already) log(`already published ${where}`)
  if (blocked.length) {
    for (const state of plan.ready) log(`in state, not published (run aborted) ${label(state)}`)
    throw new Error(`[publish-refactor] aborted, nothing written. Not in the state publish-manifest.json expects:\n  ${blocked.join('\n  ')}`)
  }
  // Only after the guard passed for every page-locale.
  for (const state of plan.ready) log(`${apply ? 'will publish' : 'would publish'} ${label(state)} (${contentHash(state.latestDraft)})`)
  if (!apply || !publisher) {
    log(`dry run: ${plan.ready.length} to publish, ${plan.already.length} already published. Nothing written.`)
    return { applied: false, published: [], already: plan.already }
  }

  const published: string[] = []
  for (const state of states.filter((item) => plan.ready.includes(item))) {
    await publisher(state.id, state.locale, state.raw)
    const after = asPage(await source.read(state.id, state.locale, false), slugById)
    if (!sameValue(after, state.latestDraft)) throw new Error(`[publish-refactor] ${label(state)}: published version does not match the draft after publishing`)
    published.push(label(state))
    log(`published ${label(state)}`)
  }
  return { applied: true, published, already: plan.already }
}
