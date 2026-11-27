# Public /cases page

The `/nl/cases` and `/en/cases` routes stay off until there is written client
consent (Lawyer §13 P2-01). While the flag is off:

- both locales 404, stay `noindex`, and are omitted from `sitemap.xml`
- unauthenticated Payload API reads (`GET /api/pages`, including by slug, by
  id, with depth or locale, and GraphQL) do not return the cases
  document. The hide matches the slug `cases` and the seeded block anchors
  (`burojazz`, `up2brand`), so renaming the slug alone does not publish it.
- signed-in editors still see the document in the admin, and the seed row is
  kept so the page can be turned back on

The flag is `RINSLY_CASES_PAGE_ENABLED`. It is on only for `1`, `true`, or
`yes` (any case, surrounding space ignored). Anything else, including unset,
is off. Do not put it in `wrangler.jsonc`.

## Re-enable (after written client consent)

Both of these must be set. One without the other leaves `/cases` hidden on
accp or missing from the production static export.

1. **accp Worker var** — set `RINSLY_CASES_PAGE_ENABLED=1` on the
   `rinsly-accp` Worker (Cloudflare dashboard or `wrangler`, as a var, not a
   secret). Accp reads this at request time. Restart or redeploy the Worker
   so the new var is visible.
2. **Production static build env** — set the GitHub Actions repository
   variable `RINSLY_CASES_PAGE_ENABLED` to `1`. `deploy-prod.yml` forwards it
   into the static build. Then run a production deploy so `/cases` is
   included in the snapshot.

To turn it off again, remove both the Worker var and the Actions variable
(unset = off) and redeploy accp and prod.
