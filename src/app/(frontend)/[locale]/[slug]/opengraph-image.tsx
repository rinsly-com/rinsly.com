import config from '@payload-config'

import { createOgImage } from '@rinsly-com/site-core/app'
import { siteConfig } from '@/site.config'

// slug comes from the route params.
const og = createOgImage({
  siteConfig,
  config,
  eyebrow: { nl: 'Webontwikkeling & beheer', en: 'Web development & management' },
})

export const size = og.size
export const contentType = og.contentType
export const alt = og.alt
export const dynamic = og.dynamic
export default og.Image
