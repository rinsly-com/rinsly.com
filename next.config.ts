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
// so the static site handles `/` via out/_redirects (written by build-static.mjs).
if (!isStatic) {
  nextConfig.redirects = async () => [{ source: '/', destination: '/nl', permanent: false }]
}

export default isStatic ? nextConfig : withPayload(nextConfig, { devBundleServerPackages: false })
