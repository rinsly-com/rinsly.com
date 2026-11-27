import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

import { runContentRefactor } from '../lib/contentRefactor/run'

/**
 * Content-only migration (no schema change): the 27 Nov 2026 site refactor
 * (builder brief §3, refactor-plan-003) for home, prijzen, partnerprogramma,
 * contact, and the header/footer globals. Approved by Yaron on 27 Nov 15:50
 * ("A: content migration, OK to write accp D1").
 *
 * Pages are written as drafts; publish them in the admin after review. Every
 * edit is guarded against the accp snapshot of 27 Nov 16:15 and is idempotent;
 * down() restores the snapshot where nothing changed since. See
 * src/lib/contentRefactor/run.ts.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await runContentRefactor({ payload, req, direction: 'up' })
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await runContentRefactor({ payload, req, direction: 'down' })
}
