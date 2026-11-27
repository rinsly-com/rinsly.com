/**
 * Applies (up) or reverts (down) the 27 Nov 2026 content refactor through the
 * Payload local API. Used by src/migrations/20261127_170000_content_refactor.ts.
 *
 * Safety rules:
 *  - Only the pages in PAGE_SLUGS (home, prijzen, partnerprogramma, contact)
 *    and the header/footer globals are read or written. Privacy, voorwaarden
 *    and every other page are never touched.
 *  - A document (page or global, per locale) is written only when every guarded
 *    edit agrees with the accp snapshot; one conflict skips that document.
 *  - Pages are saved as a new **draft** (PUBLISH_PAGES = false). The published
 *    pages on accp, and therefore the static prod build, do not change until
 *    someone publishes them in the admin. The globals have no drafts.
 *  - Down restores the snapshot only where the document is still exactly what
 *    up left: for pages the migrated draft is the latest version and the
 *    snapshot is still the published one. Anything edited or published since
 *    is left alone and logged.
 *  - Page lookup fails closed: a duplicate slug, or a tenant field on pages,
 *    aborts the run before anything is written.
 */
import type { Payload, PayloadRequest } from 'payload'

import preimage from './accpPreimage.json'
import { type Obj, sameValue } from './edit'
import { type FooterDoc, type HeaderDoc, transformFooter, transformHeader } from './globals'
import { type Locale, PAGE_SLUGS, type PageDoc, type PageSlug, transformPage } from './pages'
import { fromSlugRefs, toSlugRefs } from './refs'

/** Pages are only ever saved as drafts; publishing is a person in the admin. */
export const PUBLISH_PAGES = false
/** Global fields that are not localized: written once, with the default locale. */
const SHARED_GLOBAL_FIELDS = ['address', 'phone']
const LOCALES: Locale[] = ['nl', 'en']

type Snapshot = {
  pages: Record<PageSlug, Record<Locale, PageDoc>>
  globals: { header: Record<Locale, HeaderDoc>; footer: Record<Locale, FooterDoc> }
}
const SNAPSHOT = preimage as unknown as Snapshot

export type RunReport = { written: string[]; unchanged: string[]; skipped: string[] }

type Args = { payload: Payload; req?: PayloadRequest; direction: 'up' | 'down' }

/**
 * Fail closed on page lookup: `slug` must identify exactly one page. The
 * collection has no tenant field today (one site per database); if one is
 * ever added, this migration refuses to run rather than guess a tenant.
 */
export function indexPages(docs: { id: number; slug?: string | null }[]) {
  const idBySlug = new Map<string, number>()
  const slugById = new Map<number, string>()
  for (const doc of docs) {
    if (!doc.slug) continue
    if (idBySlug.has(doc.slug)) throw new Error(`[content-refactor] more than one page with slug "${doc.slug}", aborting`)
    idBySlug.set(doc.slug, doc.id)
    slugById.set(doc.id, doc.slug)
  }
  return { idBySlug, slugById }
}

async function pageIds(payload: Payload, req?: PayloadRequest) {
  const fields = payload.collections.pages.config.flattenedFields
  if (fields.some((field) => field.name === 'tenant')) {
    throw new Error('[content-refactor] pages has a tenant field; this migration only knows a single-site database, aborting')
  }
  const all = await payload.find({ collection: 'pages', depth: 0, pagination: false, draft: true, req, select: { slug: true } })
  return indexPages(all.docs)
}

export async function runContentRefactor({ payload, req, direction }: Args): Promise<RunReport> {
  const report: RunReport = { written: [], unchanged: [], skipped: [] }
  const { idBySlug, slugById } = await pageIds(payload, req)
  const say = (line: string) => { payload.logger.info(`[content-refactor ${direction}] ${line}`); }
  // Every target is computed (and every @slug resolved) before the first
  // write, so a missing page or a transform error aborts with nothing written.
  const writes: { where: string; write: () => Promise<unknown> }[] = []

  for (const slug of PAGE_SLUGS) {
    const id = idBySlug.get(slug)
    if (id === undefined) {
      report.skipped.push(`${slug}: page not found`)
      continue
    }
    for (const locale of LOCALES) {
      const where = `${slug}.${locale}`
      const raw = (await payload.findByID({ collection: 'pages', id, locale, fallbackLocale: false, depth: 0, draft: true, req })) as unknown as Obj
      const current: PageDoc = toSlugRefs({ layout: (raw.layout ?? []) as PageDoc['layout'], meta: (raw.meta ?? {}) as Obj }, slugById)
      const snapshot = SNAPSHOT.pages[slug][locale]
      const pre: PageDoc = { layout: snapshot.layout, meta: snapshot.meta }
      const migrated = transformPage(slug, locale, pre, pre).doc
      let target: PageDoc
      if (direction === 'up') {
        const { doc, log } = transformPage(slug, locale, current, pre)
        if (log.conflicts.length) {
          report.skipped.push(`${where}: ${log.conflicts.join('; ')}`)
          continue
        }
        if (!log.applied.length) {
          report.unchanged.push(where)
          continue
        }
        target = doc
      } else {
        if (sameValue(current, pre)) {
          report.unchanged.push(where)
          continue
        }
        if (!sameValue(current, migrated)) {
          report.skipped.push(`${where}: edited after the migration, not reverting`)
          continue
        }
        // Only revert the exact state up left behind: the migrated copy as the
        // latest draft and the snapshot still as the published version. If the
        // migrated draft was published since, a down would put old copy live
        // again; that is a decision for a person, not a migration.
        const published = (await payload.findByID({ collection: 'pages', id, locale, fallbackLocale: false, depth: 0, draft: false, req })) as unknown as Obj
        const live: PageDoc = toSlugRefs({ layout: (published.layout ?? []) as PageDoc['layout'], meta: (published.meta ?? {}) as Obj }, slugById)
        if (!sameValue(live, pre)) {
          report.skipped.push(`${where}: published after the migration, not reverting (restore by hand from the version history)`)
          continue
        }
        target = { layout: pre.layout, meta: pre.meta }
      }
      // Down only runs while the snapshot is still the published version, so
      // both directions write a draft: no live page changes (PUBLISH_PAGES).
      const data = { ...fromSlugRefs(target, idBySlug), _status: 'draft' }
      writes.push({
        where: `${where} (draft)`,
        write: () => payload.update({ collection: 'pages', id, locale, depth: 0, draft: true, req, data: data as never }),
      })
    }
  }

  for (const slug of ['header', 'footer'] as const) {
    for (const locale of LOCALES) {
      const where = `${slug}.${locale}`
      const raw = (await payload.findGlobal({ slug, locale, fallbackLocale: false, depth: 0, req })) as unknown as Obj
      // Non-localized fields (footer address/phone) are handled in the default locale only.
      const keys = Object.keys(SNAPSHOT.globals[slug][locale]).filter((key) => locale === 'nl' || !SHARED_GLOBAL_FIELDS.includes(key))
      const pick = (source: Obj) => Object.fromEntries(keys.map((key) => [key, source[key] ?? null]))
      const pre = pick(SNAPSHOT.globals[slug][locale])
      const current = toSlugRefs(pick(raw), slugById)
      const run = (doc: Obj, base: Obj) => {
        const result =
          slug === 'header'
            ? transformHeader(locale, doc as unknown as HeaderDoc, base as unknown as HeaderDoc)
            : transformFooter(locale, doc as unknown as FooterDoc, base as unknown as FooterDoc)
        return { doc: pick(result.doc), log: result.log }
      }
      let target: Obj
      if (direction === 'up') {
        const { doc, log } = run(current, pre)
        if (log.conflicts.length) {
          report.skipped.push(`${where}: ${log.conflicts.join('; ')}`)
          continue
        }
        if (!log.applied.length) {
          report.unchanged.push(where)
          continue
        }
        target = doc
      } else {
        if (sameValue(current, pre)) {
          report.unchanged.push(where)
          continue
        }
        if (!sameValue(current, run(pre, pre).doc)) {
          report.skipped.push(`${where}: edited after the migration, not reverting`)
          continue
        }
        target = pre
      }
      const data = fromSlugRefs(target, idBySlug)
      writes.push({ where, write: () => payload.updateGlobal({ slug, locale, depth: 0, req, data }) })
    }
  }

  for (const { where, write } of writes) {
    await write()
    report.written.push(where)
    say(`wrote ${where}`)
  }
  for (const line of report.unchanged) say(`unchanged ${line}`)
  for (const line of report.skipped) payload.logger.warn(`[content-refactor ${direction}] SKIPPED ${line}`)
  return report
}
