import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@rinsly-com/site-core/lib/siteUrl'
import { siteConfig } from '@/site.config'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    // No `Disallow: /check` (plan 003 K-03): a disallow stops crawlers from
    // reading the page, so they never see its noindex. /check pages stay
    // noindex (their metadata) and out of the sitemap. No `Host:` either; it
    // is not a standard directive.
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl(siteConfig, '/sitemap.xml'),
  }
}
