# accp pages snapshot

`accp-pages-nl.json` and `accp-pages-en.json` are `GET https://accp.rinsly.com/api/pages?depth=0&draft=false&locale=nl|en`
(public, published documents, no credentials), saved on 27 Nov 2026 (Europe/Amsterdam). Only the lexical
rich-text bodies are replaced by `{ "root": "<rich text omitted>" }`; every id and plain-text field is untouched.
`tests/unit/contentAllowlist.unit.spec.ts` uses them to prove each pinned row id belongs to the page its spec
names. Refresh them together with `src/contentAllowlist.ts` whenever `node scripts/content-allowlist-ids.mjs --write`
is run. The page hidden from the public API (cases) is not in the snapshot.
