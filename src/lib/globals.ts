import { getPayload } from 'payload'
import config from '@payload-config'

import type { Footer, Header } from '@/payload-types'
import type { Locale } from './locale'

/** Fetch a global via the Local API in the given locale. */
async function getGlobal<T>(slug: 'header' | 'footer', locale: Locale): Promise<T | null> {
  const payload = await getPayload({ config })
  const doc = await payload.findGlobal({ slug, locale, depth: 2 })
  return (doc as T) ?? null
}

export async function getHeader(locale: Locale): Promise<Header | null> {
  return getGlobal<Header>('header', locale)
}

export async function getFooter(locale: Locale): Promise<Footer | null> {
  return getGlobal<Footer>('footer', locale)
}
