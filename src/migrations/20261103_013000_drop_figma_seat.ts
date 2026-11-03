import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`partner_aanvragen\` DROP COLUMN \`figma_seat\`;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`partner_aanvragen\` ADD \`figma_seat\` integer DEFAULT false;`)
}
