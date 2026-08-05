import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` ADD \`variant\` text DEFAULT 'default';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` ADD \`variant\` text DEFAULT 'default';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` DROP COLUMN \`variant\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` DROP COLUMN \`variant\`;`)
}
