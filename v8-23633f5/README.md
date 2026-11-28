# Proof: redesign round v8 drafts, PR head 23633f5 (not for merge)

- `compare/`: v8 mockup (left, NL only) next to the render (right): `{home,prijzen,partner}-{desktop-fold,mobile-fold,desktop-full}.png`.
- `shots/`: `{nl,en}[-prijzen|-partnerprogramma]-{desktop,mobile}[-reduced]-{fold,full}.png` (1440x900, 390x844; `-reduced` = prefers-reduced-motion: reduce).
- `crops/`: the hero frames at 2x (`*-figure@2x.png`): home phone, prijzen Live/Staging, partner portfolio, EN home and EN prijzen (EN gaps visible: empty save button, no Live/Staging labels).
- `checks.json` / `logs/shots.log`: per page, viewport and motion: CLS (after load, after scrolling the page), tap targets under 32px in `<main>`, axe-core 4.12.1 (wcag2a, wcag2aa, wcag21aa).
- `logs/local-d1-6723595.log`: the v8 migrations on a LOCAL D1 (accp-like snapshot + #122 + v5 migrations run on develop b424feb first): up, re-run (no-op), down, down again (no-op), up, migrate:down, migrate, publish DRY RUN against the committed manifest. 23633f5 differs from 6723595 only in two components (chip position, frame sizes), no migration or content change.
- `logs/gates-23633f5.out`: box gates on a clean worktree at 23633f5.

Rendering: `next dev` on the box against that local D1, in **draft view** (`?preview=1` with a throwaway local admin session on the local copy). Nothing was published, locally or remotely; nothing remote was written. In draft view RinslyMotion is off by design (`anim false`), so these shots show the final frame state.
