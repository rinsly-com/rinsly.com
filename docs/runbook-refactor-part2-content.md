# Runbook: refactor part 2 content migration (#121 / #122) and publish step

Migration `20261127_170000_content_refactor` rewrites home, prijzen,
partnerprogramma and contact (as **drafts**) and the header and footer
globals (**live**, globals have no drafts). The calculator on
/partnerprogramma (ladder v3.3) and the contact wizard text are **code** and
go live with the deploy. Until the four drafts are published, accp shows the
v3.3 calculator next to the old ladder text, and the new header/footer next to
old page copy.

## Publishing is the production go-live

Publishing a page (or saving a global) on accp fires `onContentPublished`,
which dispatches `deploy-prod.yml` when the accp Worker has its
`DEPLOY_DISPATCH_*` secrets. prod is a static export of accp's **published**
content, built from `main`. So once the four pages are published on accp,
the next prod build (a push to `main`, the admin Deploy button, or any publish
or global save in the admin) puts them on rinsly.com. Treat the publish as the
go-live.

The publish step itself (`publish-refactor-accp.yml`) runs the Payload local
API in GitHub Actions, where no `DEPLOY_DISPATCH_*` secret exists: its hooks
log `[static-deploy] skipped`, so the prod rebuild comes from step 6 below,
not from the publish run. The same holds for the migration's header/footer
writes in `deploy:database`.

## Order (do not skip a step)

1. #122 (re-land of #121) is merged into `develop`. `deploy-accp.yml` runs
   `deploy:database` (lint:migrations + `payload migrate`) and deploys the
   accp Worker.
2. Check the migration log in the workflow run: 8 lines
   `[content-refactor up] wrote <page>.<locale> (draft)` and 4 lines for
   header/footer. Any `SKIPPED` line means that page changed on accp after
   the 27 Nov 16:15 snapshot; that page was left alone. Report it, don't
   force it. Header and footer are now live on accp.
3. Read-only check from any machine, no credentials:
   `pnpm content:publish-refactor:check` must list 8 × `would publish`.
4. Yaron reviews the drafts on accp (admin preview, NL and EN) and gives his
   OK. Until then: no publish in the admin, no content-endpoint edits to
   these four pages (a later publish of the draft would overwrite them).
5. **Before the first run (once, repo setting, Fleet or Yaron):** create the
   GitHub environment `accp-publish` with **Yaron as required reviewer**,
   deployment branches **`develop` only**, and the environment variable
   `ACCP_PUBLISH_PROTECTED=yes`. Put `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID` and `PAYLOAD_SECRET` in it as **environment
   secrets and remove them at repo level** (the deploy workflows then need
   their own environment). The `if:` on `develop`, the guard step and
   `environment:` in the workflow file only protect the file as committed:
   a branch can dispatch a modified copy without them, and as long as the
   secrets live at repo level that copy can read them. The real boundary is
   environment secrets behind a required reviewer.
6. **After Yaron's OK**: Actions → "Publish refactor drafts (accp)" on `develop`:
   first a run with `apply` off (dry run, must show 8 × `would publish`),
   then with `apply` on and confirm `publish-4-pages-and-go-live`. The
   script refuses to write anything unless all eight page-locales are
   exactly in the state `src/lib/contentRefactor/publish-manifest.json`
   expects (sha256 of the latest draft = the manifest's `draft` hash, the
   published version = one of its `published` hashes); already published
   ones are skipped, so a re-run is a no-op. accp is now live with the new
   copy. Each page-locale is published on its own (`publishSpecificLocale`)
   and checked right after.

   **If a run stops halfway** (D1 error, timeout): run it again with the
   same inputs. The page-locales already published log `already published`,
   the rest are published; nothing is published twice. The dry run shows
   the split first.

   **The manifest is the contract.** It holds the redesign v8 drafts for
   home, prijzen and partnerprogramma (migration
   `20261127_225300_redesign_v8_content` on top of the v5 drafts of
   `20261127_200500_redesign_v5_content`, run on accp by the deploy after
   the v8 PR merges) and the #121 draft for contact. The redesign PR
   regenerated it with `pnpm content:publish-refactor:manifest`. Any later
   PR that changes the drafts before publish does the same (or writes its
   own hashes with `fullHash`) and commits the new manifest in the same PR;
   the unit test `publishRefactor.unit.spec.ts` "the committed manifest is
   ..." then needs that PR's expected state too. Until the v8 migration has
   run on accp, the dry run blocks home, prijzen and partnerprogramma (their
   drafts are still the v5 ones): that is expected, do not publish then.

   **Migration order on an old local database.** `20261127_170000` reads
   pages through the Local API with the current config, which includes the
   redesign blocks. On a database that has pages but has not run 170000 yet,
   it fails with `no such table: pages_blocks_product_hero` (nothing is
   written, the migration is not recorded), and `20261127_200000` cannot run
   first because it sorts after it. accp (ran 170000), prod (static, no D1)
   and an empty database are not affected. Fix for an old local copy: check
   out `develop` from before the redesign PR (e.g. `f66b208`), run
   `pnpm payload migrate` there (170000 and 190000), then switch back to this
   branch and run `pnpm payload migrate` again.
   The same holds one step later for `20261127_200500` (it reads pages with
   the current config, which includes the v8 frame label columns of
   `20261127_225200`): on a local copy that has not run 200500 yet, run
   `pnpm payload migrate` on `develop` from before the v8 PR (e.g.
   `b424feb`) first. accp has run 200500 already.
7. Then merge `develop` → `main`: deploy-prod builds the v3.3 calculator, the
   contact form text and the published copy together. **Hold `develop` →
   `main`, the admin Deploy button and any admin publish between step 1 and
   step 7**: a prod build in between would pair old code with new header and
   footer, or new copy with the old calculator.

## Publish manifest (contract for the redesign PR)

`src/lib/contentRefactor/publish-manifest.json` is what the publish step
checks. Fields:

- `version`: `1`. Any other value is refused (`parseManifest`).
- `hash`: the hash definition, and it must equal `MANIFEST_HASH` in
  `publish.ts`. Algorithm sha256, hex. Input:
  `JSON.stringify(normalise({ layout, meta }))` of one page-locale, with page
  relations written as `"@slug"` (`refs.ts` `toSlugRefs`). `normalise`
  (`edit.ts`) sorts object keys, drops `null`, `undefined`, `false`, `''`,
  empty arrays and empty objects, and drops `blockName`, `createdAt`,
  `updatedAt`. Only `layout` and `meta` are covered; `title` and `slug` are
  not. The four slugs are fixed in `PAGE_SLUGS`.
- `sourceCommit`: the full git sha of HEAD when the file was generated (the
  manifest commit itself comes after it). Filled in by
  `pnpm content:publish-refactor:manifest`, which refuses to run on a dirty
  tree. The publish step checks it for format only (40 hex characters), not
  that the commit exists or matches the drafts; the hashes are the guard.
  The redesign PR regenerates the manifest (new `draft` hashes and
  `sourceCommit`) for the drafts it writes.
- `pages`: per `<slug>.<locale>`, `draft` (hash of the draft to publish) and
  `published` (hashes of the published versions it may replace).

A PR that changes the drafts before publish (the redesign) writes its drafts
(a new migration or transform), regenerates the manifest, or writes its own
`fullHash` values, and commits it. The unit test that pins the manifest to
the #121 migration output changes in that PR too. A change to `normalise`
changes every hash; the pinned test fails until the manifest is regenerated.
Check against accp before running: `pnpm content:publish-refactor:check`.

## Undo

`payload migrate:down` (one step):

- **Before the drafts are published** it restores the snapshot as a new
  draft for each page whose latest version is still exactly the migrated
  copy and whose published version is still the snapshot. Header and footer
  are restored where they still equal what up wrote. Nothing else is touched;
  each skip is logged.
- **After the drafts are published** (step 5) it skips the pages (`published after
  the migration, not reverting`): putting old copy live again is a person's
  call, done from the page's version history in the admin. Header and footer
  are still restored, so decide first whether that is wanted.

## Partial run

The migration computes every target, and resolves every page reference,
before its first write, so a missing page or a transform error aborts with
nothing written. A D1 error halfway through the writes can still leave some
documents migrated (D1 migrations are not transactional). Recover by running
`payload migrate` again: every write is idempotent, so documents that were
written log `unchanged` and the rest are written. Or run `migrate:down`,
which reverts exactly the documents that were written.

## Known

- Drafts are readable through the public API with `?draft=true` (site-core
  pages have `read: () => true`; accp has no Cloudflare Access).
- Each run adds draft versions (maxPerDoc 50).
