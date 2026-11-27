# Content endpoint (rinsly.com)

`POST https://accp.rinsly.com/api/rinsly/content` lets a signed operator (Marketeer) edit a few
text fields on existing pages without a code PR. It comes from site-core (>= 0.26.8, pinned
0.26.10 here). This page is the runbook: what is built, how Fleet/Yaron turn it on, how to use
it, how to turn it off, and how to change what it may write.

Who does what:

| Step                                                                                     | Who                                                                |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Code, allowlist, tests, this runbook                                                     | Builder (PR, Yaron merges; content-endpoint PRs never auto-merge)  |
| `rinsly content setup` (Access app, service token, rate-limit rule, key, Worker secrets) | Fleet or Yaron, with a Cloudflare token that is not on the bot box |
| Setting `RINSLY_CONTENT_ENABLED`                                                         | Yaron's OK, then Fleet or Yaron                                    |
| Who holds the private signing key                                                        | Yaron decides (Marketeer or Fleet)                                 |
| Any remote D1 write (migrations, seed)                                                   | Yaron's OK                                                         |

## State of the code

- `contentEndpoint: true` in `src/payload.config.ts`, the `content_audit` / `content_replay`
  migration (`20261126_232114_content_endpoint`) and the `RINSLY_CONTENT_RATE_LIMITER` binding
  (`wrangler.jsonc`, 20 per 60 s, `namespace_id` 2102) are on develop (#106, #108).
- `src/contentAllowlist.ts` is the allowlist (this change). It is generated; see "Allowlist".
- **Off by default.** The route answers 404 until `RINSLY_CONTENT_ENABLED` is set on the accp
  Worker. It also stays closed without the Access secrets and without the rate-limit binding.
- **accp only.** Prod (`rinsly.com`) is a static export with no runtime and no D1, so it never
  serves this route. Nothing in this repo sets `RINSLY_CONTENT_ENABLED`, `RINSLY_CONTENT_KILL`
  or `RINSLY_CONTENT_ALLOWLIST`.
- **`RINSLY_CONTENT_ALLOWLIST` stays unset.** When that Worker variable is set it _replaces_ the
  allowlist in code. The code list is reviewed in a PR; an env value is not. Do not set it.

## What the endpoint may write

Collection `pages` only. No globals, no other collection, no `title`, `slug`, `meta.noindex`,
`meta.image`, no rich text.

| Path                                            | Meaning                        | Scope                                                                        |
| ----------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| `meta.title`                                    | SEO title                      | **Every page, both locales.** A top-level path cannot be scoped to one page. |
| `meta.description`                              | SEO description                | Same.                                                                        |
| `layout.<blockId>.header.title` (website hero)  | `/website` H1                  | That one block, per locale                                                   |
| `layout.<blockId>.header.title` (contact block) | Heading above the contact form | That one block, per locale                                                   |

Marketeer's four SEO pages are /website (id 7), /prijzen (id 6), /over (id 8) and
/partnerprogramma (id 4). Because `meta.*` is allowed everywhere, it also reaches the noindex
legal pages (privacy id 2, voorwaarden id 3) and the published noindex pages cases (id 10) and
Woerden (id 11). These are published, not drafts, so a `meta.*` write to them is accepted:
it publishes the page and starts a production rebuild like any other write. Accepted in the
plan (`PLAN.md` step 2); the audit table records every write.

Not covered, on purpose:

- Rich text (page body paragraphs, FAQ answers). A write is refused unless the stored value is
  one plain paragraph. Needs the rich-text codec (plan Part C).
- The first step of the quote wizard ("Wie ben je?") is hard-coded in `OfferteForm.tsx`, not in
  the CMS. The pinned "contact" heading is the section heading above the form ("Vertel wat u
  nodig heeft" / "Tell us what you need").
- Adding, removing or reordering blocks and FAQ rows.

The generator pins `layout.<blockId>.header.title` by Payload row id. The id of a row is stable
since the seed lock (#100: the seed never rewrites a published page that has a layout). If a
layout is ever rebuilt, its blocks get new ids, the pins match nothing, and the endpoint denies
the write (fail closed). Regenerate (below).

## Enable on accp (in this order)

Preconditions: #106 (site-core 0.26.10), #108 (endpoint config, migration, rate-limit binding)
and the change that adds `src/contentAllowlist.ts` are merged and accp is deployed.

1. **Check the migration is applied** (read only):
   `pnpm exec wrangler d1 migrations list rinsly-accp --remote` shows nothing pending.
   If a migration is ever pending, take a Time Travel bookmark first
   (`pnpm exec wrangler d1 time-travel info rinsly-accp`); restore line:
   `wrangler d1 time-travel restore rinsly-accp --bookmark=<id>`.
2. **Check the allowlist is current** (read only, public GET):
   `node scripts/content-allowlist-ids.mjs --check` says `up to date`.
3. **Plan the setup, then apply** (Fleet or Yaron; needs `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID` with the scopes in the site-core README, "API token permissions"):
   ```
   rinsly content setup rinsly --env accp --fleet ~/Rinsly/Web/Core/fleet.json
   rinsly content setup rinsly --env accp --fleet ~/Rinsly/Web/Core/fleet.json --apply
   ```
   `--apply` creates the Access app for `accp.rinsly.com/api/rinsly/content`, one service
   token (file in `~/.config/rinsly/`, mode 600), the per-zone WAF rate-limit rule, an Ed25519
   key pair (private key stays on that machine) and the Worker secrets
   `RINSLY_ACCESS_TEAM_DOMAIN`, `RINSLY_ACCESS_AUD`, `RINSLY_CONTENT_SITE` (`rinsly`),
   `RINSLY_CONTENT_PUBLIC_KEYS`, `RINSLY_CONTENT_IP_SALT`. It never sets
   `RINSLY_CONTENT_ENABLED`. Do not use `--env prod`: prod has no endpoint.
4. **Hand over the key.** Yaron decides who holds the private key and the service-token file.
   Never put either in git, chat, a ticket or a log.
5. **Set `RINSLY_CONTENT_ENABLED=1` on the `rinsly-accp` Worker, last, on Yaron's OK.** Set it
   the way Fleet sets the other Worker secrets, never in `wrangler.jsonc`, never in git.
6. **Smoke test (reads and dry-runs only):** see "Use". A path outside the list must come back
   denied; a `set` without `--apply` must answer `dry-run`.

## Use

Environment for the CLI (site-core `rinsly` binary), on the operator's machine:
`RINSLY_CONTENT_SITE=rinsly`, `RINSLY_CONTENT_KEY_ID` (`rinsly.<yyyy-mm>`),
`RINSLY_CONTENT_PRIVATE_KEY_FILE`, `RINSLY_ACCESS_AUD`, `RINSLY_ACCESS_CLIENT_ID` and
`RINSLY_ACCESS_CLIENT_SECRET`. The CLI targets accp unless you pass `--prod`. `--locale` is
required (`nl` or `en`).

```
# read (returns the stored value and, for rows, the id path)
rinsly content get rinsly --collection pages --id 7 --path meta.title --locale nl
rinsly content get rinsly --collection pages --id 7 --path layout.<blockId>.header.title --locale nl

# change: dry-run first (default), --expect must be the current value
rinsly content set rinsly --collection pages --id 7 --path meta.title --locale nl \
  --value '"Nieuwe titel"' --expect '"Oude titel"'
# then the same command with --apply
```

Page ids on accp: home 1, privacy 2, voorwaarden 3, partnerprogramma 4, platform 5,
prijzen 6, website 7, over 8, contact 9, cases 10 (noindex, route 404s while
`RINSLY_CASES_PAGE_ENABLED` is off), website-laten-maken-woerden 11 (noindex).

Rules of use:

- **Every `--apply` publishes the page and starts a production rebuild** (`onContentPublished`
  triggers the static deploy). Batch edits; there is no draft state for endpoint writes.
- If an editor has a newer unpublished draft of that page, the write is refused (`conflict`).
- A stale `--expect` skips the write.
- Writes are audited in `content-audit` (30 days). Revert a change with another `set` whose
  `--expect` is the new value.
- The wording rules from Lawyer and Marketeer apply to what you write; the endpoint only moves
  strings.

## Kill switch

Fastest first:

1. Set `RINSLY_CONTENT_KILL=1` on the `rinsly-accp` Worker. The route answers 404 at once.
2. Remove `RINSLY_CONTENT_ENABLED`.
3. Revoke one key: add its id to `RINSLY_CONTENT_REVOKED_KEY_IDS`.
4. Disable the Access application or delete the service token in Cloudflare Access.
5. To remove a path for good: regenerate without it (or edit the spec) and merge the PR.

## Allowlist: regenerate or extend

`src/contentAllowlist.ts` is generated by `scripts/content-allowlist-ids.mjs` from the published
pages API of accp (`GET /api/pages?depth=0&draft=false&locale=nl|en`, public, no credentials).
The script only reads. It never touches a database, a secret or the endpoint. A local dev server on
a locally seeded database works the same way: `--url http://localhost:3000`.

```
node scripts/content-allowlist-ids.mjs                  # print the module
node scripts/content-allowlist-ids.mjs --check          # exit 1 when the file is stale
node scripts/content-allowlist-ids.mjs --write          # rewrite src/contentAllowlist.ts
node scripts/content-allowlist-ids.mjs --nl nl.json --en en.json   # offline, print/check only
```

Output depends only on the spec in the script and the ids found, not on the order the API
returns things. If a page or block is missing, appears twice, or has an empty heading, the script
stops instead of guessing.

- **Ids went stale** (someone rebuilt a layout, or a page was deleted and re-created): run
  `--write`, review the diff, open a PR. Until then the pinned writes are denied.
- **Add another pinned block field:** add an entry to `PINNED_BLOCKS` (page slug, block type,
  field path), run `--write`, extend `tests/unit/contentAllowlist.unit.spec.ts`, open a PR.
  Only text and textarea leaves work. Note the path in the table above.
- **Add a top-level field** (for example another `meta.*` text field): add it to `PAGE_SCALARS`.
  It then applies to every page.
- Every allowlist change is a content-endpoint change: Code Review and Security review it and
  **Yaron merges** (no auto-merge).
- Never loosen to `layout.*.header.title`; that opens every block heading on every page,
  including the legal pages.

## Tests

`pnpm test:unit` runs `tests/unit/contentAllowlist.unit.spec.ts`: the list is accepted by
site-core's own parser and matcher, only the pinned ids and fields pass (other ids, indexes,
wildcards, fields, collections and globals are rejected), the paths exist as writable text
leaves in the real pages schema, the generated file has no hand edits, and the generator's output
is deterministic.
