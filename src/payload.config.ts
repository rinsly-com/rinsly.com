import path from 'path'
import { fileURLToPath } from 'url'

import { buildSiteConfig } from '@rinsly-com/site-core/config'
import { siteConfig } from '@/site.config'

import { CheckAanvragen } from './collections/CheckAanvragen'
import { cloudflareEmailAdapter } from './email/cloudflareEmailAdapter'
import { CheckRuns } from './collections/CheckRuns'
import { Offertes } from './collections/Offertes'
import { PartnerAanvragen } from './collections/PartnerAanvragen'
import { diagramBlock } from './blocks/Diagram'
import { revenueCalculatorBlock } from './blocks/RevenueCalculator'
import { checkAanvraagHandler } from './endpoints/checkAanvraag'
import { checkRunStartHandler, checkRunStatusHandler } from './endpoints/checkRun'
import { offerteHandler } from './endpoints/offerte'
import {
  partnerAanvraagHandler,
  partnerInteresseHandler,
  partnerMarkHandler,
  partnerPendingHandler,
  partnerVerifyHandler,
} from './endpoints/partnerAanvraag'
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
  // Transactional mail (auth mails + submission notifications) as
  // noreply@rinsly.com via Cloudflare Email Sending; logs when no binding.
  email: cloudflareEmailAdapter({ defaultFromAddress: 'noreply@rinsly.com', defaultFromName: 'Rinsly' }),
  extraCollections: [Offertes, CheckAanvragen, CheckRuns, PartnerAanvragen],
  // Site-specific blocks: both encode Rinsly's own commercial model or its
  // mechanics, so they stay app-side rather than going into the shared engine.
  extraBlocks: [revenueCalculatorBlock, diagramBlock],
  extraEndpoints: [
    { path: '/offerte', method: 'post', handler: offerteHandler },
    // POST /api/check-aanvraag — lead form on the generic /check page.
    { path: '/check-aanvraag', method: 'post', handler: checkAanvraagHandler },
    // Self-service website check: start + progress polling (see lib/siteCheck).
    { path: '/check-run', method: 'post', handler: checkRunStartHandler },
    { path: '/check-run/status', method: 'get', handler: checkRunStatusHandler },
    // The partner funnel: Lens mints a signed invite link, the studio configures
    // itself here, and Ledger pulls the result. See endpoints/partnerAanvraag.ts.
    { path: '/partner-aanvraag', method: 'post', handler: partnerAanvraagHandler },
    // POST /api/partner-interesse — a studio that arrived on /contact by itself,
    // so there is no signed link to verify. Same collection, unverified domain.
    { path: '/partner-interesse', method: 'post', handler: partnerInteresseHandler },
    { path: '/partner-aanvraag/verify', method: 'get', handler: partnerVerifyHandler },
    // Read/ack side, for `ledger partners --pull`. Bearer-guarded.
    { path: '/partner-aanvraag/pending', method: 'get', handler: partnerPendingHandler },
    { path: '/partner-aanvraag/mark', method: 'post', handler: partnerMarkHandler },
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
  // Cloudflare traffic strip on the dashboard (unique visitors / page views).
  // Needs the src/components/AnalyticsPanel.tsx re-export plus
  // CLOUDFLARE_ZONE_ID + CLOUDFLARE_ANALYTICS_TOKEN; without those it renders
  // nothing on a live site.
  dashboardAnalytics: true,
  // TOTP two-factor authentication: login code field, /admin/two-factor
  // enrolment screen, and admins are steered into enrolling (never locked
  // out). Needs the src/components/TotpAuth.tsx re-export. This is what makes
  // the DPA's "tweefactorauthenticatie voor beheertoegang" sentence true.
  totp: { require: 'admin' },
})
