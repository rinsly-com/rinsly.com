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
