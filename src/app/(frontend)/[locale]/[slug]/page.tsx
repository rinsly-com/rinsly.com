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

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const page = await getPageBySlug(slug, locale)
  if (!page) return {}
  return buildPageMetadata(page, { slug, locale })
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const page = await getPageBySlug(slug, locale)
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
