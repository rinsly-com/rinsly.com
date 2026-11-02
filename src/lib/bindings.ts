import { getCloudflareContext } from '@opennextjs/cloudflare'

import { readServerEnv } from './env'
import { logCaught } from './logCaught'

/**
 * Request-time Cloudflare bindings for frontend route code (e.g. the
 * LEADLENS_CHECKS R2 bucket behind /check/<token>). On the deployed Worker
 * `getCloudflareContext` resolves; under `next dev` / the Payload CLI there is
 * no Workers runtime, so fall back to wrangler's platform proxy (local binding
 * mocks) — the same plumbing the engine uses in buildSiteConfig.ts, including
 * the obfuscated specifier so wrangler never ends up in the Worker bundle.
 */
type Runtime = { env: CloudflareEnv; waitUntil: (p: Promise<unknown>) => void }

type LocalProxy = {
  env: unknown
  ctx?: { waitUntil?: (promise: Promise<unknown>) => void } | undefined
}

let proxy: Promise<LocalProxy> | undefined
let loggedProxyFallback = false

type PlatformProxyModule = {
  getPlatformProxy: (options: { environment?: string | undefined }) => Promise<LocalProxy>
}

function readPlatformProxy(mod: unknown): PlatformProxyModule['getPlatformProxy'] {
  if (
    typeof mod === 'object' &&
    mod !== null &&
    'getPlatformProxy' in mod &&
    typeof mod.getPlatformProxy === 'function'
  ) {
    return mod.getPlatformProxy.bind(mod) as PlatformProxyModule['getPlatformProxy']
  }
  throw new Error('wrangler platform proxy is unavailable')
}

export async function getRuntime(): Promise<Runtime> {
  try {
    const ctx = await getCloudflareContext({ async: true })
    return { env: ctx.env, waitUntil: (p) => { ctx.ctx.waitUntil(p); } }
  } catch (err) {
    if (!loggedProxyFallback) {
      loggedProxyFallback = true
      logCaught('[bindings] workers context unavailable, using the local proxy', err)
    }
    // Built at runtime. A plain specifier would make webpack bundle wrangler into the Worker.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-template-expression
    proxy ??= import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then((mod) =>
      readPlatformProxy(mod)({ environment: readServerEnv().CLOUDFLARE_ENV }),
    )
    const local = await proxy
    // Dev/node: no real ExecutionContext — the promise simply keeps running.
    return {
      env: local.env as CloudflareEnv,
      waitUntil: (p) => {
        if (local.ctx?.waitUntil) {
          local.ctx.waitUntil(p)
          return
        }
        void p.catch((err: unknown) => {
          logCaught('[bindings] background task failed', err)
        })
      },
    }
  }
}

export async function getBindings(): Promise<CloudflareEnv> {
  return (await getRuntime()).env
}
