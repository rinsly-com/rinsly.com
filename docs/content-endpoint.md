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

Collection `pages`, plus two fields of the `footer` global (below). No other global (the header
stays closed), no other collection, no `title`, `slug`, `meta.noindex`, `meta.image`, no rich
text.

**Send row-id paths.** The allowlist check runs on the path exactly as sent, before the endpoint
canonicalizes it. A path with an array index (`layout.3.tiers.0...`) is therefore denied.
`rinsly content get <slug> --path <index path>` returns the row-id path to use.

| Path | Meaning | Scope |
| --- | --- | --- |
| `meta.title` | SEO title | **Every page, both locales.** A top-level path cannot be scoped to one page. |
| `meta.description` | SEO description | Same. |
| `layout.<blockId>.header.title` (website hero) | `/website` H1 | That one block, per locale |
| `layout.<blockId>.header.title` (contact block) | Heading above the contact form | That one block, per locale |
| `layout.<blockId>.text` (partner check-CTA) | `/partnerprogramma` check-button body text | That one CTA (the block whose button URL is `/check`), per locale. The closing CTA on the same page is not pinned. |
| `layout.<blockId>.header.eyebrow` / `.title` / `.intro` (Woerden hero) | `/website-laten-maken-woerden` hero plain text | That one hero, per locale |
| `layout.<blockId>.header.eyebrow` / `.title` / `.intro` (Woerden services) | Woerden “how we work” heading and intro | That one services block, per locale |
| `layout.<blockId>.cards.<cardId>.title` / `.description` (Woerden services) | Woerden service card title and text | Each of the three cards, per locale, pinned by row id |
| `layout.<blockId>.header.eyebrow` / `.title` (Woerden FAQ) | Woerden FAQ section eyebrow and title | That one accordion, per locale |
| `layout.<blockId>.items.<itemId>.title` (Woerden FAQ) | Woerden FAQ question | Each of the two questions, per locale, pinned by row id. Answers (`body`) are rich text and are not pinned. |
| `layout.<blockId>.header.eyebrow` / `.title` (Woerden regio) | Woerden regio section eyebrow and title | That one richText block, per locale. The body (`content`) is rich text and is not pinned. |
| `layout.<blockId>.eyebrow` / `.title` / `.text` (Woerden page CTA) | Woerden closing CTA plain text | That one CTA, per locale |

Batch A (copy plan section 1, scalar text; plan ids in brackets). Every path is pinned to one row by
row id; the generator picks tiers, features, FAQ items and buttons by their position in the
published document at generation time only.

| Path | Meaning | Scope |
| --- | --- | --- |
| `layout.<pricingId>.tiers.<tierId>.features.<featureId>.text` | `/prijzen` feature lines [P2-02, P2-17] | Care feature 7 and 9, Op maat feature 3, per locale. No other tier or feature, no price, name or badge. |
| `layout.<pricingId>.header.intro` | `/prijzen` pricing intro [P2-07] | That one block, per locale |
| `layout.<accordionId>.items.<itemId>.title` | `/prijzen` FAQ question 6 [P2-02]; `/platform` FAQ question 5 [P2-11] | One row each, per locale. Answers (`body`) are rich text and stay refused. |
| `layout.<ctaId>.title` / `.text` | `/prijzen` closing CTA [P2-02] | That one CTA, per locale |
| `layout.<ctaId>.text` | `/website` CTA [P2-02] | That one CTA, per locale |
| `layout.<heroId>.header.intro` | `/website` [P2-04] and `/partnerprogramma` [P2-03] hero intro | Those two heroes, per locale. The `/website` hero H1 was already pinned. |
| `layout.<calcId>.title` | `/partnerprogramma` calculator title [P2-16] | That one block, per locale |
| `layout.<heroId>.buttons.<buttonId>.label` | `/` hero button 2 [P2-06] | That one button, per locale. URL and variant stay refused. |
| `layout.<ctaId>.title` / `.text` | `/` platform CTA [P2-14, P2-15] (the CTA whose button targets page 5) | That one CTA, per locale |
| `layout.<contactId>.header.title` / `.intro` | `/over` data block [P2-10] | That one block, per locale |
| `layout.<diagramId>.title` | `/platform` diagram title [P2-14] | That one block, per locale |

Footer global (`kind: global`, slug `footer`). The endpoint and site-core already support
globals: the allowlist has a `globals` map, and the footer is an unversioned global that is
written in place with a pending audit row before the write (no draft or version step). Only these
are pinned:

| Path | Meaning | Scope |
| --- | --- | --- |
| `menuItems.<rowId>.label` | Footer menu item 4 label [P2-06] | That one row, per locale (a different row id per locale) |
| `copyright` | Footer copyright line [P2-22] | The same path in both locales |

Footer identity (`kvk`, `btw`, `email`, `tagline`, `logo`, `infoLinks`) and every menu `url` stay
refused [P2-23]. The header global is not allowlisted.

Marketeer's four SEO pages are /website (id 7), /prijzen (id 6), /over (id 8) and
/partnerprogramma (id 4). Because `meta.*` is allowed everywhere, it also reaches the noindex
legal pages (privacy id 2, voorwaarden id 3) and the published noindex pages cases (id 10) and
Woerden (id 11). These are published, not drafts, so a `meta.*` write to them is accepted:
it publishes the page and starts a production rebuild like any other write. Accepted in the
plan (`PLAN.md` step 2); the audit table records every write.

Not covered, on purpose:

- Rich text (page body paragraphs, the Woerden regio section body, FAQ answers). A write is
  refused unless the stored value is one plain paragraph. Needs the rich-text codec (plan Part C).
- Privacy and voorwaarden body text, and any other field on those legal pages besides the
  already-global `meta.title` / `meta.description`. No legal-page block is pinned.
- The first step of the quote wizard ("Wie ben je?") is hard-coded in `OfferteForm.tsx`, not in
  the CMS. The pinned "contact" heading is the section heading above the form ("Vertel wat u
  nodig heeft" / "Tell us what you need").
- Adding, removing or reordering blocks and rows.
- Tier names, prices, badges and any other pricing field; every other FAQ row.

The generator pins each path by Payload row id (the block id, and for cards and FAQ questions
the array row id too). The id of a row is stable since the seed lock (#100: the seed never
rewrites a published page that has a layout). If a layout is ever rebuilt, its blocks get new
ids, the pins match nothing, and the endpoint denies the write (fail closed). Regenerate (below).

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
The script also reads `GET /api/globals/footer?depth=0&draft=false&locale=nl|en`. It only reads. It never touches a database, a secret or the endpoint. A local dev server on
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
  field path). When the page has more than one block of that type, add a `match` (`path` +
  `equals`, string or number) so the script can pick exactly one. To pin a field on every row of a
  `cards` or `items` array, set `rows` to that field name and put the leaf on `field`. To pin one
  nested row, set `pick` (`[{ rows: 'tiers', index: 0 }, { rows: 'features', index: 6 }]`); the
  pin is the row ids, so a later reorder cannot retarget it. For the footer add a `PINNED_GLOBALS`
  entry (only the `footer` global is supported; offline `--nl/--en` files are
  `{ docs, globals: { footer } }`). Never add a
  `privacy` or `voorwaarden` slug, and never pin a rich-text leaf (`content`, `body`). Run
  `--write`, extend `tests/unit/contentAllowlist.unit.spec.ts`, open a PR. Only text and
  textarea leaves work. Note the path in the table above.
- **Add a top-level field** (for example another `meta.*` text field): add it to `PAGE_SCALARS`.
  It then applies to every page.
- Every allowlist change is a content-endpoint change: Code Review and Security review it and
  **Yaron merges** (no auto-merge).
- Never loosen to `layout.*.header.title`; that opens every block heading on every page,
  including the legal pages.

## Tests

`pnpm test:unit` runs `tests/unit/contentAllowlist.unit.spec.ts`: the list is accepted by
site-core's own parser and matcher, only the pinned ids and fields pass (other ids, indexes,
wildcards, fields, collections and globals (other than the two footer paths) are rejected, as are rich-text leaves and privacy or
voorwaarden block paths), the paths exist as writable text leaves in the real pages schema, the
generated file has no hand edits, and the generator's output is deterministic.
The same spec asserts page ownership against a committed snapshot of the public accp pages API
(`tests/unit/fixtures/accp-pages-nl.json` / `-en.json`, depth 0, rich text bodies omitted): every
pinned block id and row id belongs to the page its spec names, in its own locale, and the real
privacy and voorwaarden block ids are never allowlisted. The footer pins are checked the same way against `accp-footer-nl|en.json` (identity fields left out). Refresh the snapshot together with
`--write` (see `tests/unit/fixtures/README.md`).
