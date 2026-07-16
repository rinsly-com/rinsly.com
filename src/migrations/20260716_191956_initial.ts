import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_roles\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_roles_order_idx\` ON \`users_roles\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`users_roles_parent_idx\` ON \`users_roles\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`variant\` text DEFAULT 'primary',
  	\`type\` text DEFAULT 'internal',
  	\`page_id\` integer,
  	\`url\` text,
  	\`anchor\` text,
  	\`new_tab\` integer DEFAULT false,
  	FOREIGN KEY (\`page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_buttons_order_idx\` ON \`pages_blocks_hero_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_buttons_parent_id_idx\` ON \`pages_blocks_hero_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_buttons_locale_idx\` ON \`pages_blocks_hero_buttons\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_buttons_page_idx\` ON \`pages_blocks_hero_buttons\` (\`page_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_locale_idx\` ON \`pages_blocks_hero\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_services_cards_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_services_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_cards_features_order_idx\` ON \`pages_blocks_services_cards_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_cards_features_parent_id_idx\` ON \`pages_blocks_services_cards_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_cards_features_locale_idx\` ON \`pages_blocks_services_cards_features\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_services_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`title\` text,
  	\`description\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_services\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_cards_order_idx\` ON \`pages_blocks_services_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_cards_parent_id_idx\` ON \`pages_blocks_services_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_cards_locale_idx\` ON \`pages_blocks_services_cards\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_services\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_order_idx\` ON \`pages_blocks_services\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_parent_id_idx\` ON \`pages_blocks_services\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_path_idx\` ON \`pages_blocks_services\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_services_locale_idx\` ON \`pages_blocks_services\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_pricing_tiers_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`included\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_pricing_tiers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_tiers_features_order_idx\` ON \`pages_blocks_pricing_tiers_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_tiers_features_parent_id_idx\` ON \`pages_blocks_pricing_tiers_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_tiers_features_locale_idx\` ON \`pages_blocks_pricing_tiers_features\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_pricing_tiers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`for\` text,
  	\`price\` text,
  	\`per\` text,
  	\`price_note\` text,
  	\`recommended\` integer DEFAULT false,
  	\`badge\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_pricing\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_tiers_order_idx\` ON \`pages_blocks_pricing_tiers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_tiers_parent_id_idx\` ON \`pages_blocks_pricing_tiers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_tiers_locale_idx\` ON \`pages_blocks_pricing_tiers\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_pricing\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_order_idx\` ON \`pages_blocks_pricing\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_parent_id_idx\` ON \`pages_blocks_pricing\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_path_idx\` ON \`pages_blocks_pricing\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_pricing_locale_idx\` ON \`pages_blocks_pricing\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_cta\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`title\` text,
  	\`text\` text,
  	\`button_label\` text,
  	\`button_variant\` text DEFAULT 'primary',
  	\`button_type\` text DEFAULT 'internal',
  	\`button_page_id\` integer,
  	\`button_url\` text,
  	\`button_anchor\` text,
  	\`button_new_tab\` integer DEFAULT false,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`button_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_order_idx\` ON \`pages_blocks_cta\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_parent_id_idx\` ON \`pages_blocks_cta\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_path_idx\` ON \`pages_blocks_cta\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_locale_idx\` ON \`pages_blocks_cta\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_cta_button_button_page_idx\` ON \`pages_blocks_cta\` (\`button_page_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_contact_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`kind\` text DEFAULT 'text',
  	\`label\` text,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_contact\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_items_order_idx\` ON \`pages_blocks_contact_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_items_parent_id_idx\` ON \`pages_blocks_contact_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_items_locale_idx\` ON \`pages_blocks_contact_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_contact_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`variant\` text DEFAULT 'primary',
  	\`type\` text DEFAULT 'internal',
  	\`page_id\` integer,
  	\`url\` text,
  	\`anchor\` text,
  	\`new_tab\` integer DEFAULT false,
  	FOREIGN KEY (\`page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_contact\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_buttons_order_idx\` ON \`pages_blocks_contact_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_buttons_parent_id_idx\` ON \`pages_blocks_contact_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_buttons_locale_idx\` ON \`pages_blocks_contact_buttons\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_buttons_page_idx\` ON \`pages_blocks_contact_buttons\` (\`page_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_contact\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`show_form\` integer DEFAULT true,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_order_idx\` ON \`pages_blocks_contact\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_parent_id_idx\` ON \`pages_blocks_contact\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_path_idx\` ON \`pages_blocks_contact\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_contact_locale_idx\` ON \`pages_blocks_contact\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_accordion_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_accordion\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_items_order_idx\` ON \`pages_blocks_accordion_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_items_parent_id_idx\` ON \`pages_blocks_accordion_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_items_locale_idx\` ON \`pages_blocks_accordion_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_accordion\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_subtitle\` text,
  	\`header_intro\` text,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_order_idx\` ON \`pages_blocks_accordion\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_parent_id_idx\` ON \`pages_blocks_accordion\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_path_idx\` ON \`pages_blocks_accordion\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_accordion_locale_idx\` ON \`pages_blocks_accordion\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_button_row_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`variant\` text DEFAULT 'primary',
  	\`type\` text DEFAULT 'internal',
  	\`page_id\` integer,
  	\`url\` text,
  	\`anchor\` text,
  	\`new_tab\` integer DEFAULT false,
  	FOREIGN KEY (\`page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_button_row\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_button_row_buttons_order_idx\` ON \`pages_blocks_button_row_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_button_row_buttons_parent_id_idx\` ON \`pages_blocks_button_row_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_button_row_buttons_locale_idx\` ON \`pages_blocks_button_row_buttons\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_button_row_buttons_page_idx\` ON \`pages_blocks_button_row_buttons\` (\`page_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_button_row\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`alignment\` text DEFAULT 'left',
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_button_row_order_idx\` ON \`pages_blocks_button_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_button_row_parent_id_idx\` ON \`pages_blocks_button_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_button_row_path_idx\` ON \`pages_blocks_button_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_button_row_locale_idx\` ON \`pages_blocks_button_row\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_rich_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`content\` text,
  	\`width\` text DEFAULT 'narrow',
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_order_idx\` ON \`pages_blocks_rich_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_parent_id_idx\` ON \`pages_blocks_rich_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_path_idx\` ON \`pages_blocks_rich_text\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_rich_text_locale_idx\` ON \`pages_blocks_rich_text\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages_blocks_note\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`anchor\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_blocks_note_order_idx\` ON \`pages_blocks_note\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_note_parent_id_idx\` ON \`pages_blocks_note\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_note_path_idx\` ON \`pages_blocks_note\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_note_locale_idx\` ON \`pages_blocks_note\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`generate_slug\` integer DEFAULT true,
  	\`slug\` text,
  	\`meta_noindex\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`pages_locales\` (
  	\`title\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_meta_meta_image_idx\` ON \`pages_locales\` (\`meta_image_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`pages_locales_locale_parent_id_unique\` ON \`pages_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`variant\` text DEFAULT 'primary',
  	\`type\` text DEFAULT 'internal',
  	\`page_id\` integer,
  	\`url\` text,
  	\`anchor\` text,
  	\`new_tab\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_hero\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_buttons_order_idx\` ON \`_pages_v_blocks_hero_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_buttons_parent_id_idx\` ON \`_pages_v_blocks_hero_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_buttons_locale_idx\` ON \`_pages_v_blocks_hero_buttons\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_buttons_page_idx\` ON \`_pages_v_blocks_hero_buttons\` (\`page_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_locale_idx\` ON \`_pages_v_blocks_hero\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_services_cards_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_services_cards\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_cards_features_order_idx\` ON \`_pages_v_blocks_services_cards_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_cards_features_parent_id_idx\` ON \`_pages_v_blocks_services_cards_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_cards_features_locale_idx\` ON \`_pages_v_blocks_services_cards_features\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_services_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`title\` text,
  	\`description\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_services\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_cards_order_idx\` ON \`_pages_v_blocks_services_cards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_cards_parent_id_idx\` ON \`_pages_v_blocks_services_cards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_cards_locale_idx\` ON \`_pages_v_blocks_services_cards\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_services\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_order_idx\` ON \`_pages_v_blocks_services\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_parent_id_idx\` ON \`_pages_v_blocks_services\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_path_idx\` ON \`_pages_v_blocks_services\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_services_locale_idx\` ON \`_pages_v_blocks_services\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_pricing_tiers_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`included\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_pricing_tiers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_tiers_features_order_idx\` ON \`_pages_v_blocks_pricing_tiers_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_tiers_features_parent_id_idx\` ON \`_pages_v_blocks_pricing_tiers_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_tiers_features_locale_idx\` ON \`_pages_v_blocks_pricing_tiers_features\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_pricing_tiers\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`for\` text,
  	\`price\` text,
  	\`per\` text,
  	\`price_note\` text,
  	\`recommended\` integer DEFAULT false,
  	\`badge\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_pricing\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_tiers_order_idx\` ON \`_pages_v_blocks_pricing_tiers\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_tiers_parent_id_idx\` ON \`_pages_v_blocks_pricing_tiers\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_tiers_locale_idx\` ON \`_pages_v_blocks_pricing_tiers\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_pricing\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_order_idx\` ON \`_pages_v_blocks_pricing\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_parent_id_idx\` ON \`_pages_v_blocks_pricing\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_path_idx\` ON \`_pages_v_blocks_pricing\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_pricing_locale_idx\` ON \`_pages_v_blocks_pricing\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_cta\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`eyebrow\` text,
  	\`title\` text,
  	\`text\` text,
  	\`button_label\` text,
  	\`button_variant\` text DEFAULT 'primary',
  	\`button_type\` text DEFAULT 'internal',
  	\`button_page_id\` integer,
  	\`button_url\` text,
  	\`button_anchor\` text,
  	\`button_new_tab\` integer DEFAULT false,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`button_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_cta_order_idx\` ON \`_pages_v_blocks_cta\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_cta_parent_id_idx\` ON \`_pages_v_blocks_cta\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_cta_path_idx\` ON \`_pages_v_blocks_cta\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_cta_locale_idx\` ON \`_pages_v_blocks_cta\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_cta_button_button_page_idx\` ON \`_pages_v_blocks_cta\` (\`button_page_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_contact_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`kind\` text DEFAULT 'text',
  	\`label\` text,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_contact\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_items_order_idx\` ON \`_pages_v_blocks_contact_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_items_parent_id_idx\` ON \`_pages_v_blocks_contact_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_items_locale_idx\` ON \`_pages_v_blocks_contact_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_contact_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`variant\` text DEFAULT 'primary',
  	\`type\` text DEFAULT 'internal',
  	\`page_id\` integer,
  	\`url\` text,
  	\`anchor\` text,
  	\`new_tab\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_contact\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_buttons_order_idx\` ON \`_pages_v_blocks_contact_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_buttons_parent_id_idx\` ON \`_pages_v_blocks_contact_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_buttons_locale_idx\` ON \`_pages_v_blocks_contact_buttons\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_buttons_page_idx\` ON \`_pages_v_blocks_contact_buttons\` (\`page_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_contact\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`show_form\` integer DEFAULT true,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_order_idx\` ON \`_pages_v_blocks_contact\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_parent_id_idx\` ON \`_pages_v_blocks_contact\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_path_idx\` ON \`_pages_v_blocks_contact\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_contact_locale_idx\` ON \`_pages_v_blocks_contact\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_accordion_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_accordion\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_items_order_idx\` ON \`_pages_v_blocks_accordion_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_items_parent_id_idx\` ON \`_pages_v_blocks_accordion_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_items_locale_idx\` ON \`_pages_v_blocks_accordion_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_accordion\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_subtitle\` text,
  	\`header_intro\` text,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_order_idx\` ON \`_pages_v_blocks_accordion\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_parent_id_idx\` ON \`_pages_v_blocks_accordion\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_path_idx\` ON \`_pages_v_blocks_accordion\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_accordion_locale_idx\` ON \`_pages_v_blocks_accordion\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_button_row_buttons\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`variant\` text DEFAULT 'primary',
  	\`type\` text DEFAULT 'internal',
  	\`page_id\` integer,
  	\`url\` text,
  	\`anchor\` text,
  	\`new_tab\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_button_row\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_button_row_buttons_order_idx\` ON \`_pages_v_blocks_button_row_buttons\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_button_row_buttons_parent_id_idx\` ON \`_pages_v_blocks_button_row_buttons\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_button_row_buttons_locale_idx\` ON \`_pages_v_blocks_button_row_buttons\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_button_row_buttons_page_idx\` ON \`_pages_v_blocks_button_row_buttons\` (\`page_id\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_button_row\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alignment\` text DEFAULT 'left',
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_button_row_order_idx\` ON \`_pages_v_blocks_button_row\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_button_row_parent_id_idx\` ON \`_pages_v_blocks_button_row\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_button_row_path_idx\` ON \`_pages_v_blocks_button_row\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_button_row_locale_idx\` ON \`_pages_v_blocks_button_row\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_rich_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`header_eyebrow\` text,
  	\`header_title\` text,
  	\`header_intro\` text,
  	\`content\` text,
  	\`width\` text DEFAULT 'narrow',
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_rich_text_order_idx\` ON \`_pages_v_blocks_rich_text\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_rich_text_parent_id_idx\` ON \`_pages_v_blocks_rich_text\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_rich_text_path_idx\` ON \`_pages_v_blocks_rich_text\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_rich_text_locale_idx\` ON \`_pages_v_blocks_rich_text\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_note\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`anchor\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_note_order_idx\` ON \`_pages_v_blocks_note\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_note_parent_id_idx\` ON \`_pages_v_blocks_note\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_note_path_idx\` ON \`_pages_v_blocks_note\` (\`_path\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_note_locale_idx\` ON \`_pages_v_blocks_note\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_generate_slug\` integer DEFAULT true,
  	\`version_slug\` text,
  	\`version_meta_noindex\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_snapshot_idx\` ON \`_pages_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_published_locale_idx\` ON \`_pages_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_pages_v_locales\` (
  	\`version_title\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_pages_v_version_meta_version_meta_image_idx\` ON \`_pages_v_locales\` (\`version_meta_image_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`_pages_v_locales_locale_parent_id_unique\` ON \`_pages_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`offertes_additions\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`offertes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`offertes_additions_order_idx\` ON \`offertes_additions\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`offertes_additions_parent_idx\` ON \`offertes_additions\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`offertes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`bedrijf\` text NOT NULL,
  	\`naam\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`subscription\` text,
  	\`additions_other\` text,
  	\`bericht\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`offertes_updated_at_idx\` ON \`offertes\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`offertes_created_at_idx\` ON \`offertes\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`pages_id\` integer,
  	\`offertes_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`offertes_id\`) REFERENCES \`offertes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_offertes_id_idx\` ON \`payload_locked_documents_rels\` (\`offertes_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`header_nav_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`type\` text DEFAULT 'internal',
  	\`page_id\` integer,
  	\`url\` text,
  	\`anchor\` text,
  	\`new_tab\` integer DEFAULT false,
  	FOREIGN KEY (\`page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_nav_items_order_idx\` ON \`header_nav_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_parent_id_idx\` ON \`header_nav_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_locale_idx\` ON \`header_nav_items\` (\`_locale\`);`)
  await db.run(sql`CREATE INDEX \`header_nav_items_page_idx\` ON \`header_nav_items\` (\`page_id\`);`)
  await db.run(sql`CREATE TABLE \`header\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`logo_id\` integer,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`header_logo_idx\` ON \`header\` (\`logo_id\`);`)
  await db.run(sql`CREATE TABLE \`header_locales\` (
  	\`cta_label\` text,
  	\`cta_type\` text DEFAULT 'internal',
  	\`cta_page_id\` integer,
  	\`cta_url\` text,
  	\`cta_anchor\` text,
  	\`cta_new_tab\` integer DEFAULT false,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`cta_page_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`header\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`header_cta_cta_page_idx\` ON \`header_locales\` (\`cta_page_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`header_locales_locale_parent_id_unique\` ON \`header_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`footer_menu_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_menu_items_order_idx\` ON \`footer_menu_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_menu_items_parent_id_idx\` ON \`footer_menu_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`footer_menu_items_locale_idx\` ON \`footer_menu_items\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`footer_info_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_info_links_order_idx\` ON \`footer_info_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_info_links_parent_id_idx\` ON \`footer_info_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`footer_info_links_locale_idx\` ON \`footer_info_links\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`footer\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`logo_id\` integer,
  	\`email\` text,
  	\`phone\` text,
  	\`address\` text,
  	\`kvk\` text,
  	\`btw\` text,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_logo_idx\` ON \`footer\` (\`logo_id\`);`)
  await db.run(sql`CREATE TABLE \`footer_locales\` (
  	\`tagline\` text,
  	\`copyright\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`footer_locales_locale_parent_id_unique\` ON \`footer_locales\` (\`_locale\`,\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_roles\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero_buttons\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_services_cards_features\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_services_cards\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_services\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_pricing_tiers_features\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_pricing_tiers\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_pricing\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_cta\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_contact_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_contact_buttons\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_contact\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_accordion_items\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_accordion\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_button_row_buttons\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_button_row\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_note\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
  await db.run(sql`DROP TABLE \`pages_locales\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_buttons\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_services_cards_features\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_services_cards\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_services\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_pricing_tiers_features\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_pricing_tiers\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_pricing\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_cta\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_contact_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_contact_buttons\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_contact\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_accordion_items\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_accordion\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_button_row_buttons\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_button_row\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_rich_text\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_note\`;`)
  await db.run(sql`DROP TABLE \`_pages_v\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_locales\`;`)
  await db.run(sql`DROP TABLE \`offertes_additions\`;`)
  await db.run(sql`DROP TABLE \`offertes\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`header_nav_items\`;`)
  await db.run(sql`DROP TABLE \`header\`;`)
  await db.run(sql`DROP TABLE \`header_locales\`;`)
  await db.run(sql`DROP TABLE \`footer_menu_items\`;`)
  await db.run(sql`DROP TABLE \`footer_info_links\`;`)
  await db.run(sql`DROP TABLE \`footer\`;`)
  await db.run(sql`DROP TABLE \`footer_locales\`;`)
}
