import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_revenue_calculator\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`title\` text,
  	\`intro\` text,
  	\`footnote\` text,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_revenue_calculator_order_idx\` ON \`pages_blocks_revenue_calculator\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_revenue_calculator_parent_id_idx\` ON \`pages_blocks_revenue_calculator\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_revenue_calculator_path_idx\` ON \`pages_blocks_revenue_calculator\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_revenue_calculator_locale_idx\` ON \`pages_blocks_revenue_calculator\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_diagram\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`kind\` text DEFAULT 'figmaToProduction',
  	\`eyebrow\` text,
  	\`title\` text,
  	\`caption\` text,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_diagram_order_idx\` ON \`pages_blocks_diagram\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_diagram_parent_id_idx\` ON \`pages_blocks_diagram\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_diagram_path_idx\` ON \`pages_blocks_diagram\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_diagram_locale_idx\` ON \`pages_blocks_diagram\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_revenue_calculator\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`title\` text,
  	\`intro\` text,
  	\`footnote\` text,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_revenue_calculator_order_idx\` ON \`_pages_v_blocks_revenue_calculator\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_revenue_calculator_parent_id_idx\` ON \`_pages_v_blocks_revenue_calculator\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_revenue_calculator_path_idx\` ON \`_pages_v_blocks_revenue_calculator\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_revenue_calculator_locale_idx\` ON \`_pages_v_blocks_revenue_calculator\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_diagram\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`kind\` text DEFAULT 'figmaToProduction',
  	\`eyebrow\` text,
  	\`title\` text,
  	\`caption\` text,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_diagram_order_idx\` ON \`_pages_v_blocks_diagram\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_diagram_parent_id_idx\` ON \`_pages_v_blocks_diagram\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_diagram_path_idx\` ON \`_pages_v_blocks_diagram\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_diagram_locale_idx\` ON \`_pages_v_blocks_diagram\` (\`_locale\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_revenue_calculator\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_diagram\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_revenue_calculator\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_diagram\`;`)
}
