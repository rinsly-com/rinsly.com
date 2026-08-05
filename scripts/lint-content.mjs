#!/usr/bin/env node
/**
 * Ban em dashes from anything the visitor reads.
 *
 * An em dash (`—`, U+2014) is the single most recognisable tell of machine-written
 * copy, and Rinsly's whole positioning is that it writes plainly and in specifics.
 * So this is not a style nit: a page full of them undercuts the pitch.
 *
 * It runs as part of `pnpm seed`, which is the one door all site content goes
 * through, so offending copy cannot reach the CMS in the first place. Run it on its
 * own with `pnpm lint:content`.
 *
 * Rewrite instead of substituting a look-alike: a comma, a colon, a full stop or
 * brackets almost always reads better anyway. En dashes (`–`) are left alone
 * because they are legitimate in numeric ranges (`€49–€499`), but using one as
 * sentence punctuation is the same mistake wearing a smaller hat.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const EM_DASH = '—'

/**
 * Escaped spellings count too. A string written as `\u2014` or `&mdash;` renders
 * as an em dash for the visitor while looking innocent in the source, which is
 * exactly how eleven of them survived the first sweep of this repo.
 */
const ESCAPES = [/\\u2014/g, /&mdash;/g, /&#8212;/g, /&#x2014;/gi]

/** Files whose strings are read by a visitor. Not a whole-repo sweep. */
const TARGETS = [
  'scripts/seed.ts',
  'src/site.config.ts',
  'src/components/OfferteForm.tsx',
  'src/components/custom',
  'src/components/check',
  'src/components/partner',
  'src/app/(frontend)',
  'src/blocks',
  'src/collections',
  'src/endpoints',
]

const EXT = /\.(ts|tsx|mjs|md)$/

function walk(path, out = []) {
  const abs = join(ROOT, path)
  let st
  try {
    st = statSync(abs)
  } catch {
    return out
  }
  if (st.isDirectory()) {
    for (const entry of readdirSync(abs)) walk(join(path, entry), out)
  } else if (EXT.test(path)) {
    out.push(path)
  }
  return out
}

const files = TARGETS.flatMap((t) => walk(t))
const hits = []

for (const file of files) {
  const lines = readFileSync(join(ROOT, file), 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (!line.includes(EM_DASH) && !ESCAPES.some((re) => re.test(line))) return
    // Comments are exempt: the rule is about what a visitor reads, and the files
    // that explain the rule have to be able to name the character. Strip every
    // comment form first (block, JSX, and a trailing `//`) rather than only
    // recognising a comment that starts the line.
    const code = line
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/, '$1')
      .replace(/^\s*\*.*$/, '')
    const normalised = ESCAPES.reduce((acc, re) => acc.replace(re, EM_DASH), code)
    if (!normalised.includes(EM_DASH)) return
    hits.push({ file, line: i + 1, text: line.trim() })
  })
}

if (hits.length === 0) {
  console.log(`✔ Content lint passed: no em dashes in ${files.length} file(s).`)
  process.exit(0)
}

console.error(`✖ Content lint failed: ${hits.length} em dash(es) in visitor-facing copy.\n`)
for (const hit of hits) {
  const col = hit.text.indexOf(EM_DASH)
  console.error(`  ${relative('.', hit.file)}:${hit.line}`)
  console.error(`    ${hit.text.slice(0, 150)}`)
  console.error(`    ${' '.repeat(Math.max(0, Math.min(col, 150)))}^ replace with a comma, colon, full stop or brackets\n`)
}
console.error('Em dashes read as machine-written. Rewrite the sentence instead of')
console.error('swapping in a look-alike character.')
process.exit(1)
