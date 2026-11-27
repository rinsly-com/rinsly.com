import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Partner terms v3.3 (art. 5): the /partner application form asks for the two
 * rungs a studio can choose, Eerste lijn and Verkoop. Additive checkbox
 * columns (INTEGER 0/1, default 0 = false) on partner_aanvragen. Existing rows
 * get 0: they were filed under the old ladder and keep their old answers in
 * exclusiviteit / relatiebeheer / marketing (not backfilled on purpose).
 * No table rewrite, no UPDATE in up().
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`partner_aanvragen\` ADD \`eerste_lijn\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`partner_aanvragen\` ADD \`verkoop\` integer DEFAULT false;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`partner_aanvragen\` DROP COLUMN \`verkoop\`;`)
  await db.run(sql`ALTER TABLE \`partner_aanvragen\` DROP COLUMN \`eerste_lijn\`;`)
}
