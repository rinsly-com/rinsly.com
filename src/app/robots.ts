import type { MetadataRoute } from 'next'

import { absoluteUrl, siteUrl } from '@rinsly-com/site-core/lib/siteUrl'
import { siteConfig } from '@/site.config'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    // /check pages (LeadLens scorecards + the fallback form) are noindex and
    // never in the sitemap (handoff §4) — the disallow is belt-and-braces.
    rules: { userAgent: '*', allow: '/', disallow: ['/check', '/check/'] },
    sitemap: absoluteUrl(siteConfig, '/sitemap.xml'),
    host: siteUrl(siteConfig),
  }
}
