'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ArrowIcon } from '@/components/frontend/ui/ArrowIcon'
import { hrefFor, type LinkFields } from '@/components/frontend/ui/CMSLink'
import { Media } from '@/components/frontend/ui/Media'
import { LOCALES, LOCALE_LABEL, localePath, type Locale } from '@/lib/locale'
import type { Header } from '@/payload-types'

type SiteHeaderProps = {
  header?: Pick<Header, 'navItems' | 'cta' | 'logo'> | null
  locale: Locale
}

type NavItem = { key: string; label: string; href: string; newTab: boolean }

function toNavItem(link: LinkFields, key: string, locale: Locale): NavItem | null {
  if (!link.label) return null
  return { key, label: link.label, href: hrefFor(link, locale), newTab: link.newTab ?? false }
}

/**
 * Sticky top bar: Rinsly mark left, CMS-managed nav, a language switcher and an
 * accent CTA. Client component for the mobile toggle + the locale-swap switcher.
 */
export function SiteHeader({ header, locale }: SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      const inBar = barRef.current?.contains(target)
      const inMenu = menuRef.current?.contains(target)
      if (!inBar && !inMenu) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const navItems = (header?.navItems ?? [])
    .map((item, i) => toNavItem(item, item.id ?? String(i), locale))
    .filter((item): item is NavItem => item !== null)

  const cta = header?.cta ? toNavItem(header.cta, 'cta', locale) : null

  const linkTarget = (item: NavItem) =>
    item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  // Swap only the locale segment, keeping the rest of the path (slugs are shared
  // across locales). "/nl/diensten" → "/en/diensten".
  const switchLocaleHref = (target: Locale): string => {
    if (!pathname) return localePath(target, 'home')
    const rest = pathname.replace(/^\/(nl|en)(?=\/|$)/, '')
    return `/${target}${rest || ''}`
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const hashIndex = href.indexOf('#')
    if (hashIndex === -1) return
    const pathPart = href.slice(0, hashIndex)
    const id = href.slice(hashIndex + 1)
    if (!id) return
    if (pathPart && pathPart !== window.location.pathname) return
    const target = document.getElementById(decodeURIComponent(id))
    if (!target) return
    e.preventDefault()
    setOpen(false)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' })
    window.history.pushState(null, '', `#${id}`)
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-hair/70 bg-paper/85 backdrop-blur-md">
      <div ref={barRef} className="mx-auto w-full max-w-[1080px] px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href={localePath(locale, 'home')} aria-label="Rinsly home" className="shrink-0">
            <Media
              resource={header?.logo}
              fallbackSrc="/rinsly-logo.png"
              alt="Rinsly"
              fit="contain"
              className="size-9 rounded-lg"
            />
          </Link>

          <nav aria-label="Hoofdmenu" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                {...linkTarget(item)}
                onClick={(e) => handleNavClick(e, item.href)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-6 md:flex">
            <LocaleSwitcher current={locale} hrefFor={switchLocaleHref} />
            {cta && (
              <Link
                href={cta.href}
                {...linkTarget(cta)}
                onClick={(e) => handleNavClick(e, cta.href)}
                className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {cta.label}
                <ArrowIcon />
              </Link>
            )}
          </div>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg text-ink transition-colors hover:text-accent md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Menu sluiten' : 'Menu openen'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
                <path d="M1 1H21M1 8H21M1 15H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>

    {open && (
      <nav
        ref={menuRef}
        id="mobile-menu"
        aria-label="Hoofdmenu mobiel"
        className="fixed inset-x-0 top-16 z-30 flex flex-col gap-1 border-b border-hair/70 bg-paper/80 px-5 pb-4 pt-4 backdrop-blur-md sm:px-8 md:hidden"
      >
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            {...linkTarget(item)}
            onClick={(e) => {
              setOpen(false)
              handleNavClick(e, item.href)
            }}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:text-accent"
          >
            {item.label}
          </Link>
        ))}
        {cta && (
          <Link
            href={cta.href}
            {...linkTarget(cta)}
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center gap-2 self-start rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            {cta.label}
            <ArrowIcon />
          </Link>
        )}
        <div className="mt-3 border-t border-hair pt-3">
          <LocaleSwitcher current={locale} hrefFor={switchLocaleHref} />
        </div>
      </nav>
    )}
    </>
  )
}

function LocaleSwitcher({
  current,
  hrefFor,
}: {
  current: Locale
  hrefFor: (l: Locale) => string
}) {
  return (
    <div className="inline-flex items-center gap-1 text-xs font-semibold" aria-label="Taal">
      {LOCALES.map((l, i) => (
        <span key={l} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-hair">·</span>}
          {l === current ? (
            <span className="text-accent">{LOCALE_LABEL[l]}</span>
          ) : (
            <Link href={hrefFor(l)} className="text-muted transition-colors hover:text-accent">
              {LOCALE_LABEL[l]}
            </Link>
          )}
        </span>
      ))}
    </div>
  )
}

export default SiteHeader
