/**
 * Redesign round v8 (27 Nov 2026): the v6 first-screen dedupe (CHANGE-TABLE)
 * and the v8 frames, applied to the v5 drafts of home, prijzen and
 * partnerprogramma (NL + EN). Used by migration
 * 20261127_225300_redesign_v8_content and by the publish manifest
 * (publish.ts). Approved as drafts only by Yaron on 27 Nov 2026 23:45
 * ("Yes, send v8 and the text fixes to Builder as drafts, no publish").
 *
 * `buildV8Page` is pure: it takes the v5 draft of a page-locale (as migration
 * 20261127_200500_redesign_v5_content writes it) and returns the v8 draft.
 * Every field it changes is compare-and-set against the v5 value (edit.ts
 * setField); a v5 draft that is not exactly what 200500 wrote throws, so the
 * transform can never paper over a changed base.
 *
 * Safety rules (the same as redesignV5.ts):
 *  - Whole-document compare-and-set per page-locale. Up writes only when the
 *    latest draft is exactly the v5 draft (no person edited it since 200500);
 *    down only when it is exactly the v8 draft and the v8 draft was never
 *    published. Anything else is skipped and logged, never overwritten.
 *  - Drafts only (`_status: 'draft'`, `draft: true`). Nothing is published.
 *  - Page lookup fails closed (duplicate slug, tenant field) before any read.
 *  - Every target is computed before the first write.
 */
import type { Payload, PayloadRequest } from 'payload'

import { V5 } from './copyV5'
import { V8, label } from './copyV8'
import { EditLog, type Json, type Obj, sameValue } from './edit'
import type { Locale, PageDoc } from './pages'
import { V5_SLUGS, type V5Slug, v5Id, v5Page } from './redesignV5'
import { fromSlugRefs, toSlugRefs } from './refs'
import { pageIds } from './run'

/** The pages v8 changes: the same three as v5. Contact is never read or written. */
export const V8_SLUGS = V5_SLUGS
export type V8Slug = V5Slug
const LOCALES: Locale[] = ['nl', 'en']

/** Deterministic ids for rows that are new in v8. */
export const v8Id = (locale: Locale, name: string): string => `v8-20261127-${locale}-${name}`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value)

function block(doc: PageDoc, id: string): Obj {
  const found = doc.layout.filter((b): b is Obj => isObj(b) && b.id === id)
  if (found.length !== 1) throw new Error(`[redesign-v8] expected one block ${id} in the v5 draft, found ${String(found.length)}`)
  return found[0]
}
const child = (holder: Obj, key: string): Obj => {
  const value = holder[key]
  if (!isObj(value)) throw new Error(`[redesign-v8] ${key} is not an object in the v5 draft`)
  return value
}
const row = (list: Json | undefined, id: string): Obj => {
  const found = Array.isArray(list) ? list.find((item) => isObj(item) && item.id === id) : undefined
  if (!isObj(found)) throw new Error(`[redesign-v8] row ${id} missing in the v5 draft`)
  return found
}

/**
 * Compare-and-set one field (edit.ts setField semantics), where a missing key,
 * null and '' all count as "not set" (a field that is new in v8 is absent from
 * the v5 draft, and D1 reads it back as null).
 */
function setField(log: EditLog, where: string, holder: Obj, key: string, expected: Json, next: Json): void {
  const same = (a: Json | undefined, b: Json) => sameValue({ v: a }, { v: b })
  if (same(holder[key], next)) return
  if (!same(holder[key], expected)) {
    log.conflict(`${where}.${key}`, `expected ${JSON.stringify(expected)}, found ${JSON.stringify(holder[key] ?? null)}`)
    return
  }
  holder[key] = next
  log.apply(`${where}.${key}`)
}

function home(doc: PageDoc, l: Locale, log: EditLog): void {
  const where = `home.${l}`
  const hero = block(doc, v5Id(l, 'home-hero'))
  setField(log, `${where}.hero`, hero, 'sub', V5.home.sub[l], V8.home.sub[l])
  const showcase = child(hero, 'showcase')
  setField(log, `${where}.hero.showcase`, showcase, 'badge', V5.home.badge[l], V8.home.badge[l])
  setField(log, `${where}.hero.showcase`, showcase, 'saveLabel', null, label(V8.home.saveLabel, l))

  const door2 = row(block(doc, v5Id(l, 'home-doors')).doors, v5Id(l, 'home-door-2'))
  const v5Bullets = V5.home.businessBullets.map((b, i) => ({ id: v5Id(l, `home-door-2-b-${String(i + 1)}`), text: b[l] }))
  const v8Bullets = V8.home.door2Bullets.map((b, i) => ({ id: v8Id(l, `home-door-2-b-${String(i + 1)}`), text: b[l] }))
  setField(log, `${where}.doors.door-2`, door2, 'bullets', v5Bullets, v8Bullets)

  const trust0 = row(block(doc, v5Id(l, 'home-trust')).items, v5Id(l, 'home-trust-1'))
  setField(log, `${where}.trust[0]`, trust0, 'text', V5.home.trust[0][l], V8.home.trust0[l])

  setField(log, `${where}.cta`, block(doc, v5Id(l, 'home-cta')), 'text', V5.home.sub[l], V8.home.sub[l])
}

function prijzen(doc: PageDoc, l: Locale, log: EditLog): void {
  const where = `prijzen.${l}`
  const hero = block(doc, v5Id(l, 'prijzen-hero'))
  // CHANGE-TABLE: delete the chip (the H1 already says "vanaf €49 per maand"; the Care card keeps €49).
  setField(log, `${where}.hero`, hero, 'priceChip', { amount: '€49', suffix: V5.prijzen.chipSuffix[l] }, { amount: null, suffix: null })
  const showcase = child(hero, 'showcase')
  // v8 frame: Live + Staging windows instead of the plan dashboard (no second price list).
  setField(log, `${where}.hero.showcase`, showcase, 'kind', 'plans', 'environments')
  setField(log, `${where}.hero.showcase`, showcase, 'liveLabel', null, label(V8.prijzen.liveLabel, l))
  setField(log, `${where}.hero.showcase`, showcase, 'stagingLabel', null, label(V8.prijzen.stagingLabel, l))
}

function partner(doc: PageDoc, l: Locale, log: EditLog): void {
  const showcase = child(block(doc, v5Id(l, 'partner-hero')), 'showcase')
  setField(log, `partnerprogramma.${l}.hero.showcase`, showcase, 'badge', V5.partner.badge[l], V8.partner.badge[l])
}

const BUILDERS: Record<V8Slug, (doc: PageDoc, l: Locale, log: EditLog) => void> = { home, prijzen, partnerprogramma: partner }

/** The v8 draft of a page-locale, from its v5 draft. Throws when the v5 draft is not the one 200500 wrote. */
export function buildV8Page(slug: V8Slug, locale: Locale, base: PageDoc): PageDoc {
  const doc = clone(base)
  const log = new EditLog()
  BUILDERS[slug](doc, locale, log)
  if (log.conflicts.length) throw new Error(`[redesign-v8] ${slug}.${locale}: ${log.conflicts.join('; ')}`)
  return doc
}

/** The v8 draft as the migration writes it on accp: from the v5 draft. */
export function v8Page(slug: V8Slug, locale: Locale): PageDoc {
  return buildV8Page(slug, locale, v5Page(slug, locale))
}

export type V8Report = { written: string[]; unchanged: string[]; skipped: string[] }
type Args = { payload: Payload; req?: PayloadRequest; direction: 'up' | 'down' }

const asPage = (raw: Obj, slugById: Map<number, string>): PageDoc =>
  toSlugRefs({ layout: (raw.layout ?? []) as PageDoc['layout'], meta: (raw.meta ?? {}) as Obj }, slugById)

export async function runRedesignV8({ payload, req, direction }: Args): Promise<V8Report> {
  const report: V8Report = { written: [], unchanged: [], skipped: [] }
  const { idBySlug, slugById } = await pageIds(payload, req)
  const say = (line: string) => {
    payload.logger.info(`[redesign-v8 ${direction}] ${line}`)
  }
  const writes: { where: string; write: () => Promise<unknown> }[] = []

  for (const slug of V8_SLUGS) {
    const id = idBySlug.get(slug)
    if (id === undefined) {
      report.skipped.push(`${slug}: page not found`)
      continue
    }
    for (const locale of LOCALES) {
      const where = `${slug}.${locale}`
      const read = async (draft: boolean) =>
        asPage((await payload.findByID({ collection: 'pages', id, locale, fallbackLocale: false, depth: 0, draft, req })) as unknown as Obj, slugById)
      const current = await read(true)
      const before = v5Page(slug, locale)
      const after = buildV8Page(slug, locale, before)
      let target: PageDoc
      if (direction === 'up') {
        if (sameValue(current, after)) {
          report.unchanged.push(where)
          continue
        }
        if (!sameValue(current, before)) {
          report.skipped.push(`${where}: latest draft is not the v5 draft (edited, published or not migrated), not overwriting`)
          continue
        }
        target = after
      } else {
        if (sameValue(current, before)) {
          report.unchanged.push(where)
          continue
        }
        if (!sameValue(current, after)) {
          report.skipped.push(`${where}: edited after the v8 migration, not reverting`)
          continue
        }
        // The v8 draft went live: putting the v5 draft back is a decision for a person.
        if (sameValue(await read(false), after)) {
          report.skipped.push(`${where}: v8 draft was published, not reverting (restore by hand from the version history)`)
          continue
        }
        target = before
      }
      const data = { ...fromSlugRefs(target, idBySlug), _status: 'draft' }
      writes.push({
        where: `${where} (draft)`,
        write: () => payload.update({ collection: 'pages', id, locale, depth: 0, draft: true, req, data: data as never }),
      })
    }
  }

  for (const { where, write } of writes) {
    await write()
    report.written.push(where)
    say(`wrote ${where}`)
  }
  for (const line of report.unchanged) say(`unchanged ${line}`)
  for (const line of report.skipped) payload.logger.warn(`[redesign-v8 ${direction}] SKIPPED ${line}`)
  return report
}
