#!/bin/bash
# LOCAL D1 ONLY. Restores the accp-like state with the #122 drafts, runs the v5 migrations, re-runs, down/up, publish dry run,
# then publishes in the local copy for screenshots.
set -u
cd /workspace/builder-redesign-v5
export NODE_ENV=development PAYLOAD_SECRET=<any local throwaway value> COREPACK_HOME=/workspace/corepack-home
unset CLOUDFLARE_ENV
H=$(git rev-parse --short HEAD); L=/workspace/redesign-v5-work/logs/$H; mkdir -p $L
pkill -f "next dev -p 3115"; sleep 1
rm -rf .wrangler/state && cp -a /workspace/redesign-v5-work/state-after-122 .wrangler/state
cp /workspace/redesign-v5-work/zz-rerun-v5.tmp.ts /workspace/redesign-v5-work/zz-publish-drafts.tmp.ts scripts/
clean(){ sed 's/\x1b\[[0-9;]*m//g' | grep -v static-deploy | cut -c1-400; }
{
echo "== $(date -Iseconds) head $H, local D1 = accp-like snapshot + #122 migrations (170000, 190000) run on develop f66b208"
echo "== migrate:status (before)"; pnpm payload migrate:status 2>&1 | clean | grep -E "20261127"
echo "== migrate (up)"; pnpm payload migrate 2>&1 | clean
echo "== re-run up (idempotency)"; pnpm payload run scripts/zz-rerun-v5.tmp.ts up 2>&1 | clean | grep REPORT
echo "== re-run down (writes the #122 drafts back)"; pnpm payload run scripts/zz-rerun-v5.tmp.ts down 2>&1 | clean | grep REPORT
echo "== re-run down again (idempotency)"; pnpm payload run scripts/zz-rerun-v5.tmp.ts down 2>&1 | clean | grep REPORT
echo "== re-run up"; pnpm payload run scripts/zz-rerun-v5.tmp.ts up 2>&1 | clean | grep REPORT
echo "== migrate:down (both v5 migrations)"; pnpm payload migrate:down 2>&1 | clean
echo "== migrate (up again)"; pnpm payload migrate 2>&1 | clean
echo "== publish dry run (local D1, committed manifest)"; pnpm content:publish-refactor 2>&1 | clean
} > $L/local-d1.log 2>&1
pnpm payload run scripts/zz-publish-drafts.tmp.ts 2>&1 | grep '^published' > $L/local-publish-for-shots.log
rm -f scripts/zz-*.tmp.ts
(env -u CURSOR_AGENT -u CURSOR_TRACE_ID -u CURSOR_EXTENSION_HOST_ROLE pnpm dev -p 3115 > $L/dev.log 2>&1 &)
sleep 12
for p in /nl /nl/prijzen /nl/partnerprogramma /en /en/prijzen /en/partnerprogramma; do curl -s -o /dev/null --max-time 180 http://localhost:3115$p; done
cd /workspace/redesign-v5-shots && rm -rf $H && mkdir $H && node shot.mjs $H http://localhost:3115 /nl /nl/prijzen /nl/partnerprogramma /en /en/prijzen /en/partnerprogramma > $L/shots.log 2>&1
echo DONE $H
