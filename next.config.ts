import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  images: {
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
  async redirects() {
    // The site lives under locale prefixes. The bare root sends visitors to the
    // default locale in dev; at the edge, rinsly.com → /en and rinsly.nl → /nl.
    return [{ source: '/', destination: '/nl', permanent: false }]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
