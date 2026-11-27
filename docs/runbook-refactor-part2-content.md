# Runbook: refactor part 2 content migration (#121 / #122) and publish step

Migration `20261127_170000_content_refactor` rewrites home, prijzen,
partnerprogramma and contact (as **drafts**) and the header and footer
globals (**live**, globals have no drafts). The calculator on
/partnerprogramma (ladder v3.3) and the contact wizard text are **code** and
go live with the deploy. Until the four drafts are published, accp shows the
v3.3 calculator next to the old ladder text, and the new header/footer nex## Publishing is the production go-live

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
5. **After Yaron's OK**: Actions → "Publish refactor drafts (accp)":
   first a run with `apply` off (dry run, must show 8 × `would publish`),
   then with `apply` on and confirm `publish-4-pages-and-go-live`. The
   script refuses to write anything unless all eight page-locales are still
   exactly in the state the migration left (latest draft = migrated copy by
   content hash, published = snapshot); already published ones are skipped,
   so a re-run is a no-op. accp is now live with the new copy.
6. Then merge `develop` → `main`: deploy-prod builds the v3.3 calculator, the
   contact form text and the published copy together. **Hold `develop` →
   `main`, the admin Deploy button and any admin publish between step 1 and
   step 6**: a prod build in between would pair old code with new header and
   footer, or new copy with the old calculator.

nd footer together.

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
