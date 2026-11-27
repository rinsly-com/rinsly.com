import type { Where } from 'payload'

import { CASES_PAGE_SLUG, isCasesPageEnabled, isCasesPageHidden } from './casesPageFlag'
import { HIDDEN_CASES_SCAN_OPTIONS, isHiddenCasesDocument } from './casesPageReadAccess'

type PageDoc = { id?: string | number; slug?: string | null; layout?: unknown }

type PayloadPages = {
  find: (args: {
    collection: 'pages'
    where?: Where
    limit?: number
    depth?: number
    locale?: 'all' | 'nl' | 'en'
    pagination?: boolean
    overrideAccess?: boolean
    draft?: boolean
  }) => Promise<{ docs: PageDoc[] }>
}

type PayloadLoader = () => Promise<PayloadPages | null>

/**
 * The static export (build-static.mjs) renders from a content snapshot that
 * was fetched from the accp CMS API as an anonymous reader, so a hidden
 * cases document is already absent from it. There is no D1 at that point
 * (a clean checkout has no tables), so the build must never query the DB.
 */
function isSnapshotBuild(): boolean {
  return process.env.CONTENT_SNAPSHOT != null
}

/**
 * Whether an anonymous request for this slug must 404 on the public page
 * and OG image routes. Local API reads in site-core omit `overrideAccess:
 * false`, so collection access does not apply there — the route has to
 * hide a renamed cases document itself (by slug or seeded anchors).
 *
 * Fails closed at runtime: a missing payload instance is treated as hidden
 * and a failing lookup throws (the route errors instead of rendering).
 * Only the snapshot build skips the lookup, see {@link isSnapshotBuild}.
 */
export async function isCasesPublicRouteHidden(
  slug: string,
  loadPayload: PayloadLoader,
): Promise<boolean> {
  if (isCasesPageEnabled()) return false
  if (isCasesPageHidden(slug)) return true
  if (isSnapshotBuild()) return false

  const payload = await loadPayload()
  if (!payload) return true

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale: 'all',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    draft: false,
  })
  return isHiddenCasesDocument(docs[0] ?? null)
}

/**
 * Drop hidden cases slugs (the seeded slug and any renamed document that
 * still carries the cases block anchors) from generateStaticParams.
 *
 * Build-time only, so it must never depend on the DB: the snapshot build
 * and any scan failure (for example a clean checkout with an empty local
 * D1: "no such table: pages") fall back to the slug-only exclude, which
 * still drops `cases`. The runtime route and OG checks stay fail-closed.
 */
export async function excludeHiddenCasesParams<T extends { slug?: string }>(
  params: T[],
  loadPayload: PayloadLoader,
): Promise<T[]> {
  if (isCasesPageEnabled() || params.length === 0) return params
  const hiddenSlugs = new Set<string>([CASES_PAGE_SLUG])
  if (!isSnapshotBuild()) {
    try {
      const payload = await loadPayload()
      if (payload) {
        const { docs } = await payload.find(HIDDEN_CASES_SCAN_OPTIONS)
        for (const doc of docs) {
          if (isHiddenCasesDocument(doc) && typeof doc.slug === 'string' && doc.slug) {
            hiddenSlugs.add(doc.slug)
          }
        }
      }
    } catch {
      // Slug-only fallback: keep the build independent of the DB.
    }
  }
  return params.filter((entry) => !entry.slug || !hiddenSlugs.has(entry.slug))
}
