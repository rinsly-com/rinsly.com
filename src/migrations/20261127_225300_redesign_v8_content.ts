import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

import { runRedesignV8 } from '../lib/contentRefactor/redesignV8'

/**
 * Content-only migration (no schema change): redesign round v8 for the home,
 * prijzen and partnerprogramma drafts (NL + EN): the v6 first-screen dedupe
 * (CHANGE-TABLE), the Lawyer-cleared home door 2 bullets and frame badge, and
 * the v8 frames (Live/Staging on prijzen, the mobile CMS phone on home).
 * Approved as drafts by Yaron on 27 Nov 2026 23:45 ("Yes, send v8 and the
 * text fixes to Builder as drafts, no publish").
 *
 * Needs the frame label columns (20261127_225200_redesign_v8_frame_labels,
 * which runs first). Writes drafts only, and only where the latest draft is
 * still exactly the v5 draft (20261127_200500_redesign_v5_content); down()
 * restores the v5 draft only where the v8 draft is untouched and unpublished.
 * Never publishes. Contact, header and footer are not touched. See
 * src/lib/contentRefactor/redesignV8.ts.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await runRedesignV8({ payload, req, direction: 'up' })
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await runRedesignV8({ payload, req, direction: 'down' })
}
