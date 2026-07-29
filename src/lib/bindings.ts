import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Request-time Cloudflare bindings for frontend route code (e.g. the
 * LEADLENS_CHECKS R2 bucket behind /check/<token>). On the deployed Worker
 * `getCloudflareContext` resolves; under `next dev` / the Payload CLI there is
 * no Workers runtime, so fall back to wrangler's platform proxy (local binding
 * mocks) — the same plumbing the engine uses in buildSiteConfig.ts, including
 * the obfuscated specifier so wrangler never ends up in the Worker bundle.
 */
let proxy: Promise<{ env: unknown }> | undefined

export async function getBindings(): Promise<CloudflareEnv> {
  try {
    return (await getCloudflareContext({ async: true })).env as CloudflareEnv
  } catch {
    proxy ??= import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
      ({ getPlatformProxy }) => getPlatformProxy({ environment: process.env.CLOUDFLARE_ENV }),
    )
    return (await proxy).env as CloudflareEnv
  }
}
