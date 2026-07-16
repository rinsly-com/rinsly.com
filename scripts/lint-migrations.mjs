/**
 * Migration linter for the generated D1/SQLite migrations in src/migrations.
 *
 * Why this exists: Payload's `migrate:create` (drizzle-kit) has produced a
 * table-recreate copy statement that SELECTed columns which only exist in the
 * NEW table from the OLD table. SQLite then hits its double-quoted-string
 * misfeature (https://sqlite.org/quirks.html#dblquote): an unknown
 * double-quoted identifier is silently treated as a string literal, so instead
 * of failing, every row is filled with the literal column name. D1 migrations
 * are not transactional, so the alternative failure mode is a half-applied
 * migration in production.
 *
 * What it does, per migration and per direction (up/down):
 *   1. Builds the schema as of the migration's starting point from the
 *      neighbouring drizzle snapshot (.json next to each migration).
 *   2. Replays every SQL statement against that schema model (CREATE/DROP/
 *      ALTER TABLE, CREATE INDEX, INSERT, UPDATE, DELETE).
 *   3. Flags any quoted identifier that does not exist at that point —
 *      double-quoted ones as CRITICAL (silent literal), backtick ones as
 *      ERROR (loud failure mid-deploy).
 *   4. After replaying, diffs the resulting schema model against the
 *      migration's own snapshot to catch generator drift.
 *
 * Also verifies that every migration file has a snapshot and is registered in
 * src/migrations/index.ts in filename order.
 *
 * The parser targets the shape of generated migrations (single statements per
 * db.run(sql`...`), quoted identifiers, no template interpolation). Statements
 * it does not understand are reported as "unchecked" and downgrade the final
 * snapshot diff to a warning instead of an error.
 *
 * Usage: node scripts/lint-migrations.mjs [migrationsDir]
 * Exits non-zero when any CRITICAL/ERROR finding exists.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

// ---------------------------------------------------------------------------
// Small SQL-text helpers (quote- and paren-aware)
// ---------------------------------------------------------------------------

/** Strip backticks, double quotes or [brackets] from an identifier token. */
export function stripIdent(token) {
  const t = token.trim()
  if (
    (t.startsWith('`') && t.endsWith('`')) ||
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith('[') && t.endsWith(']'))
  ) {
    return t.slice(1, -1)
  }
  return t
}

/** First identifier-ish token of a string ("`col` text NOT NULL" → "col"). */
function firstToken(text) {
  const m = text.trim().match(/^(`[^`]*`|"[^"]*"|\[[^\]]*\]|\S+)/)
  return m ? stripIdent(m[1]) : ''
}

/**
 * Split `text` on `sep` (a single character) at paren depth 0, ignoring
 * separators inside single-quoted strings, double-quoted or backtick-quoted
 * identifiers.
 */
export function topLevelSplit(text, sep) {
  const parts = []
  let depth = 0
  let quote = null
  let current = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      current += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch
      current += ch
    } else if (ch === '(') {
      depth++
      current += ch
    } else if (ch === ')') {
      depth--
      current += ch
    } else if (ch === sep && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) parts.push(current)
  return parts
}

/** Index of the last top-level " FROM " keyword, or -1. */
function lastTopLevelFrom(text) {
  let depth = 0
  let quote = null
  let last = -1
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (depth === 0 && /[fF]/.test(ch) && /\bFROM\b/i.test(text.slice(i, i + 4))) {
      // word boundary on the left too
      if (i === 0 || /[\s,()]/.test(text[i - 1])) last = i
    }
  }
  return last
}

/** All double-quoted and backtick-quoted identifiers in a SQL fragment. */
export function quotedIdents(text) {
  // Remove single-quoted string literals first so their contents never match.
  const withoutLiterals = text.replace(/'(?:[^']|'')*'/g, "''")
  return {
    doubleQuoted: [...withoutLiterals.matchAll(/"([^"]*)"/g)].map((m) => m[1]),
    backtick: [...withoutLiterals.matchAll(/`([^`]*)`/g)].map((m) => m[1]),
  }
}

// ---------------------------------------------------------------------------
// Migration file parsing
// ---------------------------------------------------------------------------

/** Extract the raw SQL strings from every sql`...` template in a JS/TS chunk. */
export function extractSqlTemplates(sourceChunk) {
  const templates = []
  const re = /sql`((?:\\.|[^`\\])*)`/g
  for (const match of sourceChunk.matchAll(re)) {
    // Unescape \` and \\ (the only escapes generated migrations contain).
    templates.push(match[1].replace(/\\(.)/g, '$1'))
  }
  return templates
}

/** Split a migration source file into its up() and down() chunks. */
export function splitUpDown(source) {
  const upIdx = source.search(/export\s+async\s+function\s+up\b/)
  const downIdx = source.search(/export\s+async\s+function\s+down\b/)
  if (upIdx === -1) return { up: '', down: downIdx === -1 ? '' : source.slice(downIdx) }
  if (downIdx === -1) return { up: source.slice(upIdx), down: '' }
  return upIdx < downIdx
    ? { up: source.slice(upIdx, downIdx), down: source.slice(downIdx) }
    : { up: source.slice(upIdx), down: source.slice(downIdx, upIdx) }
}

/** Split a sql`` template into individual statements (they may hold several). */
export function splitStatements(sqlText) {
  return topLevelSplit(sqlText, ';')
    .map((s) => s.trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Schema model + statement replay
// ---------------------------------------------------------------------------

/** Map<tableName, Set<columnName>> from a drizzle snapshot JSON. */
export function schemaFromSnapshot(snapshot) {
  const schema = new Map()
  for (const table of Object.values(snapshot.tables ?? {})) {
    schema.set(table.name, new Set(Object.keys(table.columns ?? {})))
  }
  return schema
}

const CONSTRAINT_KEYWORD = /^(FOREIGN|PRIMARY|UNIQUE|CHECK|CONSTRAINT)\b/i

function parseCreateTable(stmt) {
  const m = stmt.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(`[^`]*`|"[^"]*"|\S+)\s*\(/i)
  if (!m) return null
  const open = stmt.indexOf('(')
  const close = stmt.lastIndexOf(')')
  if (open === -1 || close <= open) return null
  const columns = topLevelSplit(stmt.slice(open + 1, close), ',')
    .map((part) => part.trim())
    .filter((part) => part && !CONSTRAINT_KEYWORD.test(part))
    .map((part) => firstToken(part))
  return { name: stripIdent(m[1]), columns }
}

/**
 * Replay one statement against the schema model. Mutates `schema`; returns a
 * list of findings: { severity: 'critical'|'error'|'unchecked', message }.
 */
export function applyStatement(schema, stmt) {
  const findings = []
  const fail = (severity, message) => findings.push({ severity, message })
  const excerpt = stmt.replace(/\s+/g, ' ').slice(0, 110)

  const requireTable = (name, role) => {
    if (!schema.has(name)) {
      fail('error', `${role} table \`${name}\` does not exist at this point. [${excerpt}]`)
      return null
    }
    return schema.get(name)
  }

  const checkColumnRefs = (fragment, table, cols, role) => {
    const { doubleQuoted, backtick } = quotedIdents(fragment)
    for (const ident of doubleQuoted) {
      if (!cols.has(ident)) {
        fail(
          'critical',
          `${role} references "${ident}" which is not a column of \`${table}\` ` +
            `(columns: ${[...cols].join(', ')}). SQLite silently treats an unknown ` +
            `double-quoted identifier as the string literal '${ident}' — this corrupts ` +
            `data instead of failing. [${excerpt}]`,
        )
      }
    }
    for (const ident of backtick) {
      if (!cols.has(ident)) {
        fail(
          'error',
          `${role} references \`${ident}\` which is not a column of \`${table}\` ` +
            `(columns: ${[...cols].join(', ')}) — this fails mid-migration, and D1 ` +
            `migrations are not transactional. [${excerpt}]`,
        )
      }
    }
  }

  let m

  // --- statements that only mutate the model ------------------------------
  const created = /^CREATE\s+TABLE/i.test(stmt) ? parseCreateTable(stmt) : null
  if (created) {
    schema.set(created.name, new Set(created.columns))
    return findings
  }
  if ((m = stmt.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(`[^`]*`|"[^"]*"|\S+)/i))) {
    const name = stripIdent(m[1])
    if (requireTable(name, 'DROP TABLE')) schema.delete(name)
    return findings
  }
  if (
    (m = stmt.match(
      /^ALTER\s+TABLE\s+(`[^`]*`|"[^"]*"|\S+)\s+RENAME\s+TO\s+(`[^`]*`|"[^"]*"|\S+)/i,
    ))
  ) {
    const from = stripIdent(m[1])
    const to = stripIdent(m[2])
    const cols = requireTable(from, 'ALTER TABLE RENAME')
    if (cols) {
      schema.delete(from)
      schema.set(to, cols)
    }
    return findings
  }
  if (
    (m = stmt.match(
      /^ALTER\s+TABLE\s+(`[^`]*`|"[^"]*"|\S+)\s+RENAME\s+COLUMN\s+(`[^`]*`|"[^"]*"|\S+)\s+TO\s+(`[^`]*`|"[^"]*"|\S+)/i,
    ))
  ) {
    const cols = requireTable(stripIdent(m[1]), 'ALTER TABLE RENAME COLUMN')
    if (cols) {
      const from = stripIdent(m[2])
      if (!cols.has(from)) fail('error', `RENAME COLUMN: no column \`${from}\`. [${excerpt}]`)
      cols.delete(from)
      cols.add(stripIdent(m[3]))
    }
    return findings
  }
  if (
    (m = stmt.match(
      /^ALTER\s+TABLE\s+(`[^`]*`|"[^"]*"|\S+)\s+DROP\s+COLUMN\s+(`[^`]*`|"[^"]*"|\S+)/i,
    ))
  ) {
    const cols = requireTable(stripIdent(m[1]), 'ALTER TABLE DROP COLUMN')
    if (cols) {
      const col = stripIdent(m[2])
      if (!cols.has(col)) fail('error', `DROP COLUMN: no column \`${col}\`. [${excerpt}]`)
      cols.delete(col)
    }
    return findings
  }
  if (
    (m = stmt.match(
      /^ALTER\s+TABLE\s+(`[^`]*`|"[^"]*"|\S+)\s+ADD\s+(?:COLUMN\s+)?(`[^`]*`|"[^"]*"|\S+)/i,
    ))
  ) {
    const cols = requireTable(stripIdent(m[1]), 'ALTER TABLE ADD')
    if (cols) cols.add(stripIdent(m[2]))
    return findings
  }

  // --- statements that read/write data ------------------------------------
  if (
    (m = stmt.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?\S+\s+ON\s+(`[^`]*`|"[^"]*"|\S+)\s*\(([^)]*)\)/i))
  ) {
    const table = stripIdent(m[1])
    const cols = requireTable(table, 'CREATE INDEX')
    if (cols) {
      for (const raw of topLevelSplit(m[2], ',')) {
        const col = firstToken(raw)
        if (col && !cols.has(col)) {
          fail('error', `CREATE INDEX on \`${table}\`: no column \`${col}\`. [${excerpt}]`)
        }
      }
    }
    return findings
  }
  if (/^DROP\s+INDEX/i.test(stmt) || /^PRAGMA/i.test(stmt)) return findings

  if (
    (m = stmt.match(
      /^INSERT\s+INTO\s+(`[^`]*`|"[^"]*"|\S+)\s*\(([^)]*)\)\s*(SELECT[\s\S]*|VALUES[\s\S]*)$/i,
    ))
  ) {
    const target = stripIdent(m[1])
    const targetCols = topLevelSplit(m[2], ',').map((c) => stripIdent(c.trim()))
    const tail = m[3]
    const cols = requireTable(target, 'INSERT INTO')
    if (cols) {
      for (const col of targetCols) {
        if (!cols.has(col)) {
          fail('error', `INSERT INTO \`${target}\`: no column \`${col}\`. [${excerpt}]`)
        }
      }
    }
    if (/^SELECT/i.test(tail)) {
      const fromIdx = lastTopLevelFrom(tail)
      if (fromIdx === -1) {
        fail('unchecked', `INSERT ... SELECT without parsable FROM. [${excerpt}]`)
        return findings
      }
      const selectList = tail.slice('SELECT'.length, fromIdx)
      const sourceRest = tail.slice(fromIdx + 'FROM'.length).trim()
      const source = stripIdent(firstToken(sourceRest))
      const sourceCols = requireTable(source, 'INSERT ... SELECT source')
      const exprs = topLevelSplit(selectList, ',')
      if (exprs.length !== targetCols.length) {
        fail(
          'error',
          `INSERT INTO \`${target}\`: ${targetCols.length} target column(s) but ` +
            `${exprs.length} SELECT expression(s). [${excerpt}]`,
        )
      }
      if (sourceCols) {
        // The core check for the drizzle-kit recreate-and-copy bug: every
        // quoted identifier in the SELECT list must exist in the SOURCE table.
        checkColumnRefs(selectList, source, sourceCols, `INSERT ... SELECT list`)
        if (/\bWHERE\b/i.test(sourceRest)) {
          checkColumnRefs(
            sourceRest.replace(/^\S+\s*/, ''),
            source,
            sourceCols,
            'INSERT ... SELECT WHERE clause',
          )
        }
      }
    }
    return findings
  }

  if ((m = stmt.match(/^UPDATE\s+(`[^`]*`|"[^"]*"|\S+)\s+SET\s+([\s\S]*)$/i))) {
    const table = stripIdent(m[1])
    const cols = requireTable(table, 'UPDATE')
    if (cols) checkColumnRefs(m[2], table, cols, 'UPDATE')
    return findings
  }

  if ((m = stmt.match(/^DELETE\s+FROM\s+(`[^`]*`|"[^"]*"|\S+)/i))) {
    requireTable(stripIdent(m[1]), 'DELETE FROM')
    return findings
  }

  fail('unchecked', `Statement type not understood by the linter. [${excerpt}]`)
  return findings
}

/** Replay a list of statements; returns { findings, schema } (schema mutated). */
export function replayStatements(schema, statements) {
  const findings = []
  statements.forEach((stmt, i) => {
    for (const finding of applyStatement(schema, stmt)) {
      findings.push({ ...finding, statementIndex: i })
    }
  })
  return { findings, schema }
}

/** Diff the replayed schema model against a snapshot-derived schema. */
export function diffSchemas(actual, expected) {
  const problems = []
  for (const [table, cols] of expected) {
    if (!actual.has(table)) {
      problems.push(`table \`${table}\` missing after replay`)
      continue
    }
    const actualCols = actual.get(table)
    for (const col of cols) {
      if (!actualCols.has(col)) problems.push(`\`${table}\`.\`${col}\` missing after replay`)
    }
    for (const col of actualCols) {
      if (!cols.has(col)) problems.push(`\`${table}\`.\`${col}\` unexpected after replay`)
    }
  }
  for (const table of actual.keys()) {
    if (!expected.has(table)) problems.push(`table \`${table}\` unexpected after replay`)
  }
  return problems
}

// ---------------------------------------------------------------------------
// Project-level lint
// ---------------------------------------------------------------------------

/**
 * Lint every migration in `migrationsDir`. Returns
 * { errors: string[], warnings: string[], checked: number }.
 */
export function lintProject(migrationsDir) {
  const errors = []
  const warnings = []
  let checked = 0

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .sort()

  // Every migration must be registered in index.ts, in the same order.
  const indexPath = path.join(migrationsDir, 'index.ts')
  if (fs.existsSync(indexPath)) {
    const indexSource = fs.readFileSync(indexPath, 'utf8')
    const registered = [...indexSource.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
    const expected = files.map((f) => f.replace(/\.ts$/, ''))
    for (const name of expected) {
      if (!registered.includes(name)) {
        errors.push(`index.ts: migration ${name} is not registered — it would silently never run`)
      }
    }
    const known = registered.filter((name) => expected.includes(name))
    if (known.join('|') !== expected.join('|')) {
      errors.push(
        `index.ts: migrations registered out of filename order (${known.join(', ')})`,
      )
    }
  } else {
    errors.push('index.ts missing from migrations directory')
  }

  // Replay each migration between its neighbouring snapshots.
  let prevSchemaSource = null // snapshot JSON of the previous migration
  for (const file of files) {
    const name = file.replace(/\.ts$/, '')
    const snapshotPath = path.join(migrationsDir, `${name}.json`)
    if (!fs.existsSync(snapshotPath)) {
      errors.push(`${name}: missing drizzle snapshot ${name}.json`)
      continue
    }
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
    const source = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    if (/\$\{/.test(source)) {
      warnings.push(`${name}: contains template interpolation — linted partially`)
    }
    const { up, down } = splitUpDown(source)

    const directions = [
      // up() starts from the previous snapshot and must land on this one.
      { label: 'up', chunk: up, start: prevSchemaSource, end: snapshot },
      // down() starts from this snapshot and must land back on the previous.
      { label: 'down', chunk: down, start: snapshot, end: prevSchemaSource },
    ]

    for (const { label, chunk, start, end } of directions) {
      if (!chunk) continue
      const schema = start ? schemaFromSnapshot(start) : new Map()
      const statements = extractSqlTemplates(chunk).flatMap(splitStatements)
      checked += statements.length
      const { findings } = replayStatements(schema, statements)
      let unchecked = 0
      for (const finding of findings) {
        const where = `${name} ${label}() stmt #${finding.statementIndex + 1}`
        if (finding.severity === 'critical') {
          errors.push(`CRITICAL ${where}: ${finding.message}`)
        } else if (finding.severity === 'error') {
          errors.push(`${where}: ${finding.message}`)
        } else {
          unchecked++
          warnings.push(`${where}: ${finding.message}`)
        }
      }
      const expectedSchema = end ? schemaFromSnapshot(end) : new Map()
      const drift = diffSchemas(schema, expectedSchema)
      for (const problem of drift) {
        const message = `${name} ${label}(): schema drift vs snapshot — ${problem}`
        // With statements the linter didn't understand, the model is
        // incomplete, so drift is only advisory.
        if (unchecked > 0) warnings.push(message)
        else errors.push(message)
      }
    }

    prevSchemaSource = snapshot
  }

  return { errors, warnings, checked }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href

if (isMain) {
  const dir = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/migrations')

  const { errors, warnings, checked } = lintProject(dir)
  for (const warning of warnings) console.warn(`⚠ ${warning}`)
  for (const error of errors) console.error(`✘ ${error}`)
  if (errors.length > 0) {
    console.error(`\n✘ Migration lint failed: ${errors.length} error(s), ${warnings.length} warning(s).`)
    process.exit(1)
  }
  console.log(
    `✔ Migration lint passed: ${checked} statement(s) replayed, ${warnings.length} warning(s).`,
  )
}
