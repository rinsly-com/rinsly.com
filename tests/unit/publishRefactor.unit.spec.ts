import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { gitHead, writeManifest } from '@/lib/contentRefactor/manifestFile'

import type { Obj } from '@/lib/contentRefactor/edit'
import type { Locale, PageDoc, PageSlug } from '@/lib/contentRefactor/pages'
import { v5Page } from '@/lib/contentRefactor/redesignV5'
import {
  contentHash,
  fullHash,
  expectedDraft,
  migratedPage,
  migrationManifest,
  loadPublishManifest,
  MANIFEST_HASH,
  parseManifest,
  assertApplyAllowed,
  payloadPublisher,
  payloadSource,
  type PayloadLike,
  planPublish,
  PUBLISH_CONFIRM,
  runPublish,
  snapshotPage,
  type PageSource,
} from '@/lib/contentRefactor/publish'

const SLUGS: PageSlug[] = ['home', 'prijzen', 'partnerprogramma', 'contact']
const LOCALES: Locale[] = ['nl', 'en']
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

type Db = Record<string, { draft: PageDoc; published: PageDoc }>
const key = (slug: string, locale: string) => `${slug}.${locale}`

/** Every page-locale as the migrations leave it: draft = expected (v5 or #121 contact), published = snapshot. */
function migratedDb(): Db {
  const db: Db = {}
  for (const slug of SLUGS) for (const locale of LOCALES) db[key(slug, locale)] = { draft: clone(expectedDraft(slug, locale)), published: clone(snapshotPage(slug, locale)) }
  return db
}

function fakeSource(db: Db, extraPages: { id: number; slug: string }[] = []): PageSource {
  const ids = SLUGS.map((slug, index) => ({ id: index + 1, slug }))
  return {
    pages: () => Promise.resolve([...ids, ...extraPages]),
    read: (id, locale, draft) => {
      const slug = ids.find((page) => page.id === id)?.slug ?? ''
      const row = db[key(slug, locale)]
      return Promise.resolve(clone(draft ? row.draft : row.published) as unknown as Obj)
    },
  }
}

function fakePublisher(db: Db) {
  return vi.fn((id: number, locale: Locale, draft: Obj) => {
    const slug = SLUGS[id - 1]
    db[key(slug, locale)].published = clone(draft) as unknown as PageDoc
    return Promise.resolve()
  })
}

const silent = () => undefined

describe('publish-refactor guard (planPublish)', () => {
  it('migrated draft over the published snapshot: ready', () => {
    const plan = planPublish([{ slug: 'home', locale: 'nl', latestDraft: expectedDraft('home', 'nl'), published: snapshotPage('home', 'nl') }])
    expect(plan.ready).toHaveLength(1)
    expect(plan.blocked).toEqual([])
  })

  it('draft still the snapshot (migration not run): blocked', () => {
    const plan = planPublish([{ slug: 'prijzen', locale: 'en', latestDraft: snapshotPage('prijzen', 'en'), published: snapshotPage('prijzen', 'en') }])
    expect(plan.blocked[0]).toMatch(/prijzen\.en: .*migration has not run/)
  })

  it('draft edited after the migration: blocked, with both hashes', () => {
    const edited = clone(expectedDraft('contact', 'nl'))
    edited.meta = { ...edited.meta, title: 'Iets anders' }
    const plan = planPublish([{ slug: 'contact', locale: 'nl', latestDraft: edited, published: snapshotPage('contact', 'nl') }])
    expect(plan.blocked[0]).toContain(contentHash(edited))
    expect(plan.blocked[0]).toContain(contentHash(expectedDraft('contact', 'nl')))
    expect(plan.blocked[0]).toMatch(/not the expected draft/)
  })

  it('published version changed by someone else: blocked', () => {
    const live = clone(snapshotPage('home', 'en'))
    live.meta = { ...live.meta, description: 'changed live' }
    const plan = planPublish([{ slug: 'home', locale: 'en', latestDraft: expectedDraft('home', 'en'), published: live }])
    expect(plan.blocked[0]).toMatch(/not one the manifest allows replacing/)
  })

  it('already published: counted as done, not republished', () => {
    const plan = planPublish([{ slug: 'home', locale: 'nl', latestDraft: expectedDraft('home', 'nl'), published: expectedDraft('home', 'nl') }])
    expect(plan.already).toEqual(['home.nl'])
    expect(plan.ready).toEqual([])
  })

  it('the hash ignores key order and D1 nulls, like sameValue', () => {
    expect(contentHash({ b: 1, a: [{ x: 'y', blockName: null }] })).toBe(contentHash({ a: [{ x: 'y' }], b: 1, c: null }))
  })
})

describe('publish-refactor manifest', () => {
  it('the committed manifest is the migration output (regenerate with content:publish-refactor:manifest)', () => {
    expect(loadPublishManifest().pages).toEqual(migrationManifest('0'.repeat(40)).pages)
    expect(Object.keys(loadPublishManifest().pages).sort()).toEqual(SLUGS.flatMap((slug) => LOCALES.map((locale) => key(slug, locale))).sort())
  })

  it('home, prijzen and partnerprogramma expect the redesign v5 drafts, contact the #121 draft', () => {
    for (const locale of LOCALES) {
      for (const slug of ['home', 'prijzen', 'partnerprogramma'] as const) {
        expect(loadPublishManifest().pages[key(slug, locale)].draft).toBe(fullHash(v5Page(slug, locale)))
        expect(loadPublishManifest().pages[key(slug, locale)].draft).not.toBe(fullHash(migratedPage(slug, locale)))
      }
      expect(loadPublishManifest().pages[key('contact', locale)].draft).toBe(fullHash(migratedPage('contact', locale)))
    }
  })

  it('a #121 draft that the v5 migration skipped (edited page) is not publishable', () => {
    const plan = planPublish([{ slug: 'prijzen', locale: 'nl', latestDraft: migratedPage('prijzen', 'nl'), published: snapshotPage('prijzen', 'nl') }])
    expect(plan.ready).toHaveLength(0)
    expect(plan.blocked[0]).toMatch(/not the expected draft/)
  })

  it('a different manifest publishes its own drafts and refuses the current ones', async () => {
    const db = migratedDb()
    const redesigned = clone(expectedDraft('home', 'nl'))
    redesigned.meta = { ...redesigned.meta, title: 'Redesign' }
    db[key('home', 'nl')].draft = redesigned
    const manifest = clone(loadPublishManifest())
    expect(planPublish([{ slug: 'home', locale: 'nl', latestDraft: redesigned, published: snapshotPage('home', 'nl') }]).blocked).toHaveLength(1)
    manifest.pages['home.nl'].draft = fullHash(redesigned)
    const publisher = fakePublisher(db)
    const result = await runPublish({ source: fakeSource(db), publisher, apply: true, confirm: PUBLISH_CONFIRM, manifest, log: silent })
    expect(result.published).toHaveLength(8)
    expect(fullHash(db[key('home', 'nl')].published)).toBe(fullHash(redesigned))
  })

  it('a page-locale missing from the manifest blocks the run', () => {
    const plan = planPublish([{ slug: 'home', locale: 'nl', latestDraft: expectedDraft('home', 'nl'), published: snapshotPage('home', 'nl') }], { ...migrationManifest('0'.repeat(40)), pages: {} })
    expect(plan.blocked[0]).toMatch(/not in the publish manifest/)
  })
})

describe('publish-refactor run', () => {
  it('dry run is the default: plans 8 and writes nothing', async () => {
    const db = migratedDb()
    const publisher = fakePublisher(db)
    const lines: string[] = []
    const result = await runPublish({ source: fakeSource(db), publisher, apply: false, log: (line) => lines.push(line) })
    expect(result.applied).toBe(false)
    expect(publisher).not.toHaveBeenCalled()
    expect(lines.filter((line) => line.startsWith('would publish'))).toHaveLength(8)
  })

  it('apply without the confirmation phrase refuses before reading or writing', async () => {
    const db = migratedDb()
    const publisher = fakePublisher(db)
    await expect(runPublish({ source: fakeSource(db), publisher, apply: true, confirm: 'yes', log: silent })).rejects.toThrow(/confirmation phrase/)
    expect(publisher).not.toHaveBeenCalled()
  })

  it('apply on a read-only source refuses', async () => {
    await expect(runPublish({ source: fakeSource(migratedDb()), apply: true, confirm: PUBLISH_CONFIRM, log: silent })).rejects.toThrow(/read-only/)
  })

  it('one page out of state aborts the whole run, nothing written, listing it', async () => {
    const db = migratedDb()
    db[key('partnerprogramma', 'en')].draft.meta = { ...db[key('partnerprogramma', 'en')].draft.meta, title: 'edited' }
    const publisher = fakePublisher(db)
    await expect(runPublish({ source: fakeSource(db), publisher, apply: true, confirm: PUBLISH_CONFIRM, log: silent })).rejects.toThrow(
      /nothing written[\s\S]*partnerprogramma\.en/,
    )
    expect(publisher).not.toHaveBeenCalled()
  })

  it('apply publishes exactly the 8 page-locales, and a second run is a no-op', async () => {
    const db = migratedDb()
    const publisher = fakePublisher(db)
    const first = await runPublish({ source: fakeSource(db), publisher, apply: true, confirm: PUBLISH_CONFIRM, log: silent })
    expect(first.published).toHaveLength(8)
    expect(publisher.mock.calls.map(([id, locale]) => key(SLUGS[id - 1], locale)).sort()).toEqual(Object.keys(db).sort())
    const second = await runPublish({ source: fakeSource(db), publisher, apply: true, confirm: PUBLISH_CONFIRM, log: silent })
    expect(second.published).toEqual([])
    expect(second.already).toHaveLength(8)
    expect(publisher).toHaveBeenCalledTimes(8)
  })

  it('a duplicate slug aborts', async () => {
    await expect(runPublish({ source: fakeSource(migratedDb(), [{ id: 99, slug: 'home' }]), apply: false, log: silent })).rejects.toThrow(/more than one page/)
  })

  it('a missing page aborts', async () => {
    const source = fakeSource(migratedDb())
    const pages = source.pages
    source.pages = async () => (await pages()).filter((page) => page.slug !== 'contact')
    await expect(runPublish({ source, apply: false, log: silent })).rejects.toThrow(/contact: page not found/)
  })
})

describe('publish-refactor Payload calls', () => {
  /** A fake Payload local API over the same in-memory pages; update honours publishSpecificLocale only. */
  function fakePayload(db: Db) {
    const update = vi.fn((args: Record<string, unknown>) => {
      const slug = SLUGS[(args.id as number) - 1]
      const locales = args.publishAllLocales === false ? [args.publishSpecificLocale as Locale] : LOCALES
      for (const locale of locales) {
        const row = db[key(slug, locale)]
        row.published = clone(locale === args.locale ? (args.data as PageDoc) : row.draft)
      }
      return Promise.resolve({})
    })
    const payload: PayloadLike = {
      find: () => Promise.resolve({ docs: SLUGS.map((slug, index) => ({ id: index + 1, slug })) }),
      findByID: (args) => {
        const row = db[key(SLUGS[(args.id as number) - 1], args.locale as string)]
        return Promise.resolve(clone(args.draft ? row.draft : row.published))
      },
      update,
    }
    return { payload, update }
  }

  it('the publisher publishes exactly one locale: publishAllLocales false, publishSpecificLocale = locale', async () => {
    const { payload, update } = fakePayload(migratedDb())
    await payloadPublisher(payload)(3, 'en', { layout: [], meta: {} })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'pages', id: 3, locale: 'en', draft: false, publishAllLocales: false, publishSpecificLocale: 'en' }),
    )
  })

  it('a full run sends those flags on every call, one per page-locale', async () => {
    const db = migratedDb()
    const { payload, update } = fakePayload(db)
    const result = await runPublish({ source: payloadSource(payload), publisher: payloadPublisher(payload), apply: true, confirm: PUBLISH_CONFIRM, log: silent })
    expect(result.published).toHaveLength(8)
    const calls = update.mock.calls.map(([args]) => args)
    expect(calls).toHaveLength(8)
    for (const args of calls) {
      expect(args.publishAllLocales).toBe(false)
      expect(args.publishSpecificLocale).toBe(args.locale)
      expect(args.draft).toBe(false)
    }
  })

  it('the phrase check runs on its own, before any database is opened', () => {
    expect(() => { assertApplyAllowed({ apply: true, confirm: undefined, writable: true }) }).toThrow(/confirmation phrase/)
    expect(() => { assertApplyAllowed({ apply: true, confirm: PUBLISH_CONFIRM, writable: false }) }).toThrow(/read-only/)
    expect(() => { assertApplyAllowed({ apply: false, confirm: undefined, writable: true }) }).not.toThrow()
    expect(() => { assertApplyAllowed({ apply: true, confirm: PUBLISH_CONFIRM, writable: true }) }).not.toThrow()
  })

  it('a run that stopped halfway is finished by running it again', async () => {
    const db = migratedDb()
    const { payload, update } = fakePayload(db)
    let calls = 0
    const flaky = payloadPublisher({
      ...payload,
      update: (args) => {
        calls += 1
        if (calls === 4) return Promise.reject(new Error('D1 hiccup'))
        return update(args)
      },
    })
    await expect(runPublish({ source: payloadSource(payload), publisher: flaky, apply: true, confirm: PUBLISH_CONFIRM, log: silent })).rejects.toThrow(/D1 hiccup/)
    const rerun = await runPublish({ source: payloadSource(payload), publisher: payloadPublisher(payload), apply: true, confirm: PUBLISH_CONFIRM, log: silent })
    expect(rerun.already).toHaveLength(3)
    expect(rerun.published).toHaveLength(5)
  })
})

describe('publish manifest contract', () => {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

  it('the committed manifest has version 1, the hash definition and a full sourceCommit', () => {
    const manifest = loadPublishManifest()
    expect(manifest.version).toBe(1)
    expect(manifest.hash).toEqual(MANIFEST_HASH)
    expect(manifest.sourceCommit).toMatch(/^[0-9a-f]{40}$/)
  })

  it('refuses another version, another hash definition or a short sourceCommit', () => {
    const good = migrationManifest(head)
    expect(() => parseManifest({ ...good, version: 2 })).toThrow(/version 2/)
    expect(() => parseManifest({ ...good, hash: { ...MANIFEST_HASH, algorithm: 'sha1' } })).toThrow(/hash definition/)
    expect(() => parseManifest({ ...good, sourceCommit: 'abc123' })).toThrow(/sourceCommit/)
    expect(() => parseManifest({ ...good, pages: { 'home.nl': { draft: 'xyz', published: [] } } })).toThrow(/sha256/)
    expect(parseManifest(good).pages).toEqual(good.pages)
  })

  it('the manifest script fills sourceCommit with git HEAD of a clean tree, and refuses a dirty one (untracked files too)', () => {
    // A throwaway repo, so the test does not depend on the state of this checkout.
    const repo = mkdtempSync(join(tmpdir(), 'manifest-repo-'))
    const git = (...args: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd: repo, encoding: 'utf8' }).trim()
    git('init', '-q')
    writeFileSync(join(repo, 'a.txt'), 'a')
    git('add', 'a.txt')
    git('commit', '-qm', 'a')
    const repoHead = git('rev-parse', 'HEAD')
    expect(gitHead(repo)).toBe(repoHead)
    const target = join(mkdtempSync(join(tmpdir(), 'manifest-')), 'publish-manifest.json')
    writeManifest(target, gitHead(repo))
    const written = JSON.parse(readFileSync(target, 'utf8')) as { sourceCommit: string; version: number }
    expect(written.sourceCommit).toBe(repoHead)
    expect(parseManifest(written).version).toBe(1)
    // An untracked file (e.g. a new transform not yet added) makes the tree dirty; an ignored one does not.
    writeFileSync(join(repo, '.gitignore'), 'ignored.txt\n')
    git('add', '.gitignore')
    git('commit', '-qm', 'ignore')
    writeFileSync(join(repo, 'ignored.txt'), 'x')
    expect(gitHead(repo)).toBe(git('rev-parse', 'HEAD'))
    writeFileSync(join(repo, 'new-transform.ts'), 'export {}')
    expect(() => gitHead(repo)).toThrow(/new-transform\.ts/)
    rmSync(join(repo, 'new-transform.ts'))
    writeFileSync(join(repo, 'a.txt'), 'changed')
    expect(() => gitHead(repo)).toThrow(/uncommitted changes/)
  })
})

describe('publish-refactor log', () => {
  it('a blocked run never logs "will publish"', async () => {
    const db = migratedDb()
    db[key('contact', 'en')].draft.meta = { ...db[key('contact', 'en')].draft.meta, title: 'edited' }
    const lines: string[] = []
    await expect(runPublish({ source: fakeSource(db), publisher: fakePublisher(db), apply: true, confirm: PUBLISH_CONFIRM, log: (line) => lines.push(line) })).rejects.toThrow(/aborted/)
    expect(lines.some((line) => /will publish|would publish|^published/.test(line))).toBe(false)
    expect(lines.filter((line) => line.startsWith('in state, not published'))).toHaveLength(7)
  })
})

