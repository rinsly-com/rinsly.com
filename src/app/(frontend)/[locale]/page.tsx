import config from '@payload-config'

import { createHomeRoute } from '@rinsly-com/site-core/app'
import { siteConfig } from '@/site.config'
import { extraRenderers } from '@/blockRenderers'

// force-dynamic on the accp worker (render live). The static prod build
// (scripts/build-static.mjs) strips this line so `/[locale]` prerenders from
// the layout's locale params.
export const dynamic = 'force-static'

const home = createHomeRoute({ siteConfig, config, extraRenderers })

export const generateMetadata = home.generateMetadata
export default home.Page
