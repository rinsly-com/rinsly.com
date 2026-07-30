import config from '@payload-config'

import { createOgImage } from '@rinsly-com/site-core/app'
import { siteConfig } from '@/site.config'

// force-dynamic on accp; build-static.mjs strips it for the static export.
export const dynamic = 'force-static'

const og = createOgImage({
  siteConfig,
  config,
  slug: 'home',
  eyebrow: { nl: 'Webontwikkeling & beheer', en: 'Web development & management' },
})

export const size = og.size
export const contentType = og.contentType
export const alt = og.alt
export const generateStaticParams = og.generateStaticParams
export default og.Image
