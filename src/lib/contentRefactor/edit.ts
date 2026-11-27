/**
 * Guarded, idempotent edits on a Payload document shape (plain JSON).
 *
 * Every edit names the value it expects to replace. When the document already
 * holds the new value the edit is a no-op (that is what makes a second run
 * harmless). When it holds the expected old value the edit applies. Anything
 * else is a conflict: somebody changed that field after the accp snapshot of
 * 27 Nov 2026 16:15, and the migration must not overwrite their work. The
 * caller skips the whole document (page + locale, or global + locale) when a
 * single edit conflicts, so a document is never left half-migrated.
 */

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
export type Obj = { [key: string]: Json }

export class EditLog {
  readonly conflicts: string[] = []
  readonly applied: string[] = []
  conflict(where: string, detail: string): void {
    this.conflicts.push(`${where}: ${detail}`)
  }
  apply(where: string): void {
    this.applied.push(where)
  }
}

const isObj = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Drop null, undefined, empty arrays/objects/strings and `false` so a value read
 * back from D1 (which fills unset fields with null and adds `blockName: null`)
 * compares equal to the same value from the public API or from a transform.
 */
export function normalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalise)
  if (isObj(value)) {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value).sort()) {
      if (key === 'blockName' || key === 'updatedAt' || key === 'createdAt') continue
      const v = normalise(value[key])
      if (v === null || v === undefined || v === false || v === '') continue
      if (Array.isArray(v) && v.length === 0) continue
      if (isObj(v) && Object.keys(v).length === 0) continue
      out[key] = v
    }
    return out
  }
  return value
}

export const sameValue = (a: unknown, b: unknown): boolean =>
  JSON.stringify(normalise(a)) === JSON.stringify(normalise(b))

function preview(value: unknown): string {
  const text: unknown = JSON.stringify(value)
  return typeof text === 'string' ? text.slice(0, 80) : 'undefined'
}

/** Set `obj[key]` from `expected` to `next`. */
export function setField(log: EditLog, where: string, obj: Obj | undefined, key: string, expected: Json, next: Json): void {
  if (!obj) {
    log.conflict(where, 'container missing')
    return
  }
  const current = obj[key]
  if (sameValue(current, next)) return
  if (sameValue(current, expected)) {
    obj[key] = next
    log.apply(`${where}.${key}`)
    return
  }
  log.conflict(`${where}.${key}`, `expected ${preview(expected)}, found ${preview(current)}`)
}

/** The snapshot always holds the value; a miss means the transform names a wrong id. */
export function must<T>(value: T | undefined | null, what = 'value'): T {
  if (value === undefined || value === null) throw new Error(`content refactor: missing ${what} in the accp snapshot`)
  return value
}

/** Text of a scalar field, '' for anything that is not a string. */
export const str = (value: Json | undefined): string => (typeof value === 'string' ? value : '')

export const byId = (list: Json | undefined, id: string): Obj | undefined =>
  Array.isArray(list) ? (list.find((item) => isObj(item) && item.id === id) as Obj | undefined) : undefined

/** Remove the item with `id` when it is there and still matches `expected`. */
export function removeById(log: EditLog, where: string, list: Json[], id: string, expected: Json): Json[] {
  const index = list.findIndex((item) => isObj(item) && item.id === id)
  if (index === -1) return list
  if (!sameValue(list[index], expected)) {
    log.conflict(`${where}[${id}]`, 'item changed since the snapshot, not removing')
    return list
  }
  log.apply(`${where}[${id}] removed`)
  return [...list.slice(0, index), ...list.slice(index + 1)]
}

/** Insert `item` after the item with `afterId` (or at the start for null) unless its id is already present. */
export function insertAfter(log: EditLog, where: string, list: Json[], afterId: string | null, item: Obj): Json[] {
  if (list.some((existing) => isObj(existing) && existing.id === item.id)) return list
  const index = afterId === null ? -1 : list.findIndex((existing) => isObj(existing) && existing.id === afterId)
  if (afterId !== null && index === -1) {
    log.conflict(where, `anchor ${afterId} missing for ${str(item.id)}`)
    return list
  }
  log.apply(`${where}[${str(item.id)}] inserted`)
  return [...list.slice(0, index + 1), item, ...list.slice(index + 1)]
}

/**
 * Put the items named in `order` in that order, at the position of the first
 * of them. Items not named keep their place. Missing ids are a conflict.
 */
export function reorder(log: EditLog, where: string, list: Json[], order: string[]): Json[] {
  const named = order.map((id) => list.find((item) => isObj(item) && item.id === id))
  if (named.some((item) => item === undefined)) {
    log.conflict(where, `reorder: missing ${order.filter((_, i) => named[i] === undefined).join(', ')}`)
    return list
  }
  const first = list.findIndex((item) => isObj(item) && order.includes(item.id as string))
  const rest = list.filter((item) => !(isObj(item) && order.includes(item.id as string)))
  const before = list.slice(0, first).filter((item) => rest.includes(item))
  const after = rest.slice(before.length)
  const next = [...before, ...(named as Json[]), ...after]
  if (!sameValue(next.map((i) => (i as Obj).id), list.map((i) => (i as Obj).id))) log.apply(`${where} reordered`)
  return next
}

// ---------------------------------------------------------------------------
// Lexical rich text
// ---------------------------------------------------------------------------

const textNode = (text: string): Obj => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})

/** A Lexical root with one plain paragraph per string (the shape the seed and the admin write). */
export function lexicalParagraphs(...paragraphs: string[]): Obj {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [textNode(text)],
      })),
    },
  }
}

/**
 * Replace `old` with `next` inside a single Lexical text node. Idempotent:
 * a node that already holds `next` (and not `old`) counts as done.
 */
export function replaceInLexical(log: EditLog, where: string, holder: Obj | undefined, key: string, old: string, next: string): void {
  const root = holder?.[key]
  if (!isObj(root)) {
    log.conflict(where, 'rich text missing')
    return
  }
  const state = { found: false, done: false }
  const walk = (node: Json): void => {
    if (!isObj(node)) return
    if (node.type === 'text' && typeof node.text === 'string') {
      if (node.text.includes(old)) {
        node.text = node.text.replace(old, next)
        state.found = true
      } else if (next !== '' && node.text.includes(next)) {
        state.done = true
      }
    }
    if (Array.isArray(node.children)) node.children.forEach(walk)
    if (isObj(node.root)) walk(node.root)
  }
  walk(root)
  if (state.found) log.apply(where)
  else if (!state.done && next !== '') log.conflict(where, `text not found: ${old.slice(0, 60)}`)
}

/**
 * Remove every Lexical node (paragraph, list item) whose plain text is exactly
 * `text`, at any depth. A list left empty goes too. No-op when already gone.
 */
export function removeLexicalNode(log: EditLog, where: string, holder: Obj | undefined, key: string, text: string): void {
  const root = holder?.[key]
  if (!isObj(root) || !isObj(root.root)) {
    log.conflict(where, 'rich text missing')
    return
  }
  const state = { removed: false }
  const prune = (node: Obj): void => {
    if (!Array.isArray(node.children)) return
    node.children = node.children.filter((child) => {
      if (!isObj(child)) return true
      if (child.type !== 'text' && plainText(child) === text) {
        state.removed = true
        return false
      }
      prune(child)
      return !(child.type === 'list' && Array.isArray(child.children) && child.children.length === 0)
    })
  }
  prune(root.root)
  if (state.removed) log.apply(`${where} node removed`)
}

/** Concatenated text of a Lexical node (text nodes joined without separators). */
export function plainText(node: unknown): string {
  if (!isObj(node)) return ''
  if (typeof node.text === 'string') return node.text
  const kids = Array.isArray(node.children) ? node.children : isObj(node.root) ? [node.root] : []
  return kids.map(plainText).join('')
}
