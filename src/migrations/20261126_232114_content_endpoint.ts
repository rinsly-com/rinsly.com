import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`content_audit\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`at\` text NOT NULL,
  	\`outcome\` text NOT NULL,
  	\`reason\` text NOT NULL,
  	\`who\` text NOT NULL,
  	\`key_id\` text NOT NULL,
  	\`ip\` text NOT NULL,
  	\`kind\` text,
  	\`slug\` text,
  	\`doc_id\` text,
  	\`path\` text,
  	\`locale\` text,
  	\`before\` text,
  	\`after\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`content_audit_updated_at_idx\` ON \`content_audit\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`content_audit_created_at_idx\` ON \`content_audit\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`content_replay\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`kind\` text NOT NULL,
  	\`key_id\` text,
  	\`expires_at\` text,
  	\`count\` numeric,
  	\`window_start\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`content_replay_key_idx\` ON \`content_replay\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`content_replay_updated_at_idx\` ON \`content_replay\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`content_replay_created_at_idx\` ON \`content_replay\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`content_audit_id\` integer REFERENCES content_audit(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`content_replay_id\` integer REFERENCES content_replay(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_content_audit_id_idx\` ON \`payload_locked_documents_rels\` (\`content_audit_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_content_replay_id_idx\` ON \`payload_locked_documents_rels\` (\`content_replay_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`content_audit\`;`)
  await db.run(sql`DROP TABLE \`content_replay\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`pages_id\` integer,
  	\`offertes_id\` integer,
  	\`check_aanvragen_id\` integer,
  	\`check_runs_id\` integer,
  	\`partner_aanvragen_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`offertes_id\`) REFERENCES \`offertes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`check_aanvragen_id\`) REFERENCES \`check_aanvragen\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`check_runs_id\`) REFERENCES \`check_runs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`partner_aanvragen_id\`) REFERENCES \`partner_aanvragen\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "offertes_id", "check_aanvragen_id", "check_runs_id", "partner_aanvragen_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "offertes_id", "check_aanvragen_id", "check_runs_id", "partner_aanvragen_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_offertes_id_idx\` ON \`payload_locked_documents_rels\` (\`offertes_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_check_aanvragen_id_idx\` ON \`payload_locked_documents_rels\` (\`check_aanvragen_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_check_runs_id_idx\` ON \`payload_locked_documents_rels\` (\`check_runs_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_partner_aanvragen_id_idx\` ON \`payload_locked_documents_rels\` (\`partner_aanvragen_id\`);`)
}
