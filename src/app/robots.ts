import type { MetadataRoute } from 'next'

import { absoluteUrl, siteUrl } from '@rinsly-com/site-core/lib/siteUrl'
import { siteConfig } from '@/site.config'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl(siteConfig, '/sitemap.xml'),
    host: siteUrl(siteConfig),
  }
}
