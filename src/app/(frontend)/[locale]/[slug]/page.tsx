import config from '@payload-config'

import { createSlugRoute } from '@rinsly-com/site-core/app'
import { siteConfig } from '@/site.config'
import { extraRenderers } from '@/blockRenderers'
import { PreviewShell } from '@/components/PreviewShell'

// accp: any slug on demand. The static prod build (build-static.mjs) strips the
// `dynamic` line and flips `dynamicParams` to false, so only the published slugs
// (from generateStaticParams) are prerendered.
export const dynamic = 'force-dynamic'
export const dynamicParams = true

const route = createSlugRoute({ siteConfig, config, extraRenderers, PreviewShell })

export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata
export default route.Page
