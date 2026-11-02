import { z } from 'zod'

import { logCaught } from './logCaught'

/** Blank strings are treated as unset, matching `value || fallback`. */
const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().optional(),
)

const serverEnvSchema = z.object({
  BUILD_STATIC: optionalString,
  CI: optionalString,
  CLOUDFLARE_ENV: optionalString,
  DEPLOY_DISPATCH_EVENT: optionalString,
  DEPLOY_DISPATCH_TOKEN: optionalString,
  DEPLOY_DISPATCH_URL: optionalString,
  NEXT_PUBLIC_API_URL: optionalString,
  NEXT_PUBLIC_SITE_URL: optionalString,
  NEXT_PUBLIC_TURNSTILE_SITEKEY: optionalString,
  PAYLOAD_SERVER_URL: optionalString,
  PLAYWRIGHT_BASE_URL: optionalString,
  PSI_API_KEY: optionalString,
  RESET_EMAIL: optionalString,
  RESET_PASSWORD: optionalString,
  SEED_ADMIN_EMAIL: optionalString,
  SEED_ADMIN_PASSWORD: optionalString,
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/** Process env this app reads. Invalid values log and fall back to unset. */
export function readServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    BUILD_STATIC: process.env.BUILD_STATIC,
    CI: process.env.CI,
    CLOUDFLARE_ENV: process.env.CLOUDFLARE_ENV,
    DEPLOY_DISPATCH_EVENT: process.env.DEPLOY_DISPATCH_EVENT,
    DEPLOY_DISPATCH_TOKEN: process.env.DEPLOY_DISPATCH_TOKEN,
    DEPLOY_DISPATCH_URL: process.env.DEPLOY_DISPATCH_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_TURNSTILE_SITEKEY: process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY,
    PAYLOAD_SERVER_URL: process.env.PAYLOAD_SERVER_URL,
    PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL,
    PSI_API_KEY: process.env.PSI_API_KEY,
    RESET_EMAIL: process.env.RESET_EMAIL,
    RESET_PASSWORD: process.env.RESET_PASSWORD,
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
  })
  if (!parsed.success) {
    logCaught('[env] server environment failed validation', parsed.error)
    return {}
  }
  return parsed.data
}

const workerSecretsSchema = z.object({
  CHECK_RATE_EXEMPT_IPS: optionalString,
  LEDGER_PULL_SECRET: optionalString,
  PARTNER_TOKEN_SECRET: optionalString,
  PSI_API_KEY: optionalString,
})

export type WorkerSecrets = z.infer<typeof workerSecretsSchema>

/**
 * Worker secrets that are not declared bindings. Non-strings are unset
 * (the previous cast assumed `string | undefined`).
 */
export function readWorkerSecrets(env: CloudflareEnv): WorkerSecrets {
  const raw = env as unknown as Record<string, unknown>
  const parsed = workerSecretsSchema.safeParse({
    CHECK_RATE_EXEMPT_IPS: raw['CHECK_RATE_EXEMPT_IPS'],
    LEDGER_PULL_SECRET: raw['LEDGER_PULL_SECRET'],
    PARTNER_TOKEN_SECRET: raw['PARTNER_TOKEN_SECRET'],
    PSI_API_KEY: raw['PSI_API_KEY'],
  })
  if (!parsed.success) {
    logCaught('[env] worker secrets failed validation', parsed.error)
    return {}
  }
  return parsed.data
}

/** `NEXT_PUBLIC_*` string, or '' when unset. Pass the direct `process.env` read so Next can inline it. */
export function publicString(value: string | undefined): string {
  const parsed = optionalString.safeParse(value)
  return parsed.success && parsed.data !== undefined ? parsed.data : ''
}
