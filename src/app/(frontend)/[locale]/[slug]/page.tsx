import config from '@payload-config'

import { createSlugRoute } from '@rinsly-com/site-core/app'
import { siteConfig } from '@/site.config'
import { extraRenderers } from '@/blockRenderers'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

const route = createSlugRoute({ siteConfig, config, extraRenderers })

export const generateMetadata = route.generateMetadata
export default route.Page
