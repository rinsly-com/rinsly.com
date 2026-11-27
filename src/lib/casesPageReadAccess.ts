import type { Access, AccessArgs, Where } from 'payload'
import { NotFound } from 'payload'
import { hasRole, isAdmin } from '@rinsly-com/site-core/access'

import { CASES_PAGE_SLUG, isCasesPageEnabled } from './casesPageFlag'

/**
 * Seeded block anchors that only the cases page uses (scripts/seed.ts).
 * They survive a slug rename, unlike CASES_PAGE_SLUG. A dedicated
 * `hideFromPublic` field would be stronger, but needs a migration and
 * Yaron's OK; these existing anchors are the stable marker we have.
 */
export const CASES_PAGE_BLOCK_ANCHORS = ['burojazz', 'up2brand'] as const

type RoleUser = Parameters<typeof isAdmin>[0]

export function documentHasCasesBlockAnchor(doc: { layout?: unknown } | null | undefined): boolean {
  const layout = doc?.layout
  if (!Array.isArray(layout)) return false
  return layout.some((block) => {
    if (!block || typeof block !== 'object') return false
    const anchor = (block as { anchor?: unknown }).anchor
    return (
      typeof anchor === 'string' && (CASES_PAGE_BLOCK_ANCHORS as readonly string[]).includes(anchor)
    )
  })
}

/** True when this document is the cases page, even if its slug was renamed. */
export function isHiddenCasesDocument(
  doc: { slug?: string | null; layout?: unknown } | null | undefined,
): boolean {
  return doc?.slug === CASES_PAGE_SLUG || documentHasCasesBlockAnchor(doc)
}

/**
 * Query constraint that hides the cases page from anonymous API readers.
 *
 * The slug clause covers the current URL and any other row moved onto
 * `/cases`. The id clause covers the known cases row after a slug rename.
 * Together they AND: a renamed cases doc is excluded by id, and a new row
 * given the slug `cases` is excluded by slug.
 */
export function casesPageAnonymousConstraint(hiddenIds: Array<string | number> = []): Where {
  const hideSlug: Where = { slug: { not_equals: CASES_PAGE_SLUG } }
  if (hiddenIds.length === 0) return hideSlug
  return {
    and: [hideSlug, { id: { not_in: hiddenIds } }],
  }
}

/**
 * CMS staff who may see the hidden cases doc in the admin: a user from the
 * `users` auth collection with the admin or editor role (site-core's default
 * role set; rinsly.com does not enable the editorial workflow).
 */
export function isCmsStaffUser(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false
  if ((user as { collection?: unknown }).collection !== 'users') return false
  const staff = user as RoleUser
  return isAdmin(staff) || hasRole(staff, 'editor')
}

export type ResolveHiddenCasesIds = (
  args: AccessArgs,
) => Promise<Array<string | number>> | Array<string | number>

function hiddenIdsFrom(
  docs: Array<{ id: string | number; slug?: string | null; layout?: unknown }>,
): Array<string | number> {
  return docs.map((doc) => doc.id)
}

type PayloadFinder = {
  find: (args: {
    collection: 'pages'
    where?: Where
    limit?: number
    depth?: number
    overrideAccess?: boolean
  }) => Promise<{ docs: Array<{ id: string | number; slug?: string | null; layout?: unknown }> }>
}

function payloadFinder(req: AccessArgs['req']): PayloadFinder | null {
  const payload: unknown = req.payload
  if (!payload || typeof payload !== 'object') return null
  const find = (payload as { find?: unknown }).find
  if (typeof find !== 'function') return null
  return payload as PayloadFinder
}

async function defaultResolveHiddenIds(args: AccessArgs): Promise<Array<string | number>> {
  const payload = payloadFinder(args.req)
  if (!payload) return []

  // `layout.anchor` is not queryable as a where path on this Payload/D1
  // adapter (it returns an empty set). Scan the small pages collection
  // instead and keep ids whose slug or seeded anchors mark them as cases.
  const { docs } = await payload.find({
    collection: 'pages',
    limit: 200,
    depth: 1,
    overrideAccess: true,
  })
  return hiddenIdsFrom(docs.filter((doc) => isHiddenCasesDocument(doc)))
}

/**
 * Collection-level read access for `pages`.
 *
 * CMS staff (users collection, admin or editor) and a turned-on public flag
 * see every page. Otherwise anonymous REST and GraphQL reads are constrained
 * so the cases doc is not returned — by slug, by id, in a list, or with
 * depth/locale variants, including after a slug rename.
 *
 * When `previous` is provided, its result is AND-ed so a tighter site-core rule
 * cannot be widened by this wrapper.
 */
export function casesPageReadAccess(
  previous?: Access,
  options?: { resolveHiddenIds?: ResolveHiddenCasesIds },
): Access {
  const resolveHiddenIds = options?.resolveHiddenIds ?? defaultResolveHiddenIds
  return async (args: AccessArgs) => {
    const previousResult = previous ? await previous(args) : true
    if (previousResult === false) return false

    const allowCases = isCmsStaffUser(args.req.user) || isCasesPageEnabled()
    if (allowCases) return previousResult

    const hiddenIds = await resolveHiddenIds(args)
    const hide = casesPageAnonymousConstraint(hiddenIds)
    if (previousResult === true) return hide
    return { and: [previousResult, hide] }
  }
}

type HiddenPage = { slug?: string | null; layout?: unknown }

type AfterOperationArg = {
  operation: string
  result: unknown
  req: { user?: unknown }
  overrideAccess?: boolean
}

/**
 * Defence in depth for a renamed cases row that a where clause missed.
 * Payload's collection `afterRead` ignores a null return (`hook() || doc`),
 * so this uses `afterOperation`, which keeps any result other than undefined.
 */
export function casesPageAfterOperation({
  operation,
  result,
  req,
  overrideAccess,
}: AfterOperationArg): unknown {
  if (overrideAccess) return result
  if (isCmsStaffUser(req.user) || isCasesPageEnabled()) return result
  if (
    operation === 'find' &&
    result &&
    typeof result === 'object' &&
    Array.isArray((result as { docs?: unknown }).docs)
  ) {
    const current = result as { docs: unknown[]; totalDocs?: number }
    const docs = current.docs.filter((doc) => !isHiddenCasesDocument(doc as HiddenPage))
    const removed = current.docs.length - docs.length
    if (removed === 0) return result
    const totalDocs =
      typeof current.totalDocs === 'number' ? Math.max(0, current.totalDocs - removed) : docs.length
    return { ...current, docs, totalDocs }
  }
  if (operation === 'findByID' && isHiddenCasesDocument(result as HiddenPage)) {
    throw new NotFound()
  }
  return result
}

type CollectionLike = {
  slug?: string
  access?: {
    read?: Access
    [key: string]: unknown
  }
  hooks?: object
}

type ConfigLike = {
  collections?: CollectionLike[]
}

/**
 * Replace the pages collection `access.read` with {@link casesPageReadAccess},
 * composing with whatever site-core already set, and append
 * {@link casesPageAfterOperation}. Throws if `pages` is missing so a silent miss
 * cannot reopen the public leak.
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
  const currentHooks = (pages.hooks ?? {}) as { afterOperation?: unknown[] }
  const previousHooks = currentHooks.afterOperation ?? []
  pages.hooks = {
    ...currentHooks,
    afterOperation: [casesPageAfterOperation, ...previousHooks],
  }
  return config
}
