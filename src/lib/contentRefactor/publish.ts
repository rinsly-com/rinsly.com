/**
 * Publish step for the 27 Nov 2026 content refactor: publishes the migrated
 * drafts of home, prijzen, partnerprogramma and contact (NL + EN), and nothing
 * else. Used by scripts/publish-refactor.ts.
 *
 * Guard (the same check as down() in run.ts): a page-locale is published only
 * when its latest draft is still exactly the migrated copy and its published
 * version is still the accp snapshot. Already published (published = migrated)
 * counts as done. Anything else blocks the whole run before the first write.
 *
 * Dry run is the default; writing needs `apply` plus the confirmation phrase,
 * because publishing these pages is the production go-live (see
 * docs/runbook-refactor-part2-content.md).
 */
import { createHash } from 'node:crypto'

import preimage from './accpPreimage.json'
import { type Obj, normalise, sameValue } from './edit'
import { type Locale, PAGE_SLUGS, type PageDoc, type PageSlug, transformPage } from './pages'
import { toSlugRefs } from './refs'

export const PUBLISH_CONFIRM = 'publish-4-pages-and-go-live'
const LOCALES: Locale[] = ['nl', 'en']
const SNAPSHOT = (preimage as unknown as { pages: Record<PageSlug, Record<Locale, PageDoc>> }).pages

/** Short sha256 of the normalised document, the same normalisation sameValue uses. */
export const contentHash = (doc: unknown): string =>
  createHash('sha256').update(JSON.stringify(normalise(doc))).digest('hex').slice(0, 12)

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

export function planPublish(states: PageState[]): PublishPlan {
  const plan: PublishPlan = { ready: [], already: [], blocked: [] }
  for (const state of states) {
    const migrated = migratedPage(state.slug, state.locale)
    const snapshot = snapshotPage(state.slug, state.locale)
    if (!sameValue(state.latestDraft, migrated)) {
      const why = sameValue(state.latestDraft, snapshot) ? 'still the snapshot: the migration has not run' : 'edited since the migration'
      plan.blocked.push(`${label(state)}: latest draft ${contentHash(state.latestDraft)} is not the migrated copy ${contentHash(migrated)} (${why})`)
    } else if (sameValue(state.published, migrated)) {
      plan.already.push(label(state))
    } else if (sameValue(state.published, snapshot)) {
      plan.ready.push(state)
    } else {
      plan.blocked.push(`${label(state)}: published version ${contentHash(state.published)} is neither the snapshot nor the migrated copy`)
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
  log: (line: string) => void
}

export type PublishResult = { applied: boolean; published: string[]; already: string[] }

const asPage = (raw: Obj, slugById: Map<number, string>): PageDoc =>
  toSlugRefs({ layout: (raw.layout ?? []) as PageDoc['layout'], meta: (raw.meta ?? {}) as Obj }, slugById)

export async function runPublish({ source, publisher, apply, confirm, log }: PublishArgs): Promise<PublishResult> {
  if (apply && !publisher) throw new Error('[publish-refactor] this source is read-only; --apply needs the Payload local API')
  if (apply && confirm !== PUBLISH_CONFIRM) {
    throw new Error(`[publish-refactor] --apply needs the confirmation phrase "${PUBLISH_CONFIRM}": publishing these pages is the production go-live`)
  }
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

  const plan = planPublish(states)
  const blocked = [...missing, ...plan.blocked]
  for (const where of plan.already) log(`already published ${where}`)
  for (const state of plan.ready) log(`${apply ? 'publishing' : 'would publish'} ${label(state)} (${contentHash(state.latestDraft)})`)
  if (blocked.length) {
    throw new Error(`[publish-refactor] aborted, nothing written. Not in the state the migration left:\n  ${blocked.join('\n  ')}`)
  }
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
