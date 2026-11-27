import type { Locale } from '@rinsly-com/site-core'
import { hrefFor, type LinkFields } from '@rinsly-com/site-core/ui'

/**
 * Buttons for the product-led blocks. Same destinations as site-core's
 * CMSLink (hrefFor), three looks in the live Rinsly style:
 *  - `primary`: accent-filled pill (one per hero)
 *  - `outline`: hair-bordered pill (secondary plan / door buttons)
 *  - `text`:    accent text link with an underline (the hero's second path)
 * Every look is at least 32px tall (WCAG 2.5.8, UX falsification 27 Nov).
 */
export type LinkLook = 'primary' | 'outline' | 'text'

/**
 * The app's generated link shape. Its `page` is the app's Page type (more
 * block types than the engine's), which is why this is not LinkFields; the
 * fields hrefFor reads (type, url, anchor, page.slug) are identical.
 */
export type ProductLinkFields = Omit<LinkFields, 'page'> & { page?: number | { slug?: string | null } | null }

const LOOKS: Record<LinkLook, string> = {
  primary:
    'inline-flex min-h-11 items-center justify-center rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90',
  outline:
    'inline-flex min-h-11 items-center justify-center rounded-pill border border-hair bg-card px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent',
  text: 'inline-flex min-h-8 items-center text-sm font-semibold text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent',
}

export function ProductLink({
  link,
  locale,
  look,
  className,
}: {
  link?: ProductLinkFields | null
  locale: Locale
  look: LinkLook
  className?: string
}) {
  if (!link?.label) return null
  const external = link.type === 'external'
  return (
    <a
      href={hrefFor(link as LinkFields, locale)}
      className={[LOOKS[look], className].filter(Boolean).join(' ')}
      {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : external ? { rel: 'noopener' } : {})}
    >
      {link.label}
    </a>
  )
}
