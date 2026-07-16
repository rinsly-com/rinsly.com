// @vitest-environment node
// Unit tests for the migration linter (scripts/lint-migrations.mjs), plus a
// project-level test that lints the real migrations in src/migrations.
import path from 'path'
import { fileURLToPath } from 'url'

import { describe, expect, it } from 'vitest'

import {
  applyStatement,
  extractSqlTemplates,
  lintProject,
  replayStatements,
  schemaFromSnapshot,
} from '../../scripts/lint-migrations.mjs'

const dirname = path.dirname(fileURLToPath(import.meta.url))

type Finding = { severity: 'critical' | 'error' | 'unchecked'; message: string }

const navItemsSchema = () =>
  new Map([
    ['header_nav_items', new Set(['_order', '_parent_id', 'id', 'label', 'url'])],
    ['__new_header_nav_items', new Set(['_order', '_parent_id', 'id', 'label', 'type', 'page_id', 'url', 'new_tab'])],
  ])

describe('migration linter — INSERT ... SELECT copy validation', () => {
  it('flags the drizzle-kit recreate-and-copy bug as CRITICAL per bad column', () => {
    // The exact statement `payload migrate:create` generated: SELECTing the
    // NEW table's columns from the OLD table (which only has label + url).
    const buggy =
      'INSERT INTO `__new_header_nav_items`("_order", "_parent_id", "id", "label", "type", "page_id", "url", "new_tab") ' +
      'SELECT "_order", "_parent_id", "id", "label", "type", "page_id", "url", "new_tab" FROM `header_nav_items`'

    const findings: Finding[] = applyStatement(navItemsSchema(), buggy)
    const critical = findings.filter((f) => f.severity === 'critical')

    expect(critical).toHaveLength(3)
    expect(critical.map((f) => f.message).join('\n')).toContain('"type"')
    expect(critical.map((f) => f.message).join('\n')).toContain('"page_id"')
    expect(critical.map((f) => f.message).join('\n')).toContain('"new_tab"')
    // The message must explain the silent-literal trap, not just name the column.
    expect(critical[0].message).toMatch(/string literal/)
  })

  it('accepts the hand-fixed copy (COALESCE + explicit literals)', () => {
    const fixed =
      'INSERT INTO `__new_header_nav_items`("_order", "_parent_id", "id", "label", "type", "page_id", "url", "new_tab") ' +
      "SELECT \"_order\", \"_parent_id\", \"id\", COALESCE(\"label\", ''), 'external', NULL, \"url\", false FROM `header_nav_items`"

    expect(applyStatement(navItemsSchema(), fixed)).toHaveLength(0)
  })

  it('flags a target/select column-count mismatch', () => {
    const mismatched =
      'INSERT INTO `__new_header_nav_items`("_order", "_parent_id", "id") SELECT "_order", "_parent_id" FROM `header_nav_items`'

    const findings: Finding[] = applyStatement(navItemsSchema(), mismatched)
    expect(findings.some((f) => f.message.includes('3 target column(s) but 2 SELECT'))).toBe(true)
  })

  it('does not mistake single-quoted string contents for identifiers', () => {
    const stmt = `UPDATE \`header_nav_items\` SET \`url\` = 'see "docs" here' WHERE \`label\` <> ''`
    expect(applyStatement(navItemsSchema(), stmt)).toHaveLength(0)
  })

  it('flags an UPDATE touching a nonexistent column', () => {
    const stmt = 'UPDATE `header_nav_items` SET `missing_col` = 1'
    const findings: Finding[] = applyStatement(navItemsSchema(), stmt)
    expect(findings.some((f) => f.severity === 'error')).toBe(true)
  })
})

describe('migration linter — schema replay', () => {
  it('tracks CREATE/ALTER/DROP so later statements see the evolved schema', () => {
    const schema = new Map<string, Set<string>>()
    const { findings } = replayStatements(schema, [
      'CREATE TABLE `a` (`id` integer PRIMARY KEY NOT NULL, `name` text)',
      'ALTER TABLE `a` ADD `extra` text',
      'ALTER TABLE `a` RENAME TO `b`',
      'CREATE INDEX `b_extra_idx` ON `b` (`extra`)',
      'INSERT INTO `b`("id", "name", "extra") SELECT "id", "name", "extra" FROM `b`',
    ])
    expect(findings).toHaveLength(0)
    expect([...schema.keys()]).toEqual(['b'])
  })

  it('reports statements it cannot parse as unchecked instead of passing them', () => {
    const findings: Finding[] = applyStatement(new Map(), 'CREATE VIEW v AS SELECT 1')
    expect(findings).toEqual([expect.objectContaining({ severity: 'unchecked' })])
  })

  it('extracts SQL from sql`...` templates with escaped backticks', () => {
    const chunk = 'await db.run(sql`CREATE TABLE \\`x\\` (\\`id\\` integer);`)'
    expect(extractSqlTemplates(chunk)).toEqual(['CREATE TABLE `x` (`id` integer);'])
  })

  it('builds a schema model from a drizzle snapshot', () => {
    const schema = schemaFromSnapshot({
      tables: { t: { name: 't', columns: { id: { name: 'id' }, label: { name: 'label' } } } },
    })
    expect([...schema.get('t')!]).toEqual(['id', 'label'])
  })
})

describe('migration linter — this repository', () => {
  it('lints src/migrations with zero errors and full statement coverage', () => {
    const result = lintProject(path.resolve(dirname, '../../src/migrations'))
    expect(result.errors).toEqual([])
    // Zero warnings means every statement was understood AND the replayed
    // schema matched each snapshot exactly — keep it that way.
    expect(result.warnings).toEqual([])
    expect(result.checked).toBeGreaterThan(0)
  })
})
