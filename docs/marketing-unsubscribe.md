# Marketing mail unsubscribe

One-click unsubscribe for visitor and marketing mail, at `/{locale}/afmelden`
(Dutch and English). Built so withdrawing consent is as easy as giving it
(AVG 7(3), EDPB Guidelines 05/2020 paras. 114–116) and so a mail client can
POST per RFC 8058.

This document is the contract for the mail script (`send_smtp.py`, edited
outside this repo and not changed here) and for the Fleet / Yaron steps that
this PR cannot do.

## Behaviour

- `GET` or `HEAD /{nl|en}/afmelden?token=…` shows a confirm page in the
  normal site header and footer, with the existing card pattern, roughly
  vertically centred. It never records an opt-out (prefetch-safe).
- `POST` to the same URL records the opt-out when the token is valid:
  - body `List-Unsubscribe=One-Click` (RFC 8058) is rewritten to
    `/{locale}/afmelden/one-click` and returns success HTML directly (no
    confirm page);
  - the confirm form on the GET page (a server action) is for humans who
    opened the body link.
- A second POST is still a success. Invalid tokens do not write. Missing
  secret or missing store fails closed (503) and points the visitor to
  contact@rinsly.com.
- Bare `/afmelden` redirects to `/nl/afmelden` (query string kept).
- The page is `noindex, nofollow`. The URL and the token contain no email
  address or other PII.

Until the D1 table and the HMAC secret exist, POST cannot persist and returns
503. Do not send marketing mail until those steps and the mail-script link
are in place, and Lawyer has checked one sample mail.

## Token contract

Format: `v1.<emailHash>.<signature>`.

Both values are HMAC-SHA256, base64url without padding, keyed by
`UNSUBSCRIBE_TOKEN_SECRET`:

- `emailHash = HMAC-SHA256(secret, "unsub-id:v1:" || normalized_email)`
- `signature = HMAC-SHA256(secret, "unsub-sig:v1:" || emailHash)`

Each part is 43 characters of unpadded base64url (`[A-Za-z0-9_-]` only).
Verify rejects a bad charset, the wrong length, an extra segment, or an
empty part before any HMAC work. A well-formed signature is still compared
in constant time.

Normalized email: trim, lowercase, exactly one `@`, non-empty local and
domain parts, no spaces. The mail script should normalize the same way
(`send_smtp.normalize_recipient` already lowercases after parseaddr).

Tokens do not expire. Mint and verify share a pinned test vector in
`tests/unit/unsubscribeToken.unit.spec.ts`. A later Python mint must assert
the same vector; if it fails, fix the encoding, do not change only one side.

URL: `{origin}/{locale}/afmelden?token={token}`.

Suggested headers once the mail script adopts the link:

```
List-Unsubscribe: <{url}>, <mailto:contact@rinsly.com?subject=unsubscribe>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

Plus a visible afmeldlink in the body (the helper under the offerte tick
already promises one). Tw 11.7 lid 7 identity belongs in the mail, not on
this page; that footer is owned by the mail script.

## Proposed migrations (not in this PR)

Yaron's OK is required before any migration is written or applied. No
remote D1 write in this work.

### 1. `marketing_optouts` (new table)

Minimal DNC record (register R2). Hash only: the raw email is not stored,
because the token cannot carry it without putting PII in the URL. The mail
script matches a recipient by computing the same HMAC. A later box job can
join hashes to `send-log.csv` (and similar) to fill domain / company for
Outreach `opt-out.json`.

```sql
CREATE TABLE `marketing_optouts` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email_hash` TEXT NOT NULL,
  `opted_out_at` TEXT NOT NULL,
  `source` TEXT NOT NULL,
  `locale` TEXT,
  `token_version` INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX `marketing_optouts_email_hash_idx`
  ON `marketing_optouts` (`email_hash`);
```

- `email_hash`: the token's `emailHash` (base64url HMAC, 43 characters).
- `opted_out_at`: server clock, ISO-8601.
- `source`: `one-click` | `confirm` (mailto / contact@ can be added later).
- `locale`: `nl` | `en` when known, else NULL.
- `token_version`: `1`.
- Unique on `email_hash`: a repeat opt-out is a no-op.
- No UPDATE of existing offerte consent rows (the 5-year proof stays).
- Retain for as long as needed to honour the objection (art. 21(3)); do not
  expire these rows with the 12-month lead cleanup.

After the table exists, replace `UnavailableUnsubscribeStore` with a D1
adapter and add an authenticated pull of the hash list for `build_dnc.py` /
`send_smtp.py`. That pull can wait for the same migration PR.

### 2. `offertes.consent_version` (new column)

The offerte form already stores the exact label in `consent_text` (#96).
There is no version id today. Lawyer called this a should, not a merge
blocker. Proposed additive, nullable column only (existing rows stay NULL):

```sql
ALTER TABLE `offertes` ADD `consent_version` TEXT;
```

Code already has `EMAIL_CONSENT_VERSION` (`2026-11-26`) and
`EMAIL_CONSENT_CHANGELOG` (label + withdrawal helper). Once the column
exists, `emailConsentFromSubmission` should also store that version when
the box is ticked. Do not change already-stored `consent_text`.

## People's / Fleet setup steps

Do not do these from this PR.

1. **Secret.** Create a long random `UNSUBSCRIBE_TOKEN_SECRET` and set it as
   a Worker secret on `rinsly-accp` (and later prod if that worker gets the
   route). Put the same value on the box for the mail script, in the usual
   secrets store, not in git. Never put it in wrangler vars, this repo, or
   chat. This PR only declares the name.
2. **Zone routes** (dashboard, same pattern as `rinsly.com/check/*` →
   `rinsly-accp`), because the public static worker has no runtime:
   - `rinsly.com/nl/afmelden*`
   - `rinsly.com/en/afmelden*`
   - the same paths on `www.rinsly.com` if www is served
3. **Migration apply** only after Yaron OKs the schema and the follow-up
   PR is merged: normal Outreach/site deploy path. No hand `d1 execute`.
4. **Mail script** (parallel work, not this PR): mint the token, add the
   HTTPS link + `List-Unsubscribe` / `List-Unsubscribe-Post`, keep Tw 11.7
   lid 7 identity, and later suppress sends whose HMAC is in the opt-out
   list. Then send one sample to Lawyer. No marketing mail until then.
5. **Privacy statement** (later content change): once the link is live, add
   it as an opt-out channel in §8, and consider Lawyer's tighter §3 sentence
   on the optional offerte tick. Not in this PR.
6. Do not create a CMS page with slug `afmelden`. The static export would
   shadow the worker route.

## Copy (approved)

Approved by Lawyer + Marketeer on 27 Nov 2026, 23:36 (Europe/Amsterdam).
Strings live in `src/lib/unsubscribeCopy.ts` (`approved-lawyer-marketeer`).
Dutch uses je, not u.

| Key | NL | EN |
|---|---|---|
| title | Afmelden | Unsubscribe |
| confirm | Wil je geen marketingberichten van Rinsly meer ontvangen? | Do you want to stop receiving marketing messages from Rinsly? |
| button | Ja, meld mij af | Yes, unsubscribe me |
| cancel | Annuleren | Cancel |
| success | Je bent afgemeld voor marketingberichten van Rinsly. | You have been unsubscribed from Rinsly marketing messages. |
| success follow-up | Je ontvangt alleen nog berichten die nodig zijn voor een lopende opdracht, zoals facturen. Meer informatie: rinsly.com/nl/privacy (sectie 8). | You will only receive messages needed for an ongoing assignment, such as invoices. More information: rinsly.com/en/privacy (section 8). |
| home link | Terug naar rinsly.com | Back to rinsly.com |
| invalid | Deze link is niet geldig. Je kunt je ook afmelden via contact@rinsly.com. | This link is not valid. You can also unsubscribe by emailing contact@rinsly.com. |
| unavailable | Afmelden is nu niet mogelijk. Mail naar contact@rinsly.com. We lossen dit zo snel mogelijk op. | Unsubscribe is not available just now. Email contact@rinsly.com and we will fix this as soon as we can. |

The follow-up's "rinsly.com/nl/privacy" / "rinsly.com/en/privacy" is a link
to `/nl/privacy` or `/en/privacy`. The wording is otherwise unchanged.

Do not add an "all channels" / LinkedIn / phone line until DNC sync is
automatic (Lawyer). The pending sentences are documented as a comment on
`UNSUBSCRIBE_ALL_CHANNELS_LINE_PENDING`.

## Rollback

Revert the PR. There is no migration to undo and no secret set by this work.
