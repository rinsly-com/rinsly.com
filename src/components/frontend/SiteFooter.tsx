import Link from 'next/link'

import { Icon } from '@/components/frontend/ui/Icon'
import { Media } from '@/components/frontend/ui/Media'
import type { Locale } from '@/lib/locale'
import type { Footer } from '@/payload-types'

type Props = {
  footer: Footer | null
  locale: Locale
}

type LinkItem = { label?: string | null; url?: string | null; id?: string | null }

function FooterLink({ item }: { item: LinkItem }) {
  const label = item.label ?? ''
  if (!label) return null
  if (item.url) {
    return (
      <Link href={item.url} className="text-sm text-muted transition-colors hover:text-accent">
        {label}
      </Link>
    )
  }
  return <span className="text-sm text-muted">{label}</span>
}

function ColumnHeading({ children }: { children: string }) {
  return <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{children}</h3>
}

/**
 * Site footer: a light panel separated from the page by a hairline, so the dark
 * Rinsly logo tile reads cleanly. Contact is email-only.
 */
export function SiteFooter({ footer, locale }: Props) {
  const menuItems = footer?.menuItems ?? []
  const infoLinks = footer?.infoLinks ?? []
  const email = footer?.email
  const copyright =
    footer?.copyright ??
    `© Rinsly 2026 — ${locale === 'nl' ? 'Alle rechten voorbehouden.' : 'All rights reserved.'}`

  return (
    <footer className="mt-16 border-t border-hair bg-card">
      <div className="mx-auto w-full max-w-[1080px] px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex max-w-xs flex-col gap-4">
            <Media
              resource={footer?.logo}
              fallbackSrc="/rinsly-logo.png"
              alt="Rinsly"
              fit="contain"
              className="size-11 rounded-lg"
            />
            {footer?.tagline && <p className="text-sm leading-relaxed text-muted">{footer.tagline}</p>}
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:items-start sm:gap-x-16 sm:gap-y-8">
            {email && (
              <div className="flex flex-col gap-3">
                <ColumnHeading>Contact</ColumnHeading>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-sm text-ink transition-colors hover:text-accent"
                >
                  <Icon fallback="IconMail" size={18} stroke={1.5} className="shrink-0" />
                  {email}
                </a>
              </div>
            )}

            {menuItems.length > 0 && (
              <div className="flex flex-col gap-3 sm:row-span-2">
                <ColumnHeading>Menu</ColumnHeading>
                <ul className="flex flex-col gap-2.5">
                  {menuItems.map((item, i) => (
                    <li key={item.id ?? i}>
                      <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(infoLinks.length > 0 || footer?.kvk || footer?.btw) && (
              <div className="flex flex-col gap-3">
                <ColumnHeading>{locale === 'nl' ? 'Bedrijf' : 'Company'}</ColumnHeading>
                <ul className="flex flex-col gap-2.5">
                  {footer?.kvk && <li className="text-sm text-muted">KvK: {footer.kvk}</li>}
                  {footer?.btw && <li className="text-sm text-muted">BTW: {footer.btw}</li>}
                  {infoLinks.map((item, i) => (
                    <li key={item.id ?? i}>
                      <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-hair pt-6 text-xs text-muted">{copyright}</div>
      </div>
    </footer>
  )
}

export default SiteFooter
