/**
 * Publishes the four pages migrated by 20261127_170000_content_refactor
 * (home, prijzen, partnerprogramma, contact; NL + EN). Nothing else.
 * Runbook: docs/runbook-refactor-part2-content.md.
 *
 *   Dry run, read-only, public accp API (no credentials):
 *     pnpm content:publish-refactor:check
 *   Dry run through the Payload local API (local D1; NODE_ENV=production → accp D1):
 *     pnpm content:publish-refactor
 *   Write (only via .github/workflows/publish-refactor-accp.yml for accp):
 *     PUBLISH_CONFIRM=publish-4-pages-and-go-live pnpm content:publish-refactor apply
 *
 * Publishing is the production go-live: once published on accp, the next prod
 * build (develop → main, the admin Deploy button, or any admin publish, which
 * fires onContentPublished → deploy-prod) puts this copy on rinsly.com.
 */
import type { Obj } from '../src/lib/contentRefactor/edit'
import type { Locale } from '../src/lib/contentRefactor/pages'
import { type PageSource, PUBLISH_CONFIRM, runPublish } from '../src/lib/contentRefactor/publish'

// `payload run` passes only positional words to the script (it drops --flags),
// so the write switch is the word `apply`. `--apply` is accepted too (tsx).
const args = process.argv.slice(2)
const apply = args.includes('apply') || args.includes('--apply')
const publicApi = args.find((arg) => arg.startsWith('--from-public-api='))?.slice('--from-public-api='.length)
const confirm = process.env.PUBLISH_CONFIRM
const unknown = args.filter((arg) => !['apply', '--apply'].includes(arg) && !arg.startsWith('--from-public-api='))
const log = (line: string) => { console.log(`[publish-refactor] ${line}`); }

function publicSource(base: string): PageSource {
  const get = async (path: string): Promise<{ docs: Obj[] }> => {
    const res = await fetch(`${base.replace(/\/$/, '')}/api${path}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`GET ${path}: HTTP ${res.status}`)
    const body: unknown = await res.json()
    return body as { docs: Obj[] }
  }
  return {
    pages: async () => (await get('/pages?depth=0&limit=1000&draft=true&select[slug]=true')).docs as { id: number; slug?: string | null }[],
    read: async (id: number, locale: Locale, draft: boolean) =>
      (await get(`/pages?where[id][equals]=${id}&locale=${locale}&fallback-locale=none&depth=0&limit=1${draft ? '&draft=true' : ''}`)).docs[0] ?? {},
  }
}

async function main() {
  if (unknown.length) throw new Error(`unknown argument(s): ${unknown.join(' ')}`)
  if (publicApi) {
    if (apply) throw new Error('--from-public-api is read-only; it never writes')
    log(`target: ${publicApi} (public API, read-only dry run)`)
    await runPublish({ source: publicSource(publicApi), apply: false, log })
    return
  }
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })
  log(`target: ${process.env.NODE_ENV === 'production' ? 'REMOTE accp D1' : 'local D1'}, ${apply ? 'APPLY' : 'dry run'}`)
  if (apply) log(`confirmation ${confirm === PUBLISH_CONFIRM ? 'given' : 'missing or wrong'}`)
  if (payload.collections.pages.config.flattenedFields.some((field) => field.name === 'tenant')) {
    throw new Error('pages has a tenant field; this script only knows a single-site database')
  }
  await runPublish({
    source: {
      pages: async () => (await payload.find({ collection: 'pages', depth: 0, pagination: false, draft: true, select: { slug: true } })).docs,
      read: async (id, locale, draft) =>
        (await payload.findByID({ collection: 'pages', id, locale, fallbackLocale: false, depth: 0, draft })) as unknown as Obj,
    },
    publisher: async (id, locale, draft) => {
      await payload.update({
        collection: 'pages',
        id,
        locale,
        depth: 0,
        draft: false,
        data: { layout: draft.layout, meta: draft.meta, _status: 'published' } as never,
      })
    },
    apply,
    confirm,
    log,
  })
}

try {
  await main()
  process.exit(0)
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
