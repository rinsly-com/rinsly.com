import type { Page } from '@/payload-types'
import { localePath, type Locale } from '@/lib/locale'

import { Button } from './Button'

/**
 * The shape produced by the shared `link` / `linkGroup` fields (src/fields/link.ts).
 * `page` is a populated Page when fetched with depth >= 1, or a bare id at depth 0.
 */
export type LinkFields = {
  label?: string | null
  variant?: 'primary' | 'secondary' | null
  type?: 'internal' | 'external' | null
  page?: (number | Page) | null
  url?: string | null
  anchor?: string | null
  newTab?: boolean | null
}

/** Normalize a CMS section target to a leading-`#` hash, or '' when empty. */
function hashFor(anchor?: string | null): string {
  const id = anchor?.trim().replace(/^#+/, '')
  return id ? `#${id}` : ''
}

/**
 * Resolve a CMS link to an href: an external URL, or an internal page under the
 * active locale (`/[locale]/slug`), optionally scrolled to a section
 * (`/[locale]/slug#anchor`).
 */
export function hrefFor(link: LinkFields | null | undefined, locale: Locale): string {
  if (!link) return '#'
  if (link.type === 'external') return link.url || '#'
  const hash = hashFor(link.anchor)
  const page = link.page
  if (page && typeof page === 'object' && page.slug) {
    return localePath(locale, page.slug, hash)
  }
  // No page chosen: an on-page anchor, else the locale home.
  return hash ? localePath(locale, 'home', hash) : localePath(locale, 'home')
}

/** Render a single CMS-configured link as a brand button. */
export function CMSLink({
  link,
  locale,
  className,
}: {
  link?: LinkFields | null
  locale: Locale
  className?: string
}) {
  if (!link?.label) return null
  return (
    <Button
      label={link.label}
      href={hrefFor(link, locale)}
      variant={link.variant ?? 'primary'}
      newTab={link.newTab ?? false}
      className={className}
    />
  )
}

/** Render a block's 0…N buttons (the `buttons` linkGroup array) as a row. */
export function Buttons({
  buttons,
  locale,
  className,
}: {
  buttons?: (LinkFields & { id?: string | null })[] | null
  locale: Locale
  className?: string
}) {
  if (!buttons?.length) return null
  return (
    <div className={className ?? 'flex flex-wrap items-center gap-5'}>
      {buttons.map((button, index) => (
        <CMSLink key={button.id ?? index} link={button} locale={locale} />
      ))}
    </div>
  )
}
