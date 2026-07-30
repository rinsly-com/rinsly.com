import path from 'path'
import { fileURLToPath } from 'url'

import { buildSiteConfig } from '@rinsly-com/site-core/config'
import { siteConfig } from '@/site.config'

import { CheckAanvragen } from './collections/CheckAanvragen'
import { CheckRuns } from './collections/CheckRuns'
import { Offertes } from './collections/Offertes'
import { checkAanvraagHandler } from './endpoints/checkAanvraag'
import { checkRunStartHandler, checkRunStatusHandler } from './endpoints/checkRun'
import { offerteHandler } from './endpoints/offerte'
import { deployHandler } from './endpoints/deploy'
import { triggerDeploy } from './hooks/triggerStaticDeploy'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Rinsly's Payload config. The engine (@rinsly-com/site-core) provides all the
 * shared plumbing (Cloudflare/D1/R2, localization, SEO, base collections, blocks);
 * here we add Rinsly's quote-request feature (Offertes collection + /offerte
 * endpoint) and the accp→prod static Deploy button, and pass the two path
 * anchors that must resolve app-side.
 */
export default buildSiteConfig({
  siteConfig,
  extraCollections: [Offertes, CheckAanvragen, CheckRuns],
  extraEndpoints: [
    { path: '/offerte', method: 'post', handler: offerteHandler },
    // POST /api/check-aanvraag — lead form on the generic /check page.
    { path: '/check-aanvraag', method: 'post', handler: checkAanvraagHandler },
    // Self-service website check: start + progress polling (see lib/siteCheck).
    { path: '/check-run', method: 'post', handler: checkRunStartHandler },
    { path: '/check-run/status', method: 'get', handler: checkRunStatusHandler },
    // POST /api/deploy — manual "rebuild production" trigger (endpoints/deploy.ts).
    { path: '/deploy', method: 'post', handler: deployHandler },
  ],
  // Sidebar link + custom view for the manual production static deploy.
  adminComponents: {
    afterNavLinks: ['/components/DeployNavLink#DeployNavLink'],
    views: {
      deploy: { Component: '/components/DeployView#DeployView', path: '/deploy' },
    },
  },
  // Publishing a page / editing a global rebuilds the static prod site.
  onContentPublished: async ({ reason, payload }) => {
    await triggerDeploy(payload, reason)
  },
  importMapBaseDir: path.resolve(dirname),
  typesOutputFile: path.resolve(dirname, 'payload-types.ts'),
})
