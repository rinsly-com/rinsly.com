import type { MetadataRoute } from 'next'

import { siteConfig } from '@/site.config'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.seo.defaultTitle,
    short_name: siteConfig.name,
    description: siteConfig.seo.description.nl,
    lang: 'nl',
    start_url: '/nl',
    display: 'standalone',
    background_color: '#f4f7f9',
    theme_color: siteConfig.themeColor,
    icons: [
      { src: '/icon.png', sizes: 'any', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
