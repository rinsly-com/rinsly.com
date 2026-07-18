import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { JsonLd } from '@/components/frontend/JsonLd'
import { SiteAnimator } from '@/components/frontend/SiteAnimator'
import { SiteFooter } from '@/components/frontend/SiteFooter'
import { SiteHeader } from '@/components/frontend/SiteHeader'
import { getFooter, getHeader } from '@/lib/globals'
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALES,
  LOCALE_HTML_LANG,
  LOCALE_OG,
  type Locale,
} from '@/lib/locale'
import { SITE_NAME, SITE_URL } from '@/lib/siteUrl'
import { buildSiteJsonLd } from '@/lib/structuredData'

import '../globals.css'

const DEFAULT_TITLE: Record<Locale, string> = {
  nl: 'Rinsly — webontwikkeling & beheer',
  en: 'Rinsly — web development & management',
}
const DEFAULT_DESCRIPTION: Record<Locale, string> = {
  nl: 'Rinsly — webontwikkeling & beheer. Onbezorgd online, up-to-date en veilig.',
  en: 'Rinsly — web development & management. Online without worries, up to date and secure.',
}

export const viewport: Viewport = {
  themeColor: '#2C7EA8',
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE
  const description = DEFAULT_DESCRIPTION[loc]
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: DEFAULT_TITLE[loc], template: `%s — ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: LOCALE_OG[loc],
      title: DEFAULT_TITLE[loc],
      description,
    },
    twitter: { card: 'summary_large_image', title: DEFAULT_TITLE[loc], description },
    robots: { index: true, follow: true },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const [header, footer] = await Promise.all([getHeader(locale), getFooter(locale)])
  const siteJsonLd = buildSiteJsonLd(footer)

  return (
    <html lang={LOCALE_HTML_LANG[locale]} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/*
         * Enable the motion layer (SiteAnimator) synchronously, before first
         * paint, but ONLY when JS is on and the user allows motion. The `.anim`
         * class is what makes reveal targets start hidden, so no-JS and
         * reduced-motion users always see fully-rendered content.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('anim')}catch(e){}",
          }}
        />
      </head>
      <body className="font-sans">
        <JsonLd data={siteJsonLd} />
        <SiteAnimator />
        <SiteHeader header={header} locale={locale} />
        <main>{children}</main>
        <SiteFooter footer={footer} locale={locale} />
      </body>
    </html>
  )
}
