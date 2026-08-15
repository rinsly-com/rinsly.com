import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`totp_secret\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`totp_last_counter\` numeric;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`totp_recovery\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`totp_confirmed_at\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`totp_secret\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`totp_last_counter\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`totp_recovery\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`totp_confirmed_at\`;`)
}
