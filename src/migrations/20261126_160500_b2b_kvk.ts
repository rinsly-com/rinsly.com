import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Additive B2B columns on offertes. Nullable only: existing quote rows stay
 * NULL. No table rewrite, no UPDATE, no DROP in up().
 * New submissions set the values in the /api/offerte handler.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`offertes\` ADD \`b2b_confirmed\` integer;`)
  await db.run(sql`ALTER TABLE \`offertes\` ADD \`b2b_confirmed_at\` text;`)
  await db.run(sql`ALTER TABLE \`offertes\` ADD \`kvk_nummer\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`offertes\` DROP COLUMN \`kvk_nummer\`;`)
  await db.run(sql`ALTER TABLE \`offertes\` DROP COLUMN \`b2b_confirmed_at\`;`)
  await db.run(sql`ALTER TABLE \`offertes\` DROP COLUMN \`b2b_confirmed\`;`)
}
