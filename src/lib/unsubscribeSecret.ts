/**
 * Where /afmelden reads UNSUBSCRIBE_TOKEN_SECRET.
 *
 * Middleware and the confirm page must use the same value. The HTTP status
 * is chosen in middleware and the card is chosen on the page; if one of them
 * sees a secret the other does not, a valid confirm form goes out as 503 or
 * an unavailable card goes out as 200. One-click verifies the POST with the
 * same lookup, so the form it renders can still withdraw consent.
 *
 * `getBindings()` is not the same in the middleware isolate as in a page
 * (getCloudflareContext has failed there), and a Next `.env` value often
 * exists only on `process.env`. A Worker secret is copied onto `process.env`
 * per request, but a static `process.env.…` read in middleware is inlined
 * empty at build time, so the env read below is a dynamic key.
 */
import { getBindings } from './bindings'
import { readWorkerSecrets } from './env'

export type UnsubscribeSecretLookup =
  { state: 'present'; secret: string } | { state: 'missing' } | { state: 'unknown' }

/**
 * `missing` means both sources were read and the secret is unset (fail
 * closed, 503). `unknown` means bindings threw and env was empty too: this
 * isolate could not tell, and must not force 503 over a page that still can.
 */
export function resolveUnsubscribeSecret(
  fromBindings: string,
  fromEnv: string,
  bindingsReadable: boolean,
): UnsubscribeSecretLookup {
  if (fromBindings) return { state: 'present', secret: fromBindings }
  if (fromEnv) return { state: 'present', secret: fromEnv }
  if (!bindingsReadable) return { state: 'unknown' }
  return { state: 'missing' }
}

function readProcessEnvUnsubscribeSecret(): string {
  const name = ['UNSUBSCRIBE', 'TOKEN', 'SECRET'].join('_')
  const env = process.env as unknown as Record<string, string | undefined>
  return env[name] ?? ''
}

export async function readUnsubscribeTokenSecret(): Promise<UnsubscribeSecretLookup> {
  try {
    const fromBindings = readWorkerSecrets(await getBindings()).UNSUBSCRIBE_TOKEN_SECRET ?? ''
    return resolveUnsubscribeSecret(fromBindings, readProcessEnvUnsubscribeSecret(), true)
  } catch {
    return resolveUnsubscribeSecret('', readProcessEnvUnsubscribeSecret(), false)
  }
}
