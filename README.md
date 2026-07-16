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
- `/nl/diensten`, `/nl/over`, `/nl/contact` (+ `/en/…`)
- `http://localhost:3000/admin` — the CMS (`dev@rinsly.local` / `rinsly-dev`)

## Deployment

The site is one Worker. Provision the Cloudflare resources noted in the TODOs at
the top of `wrangler.jsonc` (D1 database, R2 bucket, custom domain, edge
redirects for `rinsly.com → /en` and `rinsly.nl → /nl`), then:

```bash
pnpm run deploy       # migrate remote D1 + build & deploy the worker
```

## Structure

- `src/payload.config.ts` — collections (Users, Media, Pages), globals
  (Header, Footer), localization, D1 + R2 + SEO.
- `src/blocks/` + `src/components/frontend/blocks/` — the page-builder blocks
  (hero, services, pricing, cta, contact, accordion, buttonRow, richText).
- `src/app/(frontend)/[locale]/` — the localized frontend routes.
- `src/app/(payload)/` — the Payload admin panel + REST/GraphQL API.
- `scripts/seed.ts` — seeds the four pages, globals and a dev admin.
