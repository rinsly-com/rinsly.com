# Claude Code

Rinsly's company website — Payload CMS 3 + Next.js 16, deployed as a single
Cloudflare Worker (admin + API + SSR frontend) on D1 (database) and R2 (media),
via OpenNext. Content is bilingual (nl/en) using Payload field-level
localization; the frontend routes live under `/[locale]/…`.

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md`, then `.claude/skills/payload/reference/`.

## Local development

```
pnpm install
pnpm generate:types              # cloudflare-env.d.ts + payload-types.ts
pnpm payload migrate             # apply migrations to the local D1 mock
pnpm seed                        # seed pages + globals + a dev admin
pnpm dev                         # http://localhost:3000  (/, /nl, /en, /admin)
```

The dev admin created by the seed is `dev@rinsly.local` / `rinsly-dev`.

## Localization

- Locales are `nl` (default) and `en`; untranslated fields fall back to Dutch.
- The slug is shared across locales (the URL path); only `title` and `layout`
  are localized. URLs read `/nl/diensten`, `/en/diensten`, etc.
- Add content per locale via the admin locale switcher (top-right in the panel).

## Database migrations (D1/SQLite)

After `payload migrate:create`, ALWAYS run `pnpm lint:migrations` and review any
`INSERT ... SELECT` in the generated file against the **old** schema (the previous
migration's `.json` snapshot). drizzle-kit can generate table-recreate copies that
SELECT the *new* table's columns from the *old* table; SQLite then silently treats
each unknown double-quoted identifier as a string literal and corrupts every row
instead of failing (https://sqlite.org/quirks.html#dblquote). The linter (also run
by `deploy:database`) catches this statically.

## Deploy (once Cloudflare resources exist)

See the TODOs in `wrangler.jsonc`. Then `pnpm run deploy` (migrates the remote D1,
then builds + deploys the worker with OpenNext).
