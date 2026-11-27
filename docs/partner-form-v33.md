# Partner form on terms v3.3 (Q7)

The invite-only `/partner` form asks for the two rungs a studio chooses under
terms v3.3 art. 5: **Eerste lijn** (+10%) and **Verkoop** (+10%). Basis 10% is
always on; Volume (+5% from five paying attributed end clients) is measured,
not chosen. The form shows the starting rate (10/20/30%) and the PA-05 caveat.

## Storage

Migration `20261127_190000_partner_v33_rungs` adds two columns to
`partner_aanvragen`: `eerste_lijn` and `verkoop`, INTEGER 0/1, default 0
(`DEFAULT false`, which SQLite stores as 0). Payload fields: `eersteLijn`,
`verkoop`. `down()` drops both. Rows filed before this migration get 0 and keep
their real old answers in `exclusiviteit` / `relatiebeheer` / `marketing`
(not backfilled: they applied under the old ladder).

**The migration runs on accp D1 when this PR is merged into `develop`**
(`deploy-accp.yml` → `deploy:database` → `payload migrate`).

## Contract with Ledger (`/api/partner-aanvraag/pending`, `/mark`)

There is no shared type. The site's `partnerRowSchema` (`src/lib/rows.ts`) and
Ledger's `RemoteApplication` (`src/integrations/partnerApplications.ts`)
describe the same JSON by hand. Until Ledger's go-live on v3.3, each pending
row carries **both**:

| JSON key | Meaning |
| --- | --- |
| `eersteLijn`, `verkoop` | v3.3 answers (new rows); `false`/`null` on rows from before the migration |
| `exclusiviteit` | always `false` on new rows (v3.3 has no exclusivity rung) |
| `relatiebeheer` | new rows: = `eersteLijn` (the old rung was "relation & first-line support") |
| `marketing` | new rows: = `verkoop` (the old rung for bringing in clients) |

`/mark` is unchanged. The old three are answers, not rates: Ledger's current
10/5/5 arithmetic on them is not the v3.3 share, and no v3.3 payout runs
before Ledger reads `eersteLijn` / `verkoop` (a separate Ledger change, with
Security).

## TODO(ledger-v33)

After Ledger has switched: stop writing the old three on new rows
(`legacyDutiesFromV33` in `src/lib/partnerLadder.ts`, the spread in
`src/endpoints/partnerAanvraag.ts`), drop them from `partnerRowSchema`, then
remove the legacy model in `partnerLadder.ts`. Keep the columns themselves for
the history of old applications. Board note: `partner-form-v33-legacy-fields`.
