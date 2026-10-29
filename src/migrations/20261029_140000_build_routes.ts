import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * `buildRoutes` block tables.
 *
 * Text columns are nullable on purpose. In this schema a required, localized
 * block field is still stored as nullable text (see `pages_blocks_services_cards.title`).
 * The admin `required` flag is what stops an empty price; a NOT NULL column
 * would disagree with the next `migrate:create` and force a table recreate.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_build_routes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`title\` text,
  	\`intro\` text,
  	\`primary_label\` text,
  	\`primary_price\` text,
  	\`primary_term\` text,
  	\`alternative_kicker\` text,
  	\`alternative_label\` text,
  	\`alternative_price\` text,
  	\`alternative_term\` text,
  	\`footnote\` text,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_build_routes_order_idx\` ON \`pages_blocks_build_routes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_build_routes_parent_id_idx\` ON \`pages_blocks_build_routes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_build_routes_path_idx\` ON \`pages_blocks_build_routes\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_build_routes_locale_idx\` ON \`pages_blocks_build_routes\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_build_routes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`title\` text,
  	\`intro\` text,
  	\`primary_label\` text,
  	\`primary_price\` text,
  	\`primary_term\` text,
  	\`alternative_kicker\` text,
  	\`alternative_label\` text,
  	\`alternative_price\` text,
  	\`alternative_term\` text,
  	\`footnote\` text,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_build_routes_order_idx\` ON \`_pages_v_blocks_build_routes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_build_routes_parent_id_idx\` ON \`_pages_v_blocks_build_routes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_build_routes_path_idx\` ON \`_pages_v_blocks_build_routes\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_build_routes_locale_idx\` ON \`_pages_v_blocks_build_routes\` (\`_locale\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_build_routes\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_build_routes\`;`)
}
