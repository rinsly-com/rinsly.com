/**
 * DF1 seed lock. accp D1 is the source of truth for rinsly.com copy; this seed
 * only bootstraps. It writes a page's layout only when this run created that
 * page, and a global only when it was never saved. A page or global that
 * already has content is left alone, so a content-endpoint or editor edit is
 * not reverted by the next seed run. To change live copy, edit it in the CMS
 * or through the content endpoint, not here.
 */

/** Pages pass 2 writes: only the rows pass 1 created in this run. */
export function pagesToWrite<T extends { slug: string }>(pages: readonly T[], created: ReadonlySet<string>): T[] {
  return pages.filter((page) => created.has(page.slug))
}

/** Null, undefined, whitespace, an empty list, or an object whose values are all blank (ids ignored). */
export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).every(([key, inner]) => key === 'id' || isBlank(inner))
  }
  return false
}

const GLOBAL_CONTENT = {
  header: ['navItems', 'cta'],
  footer: ['tagline', 'menuItems', 'infoLinks', 'copyright'],
} as const

/** True when none of the global's copy fields hold anything, i.e. it was never seeded or saved. */
export function globalIsUnseeded(slug: keyof typeof GLOBAL_CONTENT, doc: Record<string, unknown> | null | undefined): boolean {
  if (!doc) return true
  return GLOBAL_CONTENT[slug].every((field) => isBlank(doc[field]))
}
