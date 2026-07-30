import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Request-time Cloudflare bindings for frontend route code (e.g. the
 * LEADLENS_CHECKS R2 bucket behind /check/<token>). On the deployed Worker
 * `getCloudflareContext` resolves; under `next dev` / the Payload CLI there is
 * no Workers runtime, so fall back to wrangler's platform proxy (local binding
 * mocks) — the same plumbing the engine uses in buildSiteConfig.ts, including
 * the obfuscated specifier so wrangler never ends up in the Worker bundle.
 */
type Runtime = { env: CloudflareEnv; waitUntil: (p: Promise<unknown>) => void }

let proxy: Promise<{ env: unknown; ctx?: { waitUntil?: (p: Promise<unknown>) => void } }> | undefined

export async function getRuntime(): Promise<Runtime> {
  try {
    const ctx = await getCloudflareContext({ async: true })
    return { env: ctx.env as CloudflareEnv, waitUntil: (p) => ctx.ctx.waitUntil(p) }
  } catch {
    proxy ??= import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
      ({ getPlatformProxy }) => getPlatformProxy({ environment: process.env.CLOUDFLARE_ENV }),
    )
    const local = await proxy
    // Dev/node: no real ExecutionContext — the promise simply keeps running.
    return {
      env: local.env as CloudflareEnv,
      waitUntil: (p) => void (local.ctx?.waitUntil ? local.ctx.waitUntil(p) : p.catch(() => {})),
    }
  }
}

export async function getBindings(): Promise<CloudflareEnv> {
  return (await getRuntime()).env
}
