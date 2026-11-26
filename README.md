# Rinsly

Company website for **Rinsly** (webontwikkeling & hosting) — a Payload CMS 3 +
Next.js 16 site deployed as a single Cloudflare Worker (admin + API + SSR
frontend) on D1 and R2, via OpenNext. Bilingual (nl/en) with Payload
field-level localization; routes live under `/[locale]/…`.

## Quick start

```bash
pnpm install
cp .env.example .env            # set PAYLOAD_SECRET (openssl rand -hex 32)
pnpm generate:types
pnpm payload migrate            # apply migrations to the local D1 mock
pnpm seed                       # pages + globals + a dev admin
pnpm dev
```

Then open:

- `http://localhost:3000/` → redirects to `/nl`
- `http://localhost:3000/nl` and `/en` — the site
- `/nl/platform`, `/nl/partnerprogramma`, `/nl/prijzen`, `/nl/website`, `/nl/over`, `/nl/contact` (+ `/en/…`)
- `http://localhost:3000/admin` — the CMS (`dev@rinsly.local` / `rinsly-dev`)

## Email consent retention

The public `/check` lead form and the contact quote wizard (`offertes`) can
store three columns when the visitor ticks the email-consent checkbox:
`consentGiven`, `consentAt` (ISO-8601 from the server clock) and `consentText`
(the exact label for the locale, from a server-side constant). The checkbox
is optional and starts unticked. Unticked submissions store `false` and nulls.

Keep those three fields for **5 years after the last email sent about that
submission**. There is no deletion job in this repo. A later cleanup can
select rows with `consentGiven = true` and null the three columns once the
last related mail is older than 5 years. `consentAt` is the moment of consent,
not that last-mail clock. Until outbound mail timestamps exist, use
`consentAt` as a query anchor together with a future last-mail field, and do
not delete on `consentAt + 5 years` alone.

## Deployment

The site is one Worker. Provision the Cloudflare resources noted in the TODOs at
the top of `wrangler.jsonc` (D1 database, R2 bucket, custom domain, edge
redirects for `rinsly.com → /en` and `rinsly.nl → /nl`), then:

```bash
pnpm run deploy       # migrate remote D1 + build & deploy the worker
```

## Structure

- `src/payload.config.ts` — site config on top of `@rinsly-com/site-core`
  (extra collections, blocks, endpoints, D1 + R2).
- `src/blocks/` — site-specific blocks (diagram, revenue calculator). Shared
  blocks (hero, services, pricing, …) live in the engine.
- `src/app/(frontend)/[locale]/` — the localized frontend routes.
- `src/app/(payload)/` — the Payload admin panel + REST/GraphQL API.
- `scripts/seed.ts` — seeds the pages, globals and a dev admin.
