import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`check_runs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`domain\` text NOT NULL,
  	\`token\` text NOT NULL,
  	\`ip_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`check_runs_token_idx\` ON \`check_runs\` (\`token\`);`)
  await db.run(sql`CREATE INDEX \`check_runs_ip_hash_idx\` ON \`check_runs\` (\`ip_hash\`);`)
  await db.run(sql`CREATE INDEX \`check_runs_updated_at_idx\` ON \`check_runs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`check_runs_created_at_idx\` ON \`check_runs\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`check_runs_id\` integer REFERENCES check_runs(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_check_runs_id_idx\` ON \`payload_locked_documents_rels\` (\`check_runs_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`check_runs\`;`)
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
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`offertes_id\`) REFERENCES \`offertes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`check_aanvragen_id\`) REFERENCES \`check_aanvragen\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "offertes_id", "check_aanvragen_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "offertes_id", "check_aanvragen_id" FROM \`payload_locked_documents_rels\`;`)
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
}
