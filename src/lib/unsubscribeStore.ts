/**
 * Persistence for a marketing opt-out. The production D1 table is proposed
 * (see docs/marketing-unsubscribe.md) and is not created in this PR: that
 * migration needs Yaron's OK. Until it exists, the route uses
 * {@link UnavailableUnsubscribeStore} and fails closed.
 */
import type { UnsubscribeLocale } from './unsubscribeToken'

export type OptOutSource = 'one-click' | 'confirm'

export type OptOutRecord = {
  emailHash: string
  optedOutAt: string
  source: OptOutSource
  locale: UnsubscribeLocale
  tokenVersion: 1
}

export type StoreResult = 'created' | 'exists' | 'unavailable'

export interface UnsubscribeStore {
  record(row: OptOutRecord): Promise<StoreResult>
}

/** In-memory store for tests. Idempotent on emailHash. */
export class MemoryUnsubscribeStore implements UnsubscribeStore {
  readonly rows: OptOutRecord[] = []

  record(row: OptOutRecord): Promise<StoreResult> {
    if (this.rows.some((existing) => existing.emailHash === row.emailHash)) {
      return Promise.resolve('exists')
    }
    this.rows.push(row)
    return Promise.resolve('created')
  }
}

/** Production stand-in until the D1 table is approved and migrated. */
export class UnavailableUnsubscribeStore implements UnsubscribeStore {
  record(_row: OptOutRecord): Promise<StoreResult> {
    return Promise.resolve('unavailable')
  }
}
