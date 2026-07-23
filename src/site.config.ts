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
  seo: {
    titleSuffix: ' — Rinsly',
    defaultTitle: 'Rinsly — webontwikkeling & beheer',
    description: {
      nl: 'Rinsly — webontwikkeling & beheer. Onbezorgd online, up-to-date en veilig.',
      en: 'Rinsly — web development & management. Online without worries, up to date and secure.',
    } as Localized,
  },
  // `url` (rinsly.com) is the public static site — allow it so the accp CMS
  // accepts API calls from it (e.g. the offerte form). accp.rinsly.com is the
  // CMS's own origin.
  extraOrigins: ['https://accp.rinsly.com'] as string[],
} as const

export type SiteConfig = typeof siteConfig
