import config from '@payload-config'
import React from 'react'

import { createLocaleLayout } from '@rinsly-com/site-core/app'
import { JsonLd } from '@rinsly-com/site-core/components/frontend/JsonLd'
import { siteConfig } from '@/site.config'
import { buildProfessionalServiceJsonLd } from '@/lib/siteJsonLd'

import '../globals.css'

const layout = createLocaleLayout({ siteConfig, config })

export const viewport = layout.viewport
export const generateStaticParams = layout.generateStaticParams
export const generateMetadata = layout.generateMetadata

/**
 * The engine layout, plus Rinsly's ProfessionalService JSON-LD (plan 003
 * T-01) at the top of <main> on every locale page.
 */
export default async function LocaleLayout(props: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await props.params
  const jsonLdLocale = locale === 'en' ? 'en' : 'nl'
  return (
    <layout.Layout params={props.params}>
      <JsonLd data={buildProfessionalServiceJsonLd(siteConfig.url, jsonLdLocale)} />
      {props.children}
    </layout.Layout>
  )
}
