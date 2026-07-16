import { getPayload } from 'payload'
import config from '@payload-config'

import type { Page } from '@/payload-types'
import type { Locale } from './locale'

/**
 * Content access via Payload's Local API. Because the frontend runs on the same
 * Worker as Payload (single deployment), we query the database directly instead
 * of self-fetching over HTTP. `locale` is threaded through so each request
 * returns the right language (untranslated fields fall back per the config's
 * `fallback: true`).
 *
 * The public site renders the PUBLISHED version of each page (`draft: false`);
 * editors preview drafts in the admin panel.
 */
async function client() {
  return getPayload({ config })
}

/** The published page for a slug in the given locale, or null. */
export async function getPageBySlug(slug: string, locale: Locale): Promise<Page | null> {
  const payload = await client()
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale,
    draft: false,
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}

/** All published pages in the given locale (used by the sitemap). */
export async function getRenderablePages(locale: Locale): Promise<Page[]> {
  const payload = await client()
  const res = await payload.find({
    collection: 'pages',
    locale,
    draft: false,
    limit: 200,
    depth: 0,
  })
  return res.docs
}
