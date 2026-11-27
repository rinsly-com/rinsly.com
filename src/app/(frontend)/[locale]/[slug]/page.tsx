import { notFound } from 'next/navigation'
import config from '@payload-config'

import { createSlugRoute } from '@rinsly-com/site-core/app'
import { JsonLd } from '@rinsly-com/site-core/components/frontend/JsonLd'
import { siteConfig } from '@/site.config'
import { extraRenderers } from '@/blockRenderers'
import { getPayload } from 'payload'

import { excludeHiddenCasesParams, isCasesPublicRouteHidden } from '@/lib/casesPagePublicRoute'
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

export const generateStaticParams = async () => {
  const params = await route.generateStaticParams()
  const payload = await getPayload({ config })
  return excludeHiddenCasesParams(params, payload)
}

export const generateMetadata = async (props: Parameters<typeof route.generateMetadata>[0]) => {
  const { slug } = await props.params
  const payload = await getPayload({ config })
  if (await isCasesPublicRouteHidden(slug, payload)) notFound()
  return route.generateMetadata(props)
}

/**
 * The engine page, plus the Woerden local page's Service JSON-LD (remote
 * service from Woerden, Utrecht province as the area served). Every other slug
 * renders exactly what the engine renders. /cases 404s until the public-page
 * flag is on (written client consent). A renamed cases document is
 * hidden the same way — slug-only checks would still render it.
 */
export default async function Page(props: Parameters<typeof route.Page>[0]) {
  const { locale, slug } = await props.params
  const payload = await getPayload({ config })
  if (await isCasesPublicRouteHidden(slug, payload)) notFound()
  const content = <route.Page {...props} />
  if (slug !== LOCAL_PAGE_SLUG || (locale !== 'nl' && locale !== 'en')) return content
  return (
    <>
      <JsonLd data={buildLocalPageJsonLd(siteConfig.url, locale)} />
      {content}
    </>
  )
}
