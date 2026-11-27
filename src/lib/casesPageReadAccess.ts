import type { Access, AccessArgs, Where } from 'payload'

import { CASES_PAGE_SLUG, isCasesPageEnabled } from './casesPageFlag'

/** Query constraint that hides the cases page from anonymous API readers. */
export function casesPageAnonymousConstraint(): Where {
  return { slug: { not_equals: CASES_PAGE_SLUG } }
}

/**
 * Collection-level read access for `pages`.
 *
 * Signed-in users (the admin panel) and a turned-on public flag see every page.
 * Otherwise anonymous REST and GraphQL reads are constrained so the cases doc
 * is not returned — by slug, by id, in a list, or with depth/locale variants.
 *
 * When `previous` is provided, its result is AND-ed so a tighter site-core rule
 * cannot be widened by this wrapper.
 */
export function casesPageReadAccess(previous?: Access): Access {
  return async (args: AccessArgs) => {
    const previousResult = previous ? await previous(args) : true
    if (previousResult === false) return false

    const allowCases = Boolean(args.req.user) || isCasesPageEnabled()
    if (allowCases) return previousResult

    const hide = casesPageAnonymousConstraint()
    if (previousResult === true) return hide
    return { and: [previousResult, hide] }
  }
}

type CollectionLike = {
  slug?: string
  access?: {
    read?: Access
    [key: string]: unknown
  }
}

type ConfigLike = {
  collections?: CollectionLike[]
}

/**
 * Replace the pages collection `access.read` with {@link casesPageReadAccess},
 * composing with whatever site-core already set. Throws if `pages` is missing
 * so a silent miss cannot reopen the public leak.
 */
export function applyCasesPageReadAccess<T extends ConfigLike>(config: T): T {
  const collections = config.collections
  if (!collections) {
    throw new Error('applyCasesPageReadAccess: config.collections is missing')
  }
  const pages = collections.find((collection) => collection.slug === 'pages')
  if (!pages) {
    throw new Error('applyCasesPageReadAccess: pages collection is missing')
  }
  pages.access = {
    ...pages.access,
    read: casesPageReadAccess(pages.access?.read),
  }
  return config
}
