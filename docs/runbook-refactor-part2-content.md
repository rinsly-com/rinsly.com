# Runbook: refactor part 2 content migration (PR #121)

Migration `20261127_170000_content_refactor` rewrites home, prijzen,
partnerprogramma and contact (as **drafts**) and the header and footer
globals (**live**, globals have no drafts). The calculator on
/partnerprogramma (ladder v3.3) and the contact wizard text are **code** and
go live with the deploy. Until the four drafts are published, accp shows the
v3.3 calculator next to the old ladder text, and the new header/footer next to
old page copy.

## Order (do not skip a step)

1. Merge #120, then #121, into `develop`. `deploy-accp.yml` runs
   `deploy:database` (lint:migrations + `payload migrate`) and deploys the
   accp Worker.
2. Check the migration log in the workflow run: 8 lines
   `[content-refactor up] wrote <page>.<locale> (draft)` and 4 lines for
   header/footer. Any `SKIPPED` line means that page changed on accp after
   the 27 Nov 16:15 snapshot; that page was left alone. Report it, don't
   force it.
3. **Right after the accp deploy**, publish the four drafts in the accp admin
   (Pages → home, prijzen, partnerprogramma, contact → review → Publish, for
   NL and EN). Until then do not edit these four pages through the content
   endpoint: a publish of the draft would overwrite that edit.
4. Check accp: /nl and /en of the four pages, header and footer.
5. **Hold `develop` → `main` and any prod static rebuild** until step 3 is
   done. A publish triggers a prod rebuild from accp's published content, so
   publishing the drafts is also the moment prod gets the new copy, header
   and footer together.

## Undo

`payload migrate:down` (one step) restores the snapshot for every page and
global that still equals what the migration wrote; anything edited since is
skipped and logged. Pages keep their publish status: a published migrated
page is restored as published.

## Known

- Drafts are readable through the public API with `?draft=true` (site-core
  pages have `read: () => true`; accp has no Cloudflare Access).
- Each run adds draft versions (maxPerDoc 50).
