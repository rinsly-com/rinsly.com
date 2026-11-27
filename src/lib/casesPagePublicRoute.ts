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

/**
 * Whether an anonymous request for this slug must 404 on the public page
 * and OG image routes. Local API reads in site-core omit `overrideAccess:
 * false`, so collection access does not apply there — the route has to
 * hide a renamed cases document itself (by slug or seeded anchors).
 */
export async function isCasesPublicRouteHidden(
  slug: string,
  payload: PayloadPages | null,
): Promise<boolean> {
  if (isCasesPageEnabled()) return false
  if (isCasesPageHidden(slug)) return true
  if (!payload) return false

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
 */
export async function excludeHiddenCasesParams<T extends { slug?: string }>(
  params: T[],
  payload: PayloadPages | null,
): Promise<T[]> {
  if (isCasesPageEnabled()) return params
  const hiddenSlugs = new Set<string>([CASES_PAGE_SLUG])
  if (payload) {
    const { docs } = await payload.find(HIDDEN_CASES_SCAN_OPTIONS)
    for (const doc of docs) {
      if (isHiddenCasesDocument(doc) && typeof doc.slug === 'string' && doc.slug) {
        hiddenSlugs.add(doc.slug)
      }
    }
  }
  return params.filter((entry) => !entry.slug || !hiddenSlugs.has(entry.slug))
}
