import config from '@payload-config'

import { createSlugRoute } from '@rinsly-com/site-core/app'
import { JsonLd } from '@rinsly-com/site-core/components/frontend/JsonLd'
import { siteConfig } from '@/site.config'
import { extraRenderers } from '@/blockRenderers'
import { LOCAL_PAGE_SLUG, buildLocalPageJsonLd } from '@/lib/localPageJsonLd'

// accp: any slug on demand. The static prod build (build-static.mjs) strips the
// `dynamic` line and flips `dynamicParams` to false, so only the published slugs
// (from generateStaticParams) are prerendered.
export const dynamic = 'force-dynamic'
export const dynamicParams = true

const route = createSlugRoute({
  siteConfig,
  config,
  extraRenderers,
  // A loader, not an import — see the home route.
  loadPreviewShell: () => import('@/components/PreviewShell'),
})

export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata

/**
 * The engine page, plus the Woerden local page's Service JSON-LD (remote
 * service from Woerden, Utrecht province as the area served). Every other slug
 * renders exactly what the engine renders.
 */
export default async function Page(props: Parameters<typeof route.Page>[0]) {
  const { locale, slug } = await props.params
  const content = <route.Page {...props} />
  if (slug !== LOCAL_PAGE_SLUG || (locale !== 'nl' && locale !== 'en')) return content
  return (
    <>
      <JsonLd data={buildLocalPageJsonLd(siteConfig.url, locale)} />
      {content}
    </>
  )
}
