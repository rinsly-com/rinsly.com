import config from '@payload-config'

import { createHomeRoute } from '@rinsly-com/site-core/app'
import { siteConfig } from '@/site.config'
import { extraRenderers } from '@/blockRenderers'

export const dynamic = 'force-dynamic'

const home = createHomeRoute({ siteConfig, config, extraRenderers })

export const generateMetadata = home.generateMetadata
export default home.Page
