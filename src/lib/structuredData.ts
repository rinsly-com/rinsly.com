import type { Footer, Page } from '@/payload-types'
import { absoluteUrl, SITE_NAME, SITE_URL } from './siteUrl'

const DEFAULT_DESCRIPTION = 'Rinsly — webontwikkeling & beheer.'

/** Resolve a populated Media relation to an absolute, crawler-reachable URL. */
function absoluteMediaUrl(media: unknown): string | undefined {
  if (!media || typeof media !== 'object') return undefined
  const url = (media as { url?: string | null }).url
  if (!url) return undefined
  return new URL(url, SITE_URL).toString()
}

/** Flatten a Lexical richText value to a single plain-text string. */
function lexicalToText(value: unknown): string {
  const root = (value as { root?: { children?: unknown[] } } | null | undefined)?.root
  if (!root?.children) return ''
  const parts: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { text?: unknown; children?: unknown }
    if (typeof n.text === 'string') parts.push(n.text)
    if (Array.isArray(n.children)) n.children.forEach(walk)
  }
  root.children.forEach(walk)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Site-wide Organization/WebSite graph. Becomes a LocalBusiness once a footer
 * address is set, carrying the footer's contact details.
 */
export function buildSiteJsonLd(footer: Footer | null): Record<string, unknown> {
  const logo = absoluteMediaUrl(footer?.logo) ?? absoluteUrl('/rinsly-logo.png')
  const org: Record<string, unknown> = {
    '@type': footer?.address ? 'LocalBusiness' : 'Organization',
    '@id': absoluteUrl('/#organization'),
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    logo,
    image: logo,
  }
  if (footer?.email) org.email = footer.email
  if (footer?.phone) org.telephone = footer.phone
  if (footer?.address) {
    org.address = {
      '@type': 'PostalAddress',
      streetAddress: footer.address,
      addressCountry: 'NL',
    }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      org,
      {
        '@type': 'WebSite',
        '@id': absoluteUrl('/#website'),
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { '@id': absoluteUrl('/#organization') },
      },
    ],
  }
}

type LayoutBlock = { blockType?: string; [key: string]: unknown }

/**
 * Per-page structured data derived from the block layout: `accordion`/`faq`
 * blocks → one FAQPage (Q/A rich results). Returns an array of top-level
 * JSON-LD objects (empty when nothing applies).
 */
export function buildPageJsonLd(page: Page): Record<string, unknown>[] {
  const layout = (page.layout ?? []) as LayoutBlock[]
  const out: Record<string, unknown>[] = []

  const faqItems = layout
    .filter((b) => b.blockType === 'faq' || b.blockType === 'accordion')
    .flatMap((b) => (Array.isArray(b.items) ? (b.items as LayoutBlock[]) : []))
    .map((item) => {
      const name = typeof item.title === 'string' ? item.title.trim() : ''
      const text = lexicalToText(item.body)
      return name && text ? { name, text } : null
    })
    .filter((x): x is { name: string; text: string } => x !== null)

  if (faqItems.length) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((q) => ({
        '@type': 'Question',
        name: q.name,
        acceptedAnswer: { '@type': 'Answer', text: q.text },
      })),
    })
  }

  return out
}
