import { metaImageUrl, OG_SIZE, renderOgImage } from '@/lib/og'
import { getPageBySlug } from '@/lib/pages'
import { DEFAULT_LOCALE, isLocale } from '@/lib/locale'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Rinsly'
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE
  const page = await getPageBySlug(slug, loc)
  return renderOgImage({
    title: page?.title || 'Rinsly',
    eyebrow: loc === 'nl' ? 'Webontwikkeling & beheer' : 'Web development & management',
    imageUrl: metaImageUrl(page),
  })
}
