// Build the fully static production site (out/) for rinsly — the public
// rinsly.com site, a static export of the published content served from the
// accp CMS (accp.rinsly.com).
//
// The engine's data layer reads a per-locale JSON snapshot when CONTENT_SNAPSHOT
// is set (see @rinsly-com/site-core lib/pages + lib/globals), so we pre-fetch all
// published content from the accp API BEFORE stashing the (payload) admin/API
// group — locally the API is this same dev server, so stashing it first would
// break the very fetch the snapshot depends on.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const backupDir = path.join(root, '.static-build-backup')
const snapshotDir = path.join(root, '.static-content')
const API_URL = (process.env.PAYLOAD_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

// Content locales — must match the engine's LOCALES (Dutch is the default).
const LOCALES = ['nl', 'en']
const DEFAULT_LOCALE = 'nl'

// Server-only routes to hide during the static export: the (payload) admin/API
// group, and the personal LeadLens scorecard pages (/check/<token>), which read
// R2 at request time — the runtime lives on accp (see wrangler.jsonc's
// LEADLENS_CHECKS notes). The generic /check page IS exported.
const EXCLUDED = [
  { live: 'src/app/(payload)', stashed: 'app__payload' },
  { live: 'src/app/(frontend)/check/[token]', stashed: 'app__frontend_check_token' },
]

const stash = () => {
  mkdirSync(backupDir, { recursive: true })
  for (const { live, stashed } of EXCLUDED) {
    const from = path.join(root, live)
    if (existsSync(from)) renameSync(from, path.join(backupDir, stashed))
  }
}

const restore = () => {
  for (const { live, stashed } of EXCLUDED) {
    const from = path.join(backupDir, stashed)
    if (existsSync(from)) renameSync(from, path.join(root, live))
  }
  rmSync(backupDir, { recursive: true, force: true })
}

// The (frontend) routes are `force-dynamic` (accp renders live). `output: export`
// forbids dynamic routes, so for the static build only we strip that export and
// pin `dynamicParams = false` (only the slugs from generateStaticParams are
// prerendered). Route-segment config must be a static literal, so this is a
// source rewrite, not a runtime toggle. Originals are restored in `finally`.
const DYNAMIC_ROUTES = [
  'src/app/(frontend)/[locale]/page.tsx',
  'src/app/(frontend)/[locale]/[slug]/page.tsx',
  'src/app/(frontend)/[locale]/opengraph-image.tsx',
  'src/app/(frontend)/[locale]/[slug]/opengraph-image.tsx',
  // sitemap.xml is force-dynamic on accp; static export reads the snapshot.
  'src/app/sitemap.ts',
]
const savedRouteSrc = new Map()
const staticizeRoutes = () => {
  for (const rel of DYNAMIC_ROUTES) {
    const file = path.join(root, rel)
    if (!existsSync(file)) continue
    const src = readFileSync(file, 'utf8')
    savedRouteSrc.set(file, src)
    // Swap force-dynamic -> force-static (output: export requires routes that
    // fetch to declare themselves static) and pin dynamicParams to false.
    const patched = src
      .replace(/^export const dynamic = ['"]force-dynamic['"]/m, "export const dynamic = 'force-static'")
      .replace(/^export const dynamicParams = true\b.*$/m, 'export const dynamicParams = false')
    writeFileSync(file, patched)
  }
}
const restoreRoutes = () => {
  for (const [file, src] of savedRouteSrc) writeFileSync(file, src)
  savedRouteSrc.clear()
}

const fetchJson = async (url) => {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`)
  return res.json()
}

// Pre-fetch published content, keyed exactly as the engine data layer reads it:
// pages-index-<locale>, page-<slug>-<locale>, global-<slug>-<locale>.
const snapshotContent = async () => {
  rmSync(snapshotDir, { recursive: true, force: true })
  mkdirSync(snapshotDir, { recursive: true })
  const write = (name, data) =>
    writeFileSync(path.join(snapshotDir, `${name}.json`), JSON.stringify(data))

  let total = 0
  for (const locale of LOCALES) {
    const index = await fetchJson(
      `${API_URL}/api/pages?where[_status][equals]=published&limit=200&depth=0&locale=${locale}`,
    )
    const pages = index.docs ?? []
    write(`pages-index-${locale}`, pages)

    for (const page of pages) {
      if (!page.slug) continue
      const detail = await fetchJson(
        `${API_URL}/api/pages?where[and][0][slug][equals]=${encodeURIComponent(page.slug)}` +
          `&where[and][1][_status][equals]=published&limit=1&depth=2&locale=${locale}`,
      )
      write(`page-${page.slug}-${locale}`, detail.docs?.[0] ?? null)
      total++
    }

    for (const slug of ['header', 'footer']) {
      try {
        write(
          `global-${slug}-${locale}`,
          await fetchJson(`${API_URL}/api/globals/${slug}?depth=2&locale=${locale}`),
        )
      } catch {
        write(`global-${slug}-${locale}`, null)
      }
    }
  }
  console.log(`✔ Snapshotted ${total} page(s) across ${LOCALES.length} locale(s) + globals from ${API_URL}`)
}

// Clean up any leftovers from a previously interrupted run before we start.
if (existsSync(backupDir)) restore()
rmSync(path.join(root, 'out'), { recursive: true, force: true })
// The static build has its own dist dir (see next.config.ts) so the running dev
// server's .next (which owns the content API) is never touched.
rmSync(path.join(root, '.next-static'), { recursive: true, force: true })

// The engine reads the snapshot ONLY (no HTTP fallback in static mode), so a
// failed snapshot must fail the build rather than ship an empty site.
await snapshotContent()

try {
  stash()
  staticizeRoutes()
  execFileSync('pnpm', ['exec', 'next', 'build'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      BUILD_STATIC: 'true',
      CONTENT_SNAPSHOT: snapshotDir,
      // Inlined into the client offerte form so it posts to the accp API
      // (cross-origin from rinsly.com; accp allows it via CORS).
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || API_URL,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --no-deprecation`.trim(),
    },
  })
} finally {
  restoreRoutes()
  restore()
  rmSync(snapshotDir, { recursive: true, force: true })
}

// With a custom distDir, Next writes the export into the distDir itself — move
// it to out/, which wrangler.static.jsonc serves.
if (existsSync(path.join(root, '.next-static'))) {
  renameSync(path.join(root, '.next-static'), path.join(root, 'out'))
}

// The public site has no root page (routes live under /[locale]); redirect `/`
// to the default locale at the edge (Cloudflare static-asset _redirects). The
// /check funnel is locale-less — send locale-prefixed variants there too
// (mirrors next.config.ts's dynamic-server redirects).
writeFileSync(
  path.join(root, 'out', '_redirects'),
  [
    `/    /${DEFAULT_LOCALE}    302`,
    ...LOCALES.flatMap((l) => [`/${l}/check    /check    301`, `/${l}/check/*    /check/:splat    301`]),
    '',
  ].join('\n'),
)

// Security headers for every static response (Workers Static Assets _headers).
// The CSP allows Next's inline hydration scripts/styles ('unsafe-inline' — a
// static export cannot use nonces) and the accp origin for media images and
// the form/check API calls.
const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL || API_URL).origin
writeFileSync(
  path.join(root, 'out', '_headers'),
  [
    '/*',
    '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
    '  X-Content-Type-Options: nosniff',
    '  X-Frame-Options: DENY',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
    `  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: ${apiOrigin}; font-src 'self' data:; connect-src 'self' ${apiOrigin}; frame-ancestors 'none'; base-uri 'self'; form-action 'self' ${apiOrigin}; object-src 'none'`,
    '',
  ].join('\n'),
)

console.log('\n✔ Static site built to ./out')
