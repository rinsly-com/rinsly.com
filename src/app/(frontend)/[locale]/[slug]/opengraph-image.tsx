import { notFound } from 'next/navigation'
import config from '@payload-config'

import { createOgImage } from '@rinsly-com/site-core/app'
import { isCasesPageHidden } from '@/lib/casesPageFlag'
import { siteConfig } from '@/site.config'

// force-dynamic on accp; build-static.mjs strips it for the static export.
export const dynamic = 'force-dynamic'

// slug comes from the route params (catchAll: one image per published slug).
const og = createOgImage({
  siteConfig,
  config,
  catchAll: true,
  eyebrow: { nl: 'Webontwikkeling & beheer', en: 'Web development & management' },
})

export const size = og.size
export const contentType = og.contentType
export const alt = og.alt

export const generateStaticParams = async () => {
  const params = await og.generateStaticParams()
  return params.filter((entry) => !isCasesPageHidden(entry.slug))
}

export default async function Image(props: Parameters<typeof og.Image>[0]) {
  const { slug } = await props.params
  if (isCasesPageHidden(slug)) notFound()
  return og.Image(props)
}
