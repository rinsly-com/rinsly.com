import type { MetadataRoute } from 'next'

import { SITE_NAME } from '@/lib/siteUrl'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rinsly — webontwikkeling & beheer',
    short_name: SITE_NAME,
    description: 'Rinsly — webontwikkeling & beheer.',
    lang: 'nl',
    start_url: '/nl',
    display: 'standalone',
    background_color: '#f4f7f9',
    theme_color: '#2c7ea8',
    icons: [
      { src: '/icon.png', sizes: 'any', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
