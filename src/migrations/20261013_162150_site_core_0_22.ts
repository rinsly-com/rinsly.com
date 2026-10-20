import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`reset_password_requested_at\` text;`)
  await db.run(sql`ALTER TABLE \`media\` ADD \`_objectkey\` text;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_contact\` ADD \`show_form\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_contact\` ADD \`show_form\` integer DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`reset_password_requested_at\`;`)
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`_objectkey\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_contact\` DROP COLUMN \`show_form\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_contact\` DROP COLUMN \`show_form\`;`)
}
