# Migration brief — the partner-first repositioning

**For the agent working in `~/Rinsly/Web/Site`.** Written 4 August 2026, when Rinsly's
strategy changed.

**The content work is already done** — `scripts/seed.ts` now carries the partner-first
one-pager, and the labels in `OfferteForm.tsx` and `Offertes.ts` say Growth. What is left
here is schema and configuration, which needs a Payload migration and a deploy, and was
therefore left to this repo.

Read `~/Rinsly/Marketing/POSITIONING.md` and `PRICING.md` for the why and the numbers.
Short version: Rinsly now sells through **design studios** (partners) who bring the end
customer. The end customer's agreement is always with Rinsly, but the invoice may come
from Rinsly or from the partner — the partner chooses. The site speaks to partners first,
end customers second.

## What already changed in this repo

- `scripts/seed.ts` — new home layout: hero (partner-first) → platform → partner
  programme → leads → CTA → about → client pricing with quotas → build note → FAQ
  → contact. New nav and footer. The €249 tier is **Growth**. The `voorwaarden` page
  gained a minimum-term paragraph so "maandelijks opzegbaar" is no longer stated
  unconditionally. `legalRich`/`LegalNode` were renamed to `proseRich`/`ProseNode`
  because the home page now uses them too.
- `src/components/OfferteForm.tsx` — the €249 option is labelled **Growth**; the stored
  `value` is still `partner`.
- `src/collections/Offertes.ts` — same, admin label only.
- `src/app/(frontend)/[locale]/partner/page.tsx` — lede now covers the two billing setups
  and the payout rhythm.
- **Second round** (same session, after further decisions): the payout rhythm changed from
  quarterly to *the client's own billing interval, once the client has paid*; resale by
  partners is now allowed, so the price claim is "this is what you pay Rinsly" rather than
  "the same either way"; the lead product became *an allocation included with the
  partnership plus extra on demand*, so **all lead prices came off the page** (they are
  unset on purpose); the `voorwaarden` invoicing clause now says "per maand of per jaar"
  instead of offering a quarterly option Ledger cannot do; and the privacy statement gained
  a **section 7** — the art. 14 notice for businesses whose website was measured — with
  sections 7–10 renumbered to 8–11 and the "we do not share data with third parties"
  sentence corrected, because sharing leads with partners would have made it false.

`npx tsc --noEmit` and `eslint` pass. `pnpm seed` was run against the **local** D1 mock
and the result was checked by rendering `/nl` and `/en` — partner hero, the 0% ladder as a
list, the leads section, the client tiers with quotas, Growth everywhere, and the
minimum-term answer in the FAQ all render in both locales. Repeated runs are idempotent.
The privacy pages were rendered and checked in both locales too.

**Nothing has been deployed.** The remote `accp` D1 and the static export are untouched;
`pnpm seed` against the remote database and then the static rebuild are your calls to
make.

### The D1 parameter limit — read before adding blocks

Getting the new layout to seed at all ran into a hard platform limit, and it is worth
knowing before you extend this page.

**D1 allows at most 100 bound parameters per query.** Payload writes version rows in
batches of ten, and `_pages_v_blocks_pricing_tiers` costs **11 parameters per row** — so
ten tier rows is 110 parameters and the seed dies with `D1_ERROR: too many SQL variables`.
Rows are per locale, so four tiers across nl+en is 8 rows and fits; the original layout
was right at the edge without anyone knowing.

The leads section was therefore built as a **`services` block, not a second `pricing`
block** — three more tiers would have been 14 rows. There is a comment saying so in
`scripts/seed.ts`; please leave it there. **The page can carry exactly one `pricing`
block with at most four tiers.** If a second price table is ever genuinely needed, the
fix is upstream (chunk smaller in the adapter, or shrink the tier field set), not more
tiers.

A related wrinkle: when the stored layout is *larger* than the incoming one, a
locale-by-locale update can briefly snapshot a mix of old and new rows and trip the same
limit on the **first** run, then succeed on the second. That is what happened locally. If
the first remote seed fails this way, re-running it is a legitimate fix — but read the
error and confirm it is this and not a schema problem.

## 0. The website phase — what was built, and the three schema follow-ups

The site was turned from a one-pager into **seven pages plus the two legal ones** (see
`.ai/SITES.md` for the map), the quote wizard was forked by audience, and EU data residency
was added as an offer. Three parts of that are working around a missing schema, and each is
a small, well-defined change for whoever is next.

**a. `euData` has no column.** The wizard's client branch asks whether the client wants
their database and files in the EU, and — because `Offertes` has no field for it — prepends
`[Database en bestanden in de EU]` to the free-text `bericht` so it cannot be silently lost.
It deserves a real checkbox field, because it drives an **irreversible** build-time decision
(the R2 and D1 jurisdictions are set at creation). While you are there, `ADDITIONS` in
`src/endpoints/offerte.ts` is a validated allowlist, so a new addition needs both ends.

**b. The partner qualification answers have no columns.** `POST /api/partner-interesse` (new,
in `src/endpoints/partnerAanvraag.ts`) writes a `partner-aanvragen` row for a studio that
arrived on `/contact` with no invite token. `figmaSeat` has a column; *"do you build sites
yourselves"* and *"do you already sell hosting"* do not, so they are written into `opmerking`
as `Bouwt zelf websites: JA/nee`. Those two answers are the ones that decide whether there is
a deal at all — they should be real, filterable booleans.

**c. That endpoint's `domein` is unverified.** The token-gated `partnerAanvraagHandler` takes
the domain from the signed link, which is the anti-replay guarantee. The public one takes it
from the body, so those rows are **self-reported leads, not verified studios**. Worth a flag
on the row (or a distinct status) so the review queue shows which is which, rather than
relying on the `Zelf aangemeld via /contact.` prefix in the note.

Nothing here is urgent; all three work today. They are listed because each one is a place
where the data model is currently less honest than the form.

## 1. The Offertes plan enum: `partner` → `growth`

`src/collections/Offertes.ts:38` and `src/endpoints/offerte.ts:6,54` still store and
validate the value `'partner'` for the €249 tier. Only the labels moved, because the
stored value is a select enum in D1 and changing it needs a migration.

To finish it:

- The option value in `Offertes.ts`, the `SUBSCRIPTIONS` array in `endpoints/offerte.ts`,
  its union type, and `value` in `components/OfferteForm.tsx`.
- `payload migrate:create`, then — **this is the dangerous part** — read the generated SQL
  before applying it. Per `CLAUDE.md`: always run `pnpm lint:migrations` and review any
  `INSERT ... SELECT` against the *previous* migration's `.json` snapshot, because
  drizzle-kit can emit a table-recreate that SELECTs the new table's columns from the old
  one, and SQLite silently turns unknown double-quoted identifiers into string literals,
  corrupting every row instead of failing.
- An `UPDATE` for existing `Offertes` rows holding `'partner'`.
- Coordinate with `~/Rinsly/ledger/FACILITATOR-MIGRATION.md`: Ledger has the same rename
  in its own `Plan` type, and quotes flow from here into the books. Ledger's brief
  suggests accepting `'partner'` as a read alias for one release; if it does, the order
  stops mattering.

Low urgency — nothing user-visible says Partner any more. Do it when you are already in a
migration.

## 2. Quotas in the quote flow

Subscriptions now carry stated maxima, and the pricing section on the home page shows
them:

| Plan | Media | Database | Requests/mo |
| --- | --- | --- | --- |
| Care | 5 GB | 250 MB | 1M |
| Managed | 25 GB | 1 GB | 5M |
| Growth | 100 GB | 5 GB | 25M |
| Op maat | custom | custom | custom |

Right now those numbers live only in the seeded copy. Worth considering, in this order:

1. Nothing. The quotas are marketing copy in the CMS and a clause in the offerte; the
   site does not need to know them. **This is a perfectly good answer.**
2. The quota figures as constants shared by `OfferteForm.tsx` and the pricing block, so a
   change lands in one place instead of four localised strings.
3. Fields on `Offertes` capturing what was agreed for an Op maat client. Only if quotes
   for those clients are actually being written here rather than in the PDF skill.

Cloudflare's own costs must never appear in anything public. They are in
`Marketing/PRICING.md` and they stay there.

## 3. `/partner`: keep it invite-only?

`/[locale]/partner` is `noindex` and token-gated, on the reasoning that every visit should
come from an invitation. That was written when the partner programme was a side channel.
It is now the company's main proposition, and the home page sends people to `#partner` —
a section, not that page.

The decision to make, not blindly change:

- **Keep it gated.** The page is a *configurator*, not a pitch: it prefills from a signed
  token minted by Lens and lets a recruited studio pick its responsibilities. A stranger
  filling it in has no value. The home page carries the pitch, and the token flow is what
  makes "the ladder is not negotiated per partner" credible.
- **Add a public sibling.** A crawlable partner page for studios who find Rinsly by
  search, with the ladder and a normal application form (`PartnerAanvragen` already
  exists), while `?token=` keeps the prefilled configurator.

If you add a public page, it needs to be indexable, in both locales, in the nav, and in
the sitemap — and `Marketing/PARTNER-PITCH.md` is the copy to build it from. Do not
simply drop the `noindex` on the existing page: a token-gated form in the search index is
worse than either option.

## 4. Small consistency items

- `README.md` in this repo still describes the site as *"webontwikkeling & hosting"* and
  lists the old page set (`/nl/diensten`, `/nl/over`, `/nl/contact`). The one-pager
  anchors are now `platform`, `partner`, `leads`, `prijzen`, `over`, `faq`, `contact`.
- The `note` block on the home page used to say Rinsly adapts its stack to the client's
  preference. That is gone: it contradicted the one-engine-one-fleet argument the whole
  positioning now rests on. Do not reintroduce it.
- `src/email/` templates and any confirmation copy referring to a "Partner" plan should be
  checked for the tier name.
- The loose working notes (`analisation-0*.md`, `sla-op-maat-concept*.md`,
  `legal-review-*.md`) predate the change. The SLA work is still valid — it is Op maat
  material — but the legal review looked at terms that now have an extra minimum-term
  paragraph. Flag the new clause if the review is ever revisited; it was drafted here, not
  by a lawyer.
