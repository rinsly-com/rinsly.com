/**
 * Cloudflare traffic strip on the admin dashboard, from the engine.
 *
 * Payload resolves admin component paths against THIS app, so the engine's
 * component is re-exported here and referenced as
 * `/components/AnalyticsPanel#AnalyticsPanel` (see
 * `buildSiteConfig({ dashboardAnalytics: true })`). Re-run
 * `pnpm generate:importmap` after adding or removing this file.
 */
export {
  AnalyticsPanel,
  AnalyticsPanelDefault as default,
} from '@rinsly-com/site-core/admin'
