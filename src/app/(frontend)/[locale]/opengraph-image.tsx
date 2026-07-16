import { metaImageUrl, OG_SIZE, renderOgImage } from '@/lib/og'
import { getPageBySlug } from '@/lib/pages'
import { DEFAULT_LOCALE, isLocale } from '@/lib/locale'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'Rinsly'
export const dynamic = 'force-dynamic'

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE
  const page = await getPageBySlug('home', loc)
  return renderOgImage({
    title: page?.title || 'Rinsly',
    eyebrow: loc === 'nl' ? 'Webontwikkeling & hosting' : 'Web development & hosting',
    imageUrl: metaImageUrl(page),
  })
}
