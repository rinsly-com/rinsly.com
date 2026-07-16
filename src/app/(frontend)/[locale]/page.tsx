import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { JsonLd } from '@/components/frontend/JsonLd'
import { PageView } from '@/components/frontend/PageView'
import { RenderBlocks } from '@/components/frontend/RenderBlocks'
import { buildPageMetadata } from '@/lib/metadata'
import { getPageBySlug } from '@/lib/pages'
import { buildPageJsonLd } from '@/lib/structuredData'
import { isLocale } from '@/lib/locale'

// Rendered on demand on the Worker so content is always live.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const page = await getPageBySlug('home', locale)
  if (!page) return {}
  return buildPageMetadata(page, { slug: 'home', locale, homepage: true })
}

/** Home route for a locale: renders the 'home' page's block layout. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const page = await getPageBySlug('home', locale)
  if (!page) notFound()

  const jsonLd = buildPageJsonLd(page)

  if (page.layout?.length) {
    return (
      <>
        {jsonLd.length > 0 && <JsonLd data={jsonLd} />}
        <RenderBlocks layout={page.layout} locale={locale} />
      </>
    )
  }

  return <PageView page={page} />
}
