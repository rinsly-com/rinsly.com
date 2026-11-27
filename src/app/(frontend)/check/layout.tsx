import type { Metadata, Viewport } from 'next'
import config from '@payload-config'
import React from 'react'

import { createLocaleLayout } from '@rinsly-com/site-core/app'
import { JsonLd } from '@rinsly-com/site-core/components/frontend/JsonLd'
import { siteConfig } from '@/site.config'
import { buildProfessionalServiceJsonLd } from '@/lib/siteJsonLd'

import '../globals.css'

/**
 * Root layout for the /check funnel (self-service check, the fallback form and
 * the personal /check/<token> scorecards).
 *
 * Refactor plan 003 K-03: /check uses the normal site header and footer (the
 * engine's Dutch locale layout), not its own mini chrome. Dutch only: there is
 * no EN /check page. Every /check page stays noindex/nofollow (their own
 * metadata; robots.txt no longer disallows /check, so crawlers can see that).
 * Social tags (plan 002 B-08): the page's existing title and description, and
 * the colocated opengraph-image card.
 */

const siteLayout = createLocaleLayout({ siteConfig, config })

export const viewport: Viewport = siteLayout.viewport

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: 'Gratis websitecheck | Rinsly',
  description: 'Wij beoordelen uw website gratis op snelheid, vindbaarheid en veiligheid.',
  robots: { index: false, follow: false },
  twitter: { card: 'summary_large_image' },
}

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <siteLayout.Layout params={Promise.resolve({ locale: 'nl' })}>
      <JsonLd data={buildProfessionalServiceJsonLd(siteConfig.url, 'nl')} />
      {children}
    </siteLayout.Layout>
  )
}
