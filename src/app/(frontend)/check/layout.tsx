import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import React from 'react'

import { siteConfig } from '@/site.config'

import '../globals.css'

/**
 * Root layout for the /check funnel (LeadLens scorecard + fallback form).
 *
 * Deliberately minimal, conversion-focused chrome: no CMS header/footer nav to
 * wander off into — just the brand and one goal (book an intro call). Dutch
 * only: LeadLens targets Dutch local businesses. All /check pages are
 * noindex/nofollow (handoff §4) — they carry per-lead content behind
 * unguessable tokens and must never end up in a search index.
 */

export const viewport: Viewport = { themeColor: siteConfig.themeColor }

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: 'Gratis websitecheck — Rinsly',
  description: 'Wij beoordelen uw website gratis op snelheid, vindbaarheid en veiligheid.',
  robots: { index: false, follow: false },
}

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* No `.anim` head script here, deliberately: the engine's SiteAnimator
          (which reveals [data-reveal] targets) isn't publicly exported, and on
          a conversion page nothing may ever sit at opacity 0 waiting for GSAP.
          Without the .anim class the data-reveal/data-hero attributes are inert
          and everything renders fully visible, always. */}
      <body className="font-sans">
        <header className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between px-5 py-5 sm:px-8">
            <Link href="/nl" className="flex items-center gap-2.5" aria-label="Rinsly">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static brand asset */}
              <img src={siteConfig.logo} alt="" className="h-8 w-auto rounded-lg" />
              <span className="text-lg font-extrabold tracking-[-0.02em] text-ink">Rinsly</span>
            </Link>
            <span className="hidden text-sm text-muted sm:block">Gratis websitecheck</span>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-hair">
          <div className="mx-auto flex w-full max-w-[1080px] flex-col items-start justify-between gap-2 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:px-8">
            <p>© {new Date().getFullYear()} Rinsly — webontwikkeling & beheer</p>
            <p>
              <Link href="/nl" className="text-accent hover:underline">
                rinsly.com
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
