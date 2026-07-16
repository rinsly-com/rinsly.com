# Upstream bug report draft: `migrate:create` generates a data-corrupting copy statement (SQLite/D1)

Status: **draft — not yet filed**. File against [payloadcms/payload](https://github.com/payloadcms/payload/issues)
(adapter `@payloadcms/db-d1-sqlite`, generation happens in the drizzle-kit layer).
Observed with `payload` 3.85.2 / `@payloadcms/db-d1-sqlite` 3.85.2.

## Summary

When a SQLite migration requires a table recreation (e.g. a column changes to
`NOT NULL`) **and** the same change-set adds new columns to that table,
`payload migrate:create` emits a recreate-and-copy whose `INSERT ... SELECT`
selects the **new** table's column list from the **old** table:

```sql
CREATE TABLE `__new_header_nav_items` (
  `_order` integer NOT NULL,
  `_parent_id` integer NOT NULL,
  `id` text PRIMARY KEY NOT NULL,
  `label` text NOT NULL,            -- changed: was nullable
  `type` text DEFAULT 'internal',   -- new column
  `page_id` integer,                -- new column
  `url` text,
  `new_tab` integer DEFAULT false   -- new column
);
INSERT INTO `__new_header_nav_items`("_order", "_parent_id", "id", "label", "type", "page_id", "url", "new_tab")
  SELECT "_order", "_parent_id", "id", "label", "type", "page_id", "url", "new_tab"
  FROM `header_nav_items`;          -- ← old table has NO type/page_id/new_tab
```

## Why this is severe

`"type"`, `"page_id"` and `"new_tab"` do not exist in the old table, so SQLite's
[double-quoted-string misfeature](https://sqlite.org/quirks.html#dblquote) kicks
in: each unknown double-quoted identifier is silently treated as a **string
literal**. The migration does not fail — it fills every copied row with the
literal strings `'type'`, `'page_id'`, `'new_tab'`.

Depending on constraints it either corrupts data silently, or (with a FK on the
new column) fails **mid-migration** — and D1 migrations are not transactional,
so production is left half-migrated.

## Reproduction

1. Payload 3 project with `sqliteD1Adapter`, a collection/global with an array
   field containing `{ name: 'label', type: 'text' }` (nullable) and
   `{ name: 'url', type: 'text' }`; create the initial migration.
2. Change `label` to `required: true` and add a `type` select, a `page`
   relationship, and a `newTab` checkbox to the same array.
3. Run `payload migrate:create` and inspect the `INSERT ... SELECT`: the SELECT
   list references the newly added columns from the old table.

## Expected

The copy should select only columns that exist in the old table and supply
defaults for new ones, e.g.:

```sql
INSERT INTO `__new_header_nav_items`("_order", "_parent_id", "id", "label", "type", "page_id", "url", "new_tab")
  SELECT "_order", "_parent_id", "id", COALESCE("label", ''), 'internal', NULL, "url", false
  FROM `header_nav_items`;
```

## Local mitigation (this repo)

- `scripts/lint-migrations.mjs` statically replays every migration against the
  drizzle snapshots and fails the deploy on unknown quoted identifiers
  (`pnpm lint:migrations`, wired into `deploy:database`).
- `tests/int/migration-replay.int.spec.ts` replays all migrations on a scratch
  local D1 with seeded rows and asserts the data survives.
