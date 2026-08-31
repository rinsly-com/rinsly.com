/**
 * Every admin component the engine owns, re-exported for this app.
 *
 * Payload resolves `admin.components` paths against THIS app rather than
 * against the package, so the engine points all of them at one path,
 * `/components/RinslyAdmin` (see the engine's `config/adminPaths.ts`). Re-run
 * `pnpm generate:importmap` after touching this file.
 *
 * Export the lot even though this site does not enable every feature: an unused
 * export costs an importMap entry and nothing else, while a missing one is a
 * blank admin screen found in production.
 */
export {
  AdminLogo,
  AdminIcon,
  AnalyticsPanel,
  UptimePanel,
  BackupsPanel,
  TotpLoginView,
  TotpSetupView,
  TotpGate,
  TotpNavLink,
  WorkflowAction,
  WorkflowStatusCell,
  VisualEditBridge,
} from '@rinsly-com/site-core/admin'
