# Proof: redesign direction B v5 (not for merge)

Screenshots and logs for the rinsly.com PR "feat(redesign): direction B v5". This branch is an orphan proof branch; never merge it.

**v8 drafts PR: `v8-23633f5/`** (see its README).

**v5: `v5-169709f/` = PR head 169709f** (Marketeer/Lawyer review round: excl. btw on every plan price, P-03 note back, business-only line, reserved frame domains, no Cloudflare clause, Aanbevolen bar, axe fixes, tighter prijzen fold). Adds `compare/prijzen-en-*` and `logs/prijzen-fold-1440x900.txt`. Earlier runs: `v5-896bd12/`, `v5-4d3d17a/`, `v5-2e75da6-motion-recheck/`.

`v5-4d3d17a/` was rendered at feature commit 4d3d17a. The PR head 5987c8b differs from it only by
`src/migrations/20261127_200500_redesign_v5_content.json` (the drizzle snapshot lint:migrations wants), so the render is the same.

- `compare/`: v5 mockup (left) next to the render (right): `{home,prijzen,partner}-{desktop-fold,mobile-fold,desktop-full}.png`.
- `shots/`: `{nl,en}[-prijzen|-partnerprogramma]-{desktop,mobile}-{fold,full}.png` (1440x900, 390x844), plus `*-desktop-reduced-full.png` (prefers-reduced-motion: reduce).
- `checks.json`: per page, viewport and motion setting: CLS (after load and after scrolling the full page), whether `html.anim` is on, inline GSAP styles on the motion hooks, tap targets under 32px inside `<main>`, axe-core 4.12.1 (wcag2a, wcag2aa, wcag21aa) violations.
- `logs/local-d1.log`: the migrations on a LOCAL D1 (accp-like snapshot, #122 migrations run on develop f66b208 first): up, re-run (no-op), down, down again (no-op), up, migrate:down, migrate, and the publish dry run against the committed manifest.
- `logs/gates-5987c8b.out`: the box gates on the PR head.

Rendering: `next dev` on the box against that local D1, after publishing the v5 drafts in a throwaway copy of the local state (`local-publish-for-shots.log`). Nothing remote was written.

**Follow-up PR (Code Review nits on #126), head f724864:** `followups-f724864/`: gates, local D1 log, checks.json (axe/CLS, all 6 pages), three desktop fold shots, and `logs/gsap-blocked-check.json` + `shots/nl-desktop-gsap-blocked.png` (GSAP chunk requests aborted in the browser: `.anim` dropped, hero frames and step overlays at their final state).
