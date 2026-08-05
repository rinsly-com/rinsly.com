/**
 * site.config.ts — Rinsly's branding surface, passed into the shared engine
 * (@rinsly-com/site-core). SEO, URL, theme colour, logo and CORS all read here.
 * The visual palette lives in `src/app/(frontend)/globals.css` (keep `themeColor`
 * in sync with `--accent`).
 */
type Localized = { nl: string; en: string }

export const siteConfig = {
  name: 'Rinsly',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://rinsly.com').replace(/\/+$/, ''),
  themeColor: '#2c7ea8',
  logo: '/rinsly-logo.png',
  // Rinsly's only asset is the square mark, so the header renders the name as
  // text beside it (engine 0.7.4+). A brand whose logo already contains its name
  // leaves this off.
  wordmark: true,
  seo: {
    titleSuffix: ' · Rinsly',
    // Partner-first, per ~/Rinsly/Marketing/MESSAGING.md. The old defaults still
    // said "webontwikkeling & beheer" and sold to the end customer, which is the
    // positioning the company moved away from.
    defaultTitle: 'Rinsly · bouw & hosting voor ontwerpstudio’s',
    description: {
      nl: 'Rinsly bouwt en host websites voor ontwerpstudio’s. Jullie leveren het ontwerp in Figma, wij bouwen het als een echte applicatie en houden het draaiend.',
      en: 'Rinsly builds and hosts websites for design studios. You deliver the design in Figma, we build it as a real application and keep it running.',
    } as Localized,
  },
  // `url` (rinsly.com) is the public static site — allow it so the accp CMS
  // accepts API calls from it (e.g. the offerte form). accp.rinsly.com is the
  // CMS's own origin.
  extraOrigins: ['https://accp.rinsly.com'] as string[],
} as const

export type SiteConfig = typeof siteConfig
