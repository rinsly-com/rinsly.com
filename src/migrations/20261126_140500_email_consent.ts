import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Additive consent columns on check_aanvragen and offertes.
 * Nullable only: existing rows stay as they are (NULLs / the checkbox default).
 * No table rewrite, no UPDATE, no DROP in up().
 *
 * Retention of the values is 5 years after the last mail about that row.
 * See src/lib/emailConsent.ts. This migration does not delete anything.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`check_aanvragen\` ADD \`consent_given\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`check_aanvragen\` ADD \`consent_at\` text;`)
  await db.run(sql`ALTER TABLE \`check_aanvragen\` ADD \`consent_text\` text;`)
  await db.run(sql`CREATE INDEX \`check_aanvragen_consent_at_idx\` ON \`check_aanvragen\` (\`consent_at\`);`)
  await db.run(sql`ALTER TABLE \`offertes\` ADD \`consent_given\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`offertes\` ADD \`consent_at\` text;`)
  await db.run(sql`ALTER TABLE \`offertes\` ADD \`consent_text\` text;`)
  await db.run(sql`CREATE INDEX \`offertes_consent_at_idx\` ON \`offertes\` (\`consent_at\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`check_aanvragen_consent_at_idx\`;`)
  await db.run(sql`ALTER TABLE \`check_aanvragen\` DROP COLUMN \`consent_text\`;`)
  await db.run(sql`ALTER TABLE \`check_aanvragen\` DROP COLUMN \`consent_at\`;`)
  await db.run(sql`ALTER TABLE \`check_aanvragen\` DROP COLUMN \`consent_given\`;`)
  await db.run(sql`DROP INDEX \`offertes_consent_at_idx\`;`)
  await db.run(sql`ALTER TABLE \`offertes\` DROP COLUMN \`consent_text\`;`)
  await db.run(sql`ALTER TABLE \`offertes\` DROP COLUMN \`consent_at\`;`)
  await db.run(sql`ALTER TABLE \`offertes\` DROP COLUMN \`consent_given\`;`)
}
