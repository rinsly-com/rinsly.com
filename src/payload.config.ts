import path from 'path'
import { fileURLToPath } from 'url'

import { buildSiteConfig } from '@rinsly-com/site-core/config'
import { siteConfig } from '@/site.config'

import { Offertes } from './collections/Offertes'
import { offerteHandler } from './endpoints/offerte'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Rinsly's Payload config. The engine (@rinsly-com/site-core) provides all the
 * shared plumbing (Cloudflare/D1/R2, localization, SEO, base collections, blocks);
 * here we add Rinsly's quote-request feature (Offertes collection + /offerte
 * endpoint) and pass the two path anchors that must resolve app-side.
 */
export default buildSiteConfig({
  siteConfig,
  extraCollections: [Offertes],
  extraEndpoints: [{ path: '/offerte', method: 'post', handler: offerteHandler }],
  importMapBaseDir: path.resolve(dirname),
  typesOutputFile: path.resolve(dirname, 'payload-types.ts'),
})
