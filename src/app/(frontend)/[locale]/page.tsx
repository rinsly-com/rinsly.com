import config from '@payload-config'

import { createHomeRoute } from '@rinsly-com/site-core/app'
import { siteConfig } from '@/site.config'
import { extraRenderers } from '@/blockRenderers'

// force-dynamic on the accp worker (render live). The static prod build
// (scripts/build-static.mjs) strips this line so `/[locale]` prerenders from
// the layout's locale params.
export const dynamic = 'force-dynamic'

const home = createHomeRoute({
  siteConfig,
  config,
  extraRenderers,
  // A loader, not an import. The shell is a client module reaching this site's
  // block renderers and, through them, the whole icon barrel; importing it here
  // would ship all of that to every public visitor.
  loadPreviewShell: () => import('@/components/PreviewShell'),
})

export const generateMetadata = home.generateMetadata
export default home.Page
