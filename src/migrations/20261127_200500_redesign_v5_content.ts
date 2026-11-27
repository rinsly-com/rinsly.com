import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

import { runRedesignV5 } from '../lib/contentRefactor/redesignV5'

/**
 * Content-only migration (no schema change): redesign direction B v5 for the
 * home, prijzen and partnerprogramma drafts (NL + EN). Approved by Yaron on
 * 27 Nov 2026 19:37 (v5, via Marketeer); the accp D1 write is covered by his
 * route-A OK for the refactor content migrations.
 *
 * Needs the new block tables (20261127_200000_redesign_v5_blocks, which runs
 * first). Writes drafts only, and only where the latest draft is still exactly
 * the #122 draft (20261127_170000_content_refactor); down() restores the #122
 * draft only where the v5 draft is untouched and unpublished. Contact, header
 * and footer are not touched. See src/lib/contentRefactor/redesignV5.ts.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await runRedesignV5({ payload, req, direction: 'up' })
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await runRedesignV5({ payload, req, direction: 'down' })
}
