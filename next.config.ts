import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// When BUILD_STATIC=true we produce the fully static production site
// (`output: export` -> out/). scripts/build-static.mjs stashes the (payload)
// admin/API group and snapshots published content from the accp API first, so
// the export needs no Payload runtime.
const isStatic = process.env.BUILD_STATIC === 'true'

const nextConfig: NextConfig = {
  // The engine ships as TypeScript/JSX source; Next must transpile it.
  transpilePackages: ['@rinsly-com/site-core'],
  images: {
    // Static export can't use the Next image optimizer.
    unoptimized: isStatic,
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  // Packages with Cloudflare Workers (workerd) specific code.
  // https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare'],
  experimental: {
    // Page-data collection / prerender workers each open wrangler's local D1
    // mock; parallel workerd instances race on WAL recovery of the same SQLite
    // file (SQLITE_BUSY_RECOVERY) and abort the build. Collect serially.
    cpus: 1,
  },
  // The static build uses its own dist dir so it can run while the dev server
  // (which serves the accp content API it snapshots) stays up.
  ...(isStatic ? { output: 'export' as const, distDir: '.next-static' } : {}),
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

// The bare-root redirect needs a server; `output: export` forbids redirects(),
// so the static site handles `/` via out/_redirects (written by build-static.mjs,
// which also mirrors the locale-prefixed /check redirects below).
if (!isStatic) {
  nextConfig.redirects = async () => [
    { source: '/', destination: '/nl', permanent: false },
    // /check is deliberately locale-less (short URL in the LeadLens mail, Dutch
    // only) — catch intuitive locale-prefixed variants instead of 404ing.
    { source: '/:locale(nl|en)/check/:path*', destination: '/check/:path*', permanent: true },
  ]
}

const config = isStatic ? nextConfig : withPayload(nextConfig, { devBundleServerPackages: false })

if (!isStatic) {
  // withPayload adds Accept-CH/Critical-CH (Sec-CH-Prefers-Color-Scheme) on
  // every route for the admin's server-side theming. A Critical-CH response
  // makes Chromium RESTART the navigation to resend the hint — a full extra
  // round trip on every first visit. The /check funnel pages (LeadLens
  // scorecards) theme via pure CSS prefers-color-scheme and are exactly where
  // we sell speed, so carve them out of Payload's catch-all header entry.
  const payloadHeaders = config.headers?.bind(config)
  config.headers = async () => {
    const entries = payloadHeaders ? await payloadHeaders() : []
    return entries.map((entry) =>
      entry.source === '/:path*' && entry.headers?.some((h) => h.key === 'Critical-CH')
        ? { ...entry, source: '/((?!check).*)' }
        : entry,
    )
  }
}

export default config
