/**
 * Page relations are numeric ids in D1, and those differ between accp and a
 * local or fresh database. The snapshot and the transforms write them as
 * `@slug`; these helpers translate in both directions on every `page` key.
 */
type Any = unknown

export function toSlugRefs<T>(value: T, slugById: Map<number, string>): T {
  return walk(value, (page) => {
    const id = typeof page === 'object' && page !== null ? (page as { id?: number }).id : page
    const slug = typeof id === 'number' ? slugById.get(id) : undefined
    return slug ? `@${slug}` : page
  }) as T
}

export function fromSlugRefs<T>(value: T, idBySlug: Map<string, number>): T {
  return walk(value, (page) => {
    if (typeof page !== 'string' || !page.startsWith('@')) return page
    const id = idBySlug.get(page.slice(1))
    if (id === undefined) throw new Error(`no page with slug ${page.slice(1)}`)
    return id
  }) as T
}

function walk(value: Any, mapPage: (page: Any) => Any): Any {
  if (Array.isArray(value)) return value.map((item) => walk(item, mapPage))
  if (value && typeof value === 'object') {
    const out: Record<string, Any> = {}
    for (const [key, item] of Object.entries(value)) out[key] = key === 'page' ? mapPage(item) : walk(item, mapPage)
    return out
  }
  return value
}
