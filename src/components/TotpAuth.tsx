/**
 * Two-factor authentication admin UI, for `buildSiteConfig({ totp: ... })`.
 * Payload resolves admin component paths against THIS app, so the engine's
 * components are re-exported here (see the engine's components/admin/index.ts).
 */
export { TotpLoginView, TotpSetupView, TotpGate, TotpNavLink } from '@rinsly-com/site-core/admin'
