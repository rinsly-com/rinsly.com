import { readServerEnv } from './env'

/** Non-secret wrangler / process env flag. Default off. */
export const KVK_COLLECTION_FLAG = 'RINSLY_KVK_COLLECTION_ENABLED'

/**
 * Collection is on only for `1`, `true`, or `yes` (any case, surrounding
 * space ignored). Anything else, including unset, is off.
 *
 * Server-only: this reads `readServerEnv()`. Client modules must take a
 * boolean already resolved on the server (a prop or the preview provider).
 */
export function isKvkCollectionEnabled(raw?: string): boolean {
  const source =
    raw !== undefined ? raw : (readServerEnv().RINSLY_KVK_COLLECTION_ENABLED ?? '')
  const value = source.trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes'
}
