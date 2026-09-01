#!/usr/bin/env node
/**
 * Zero-downtime static production deploy: upload a Worker version (full asset set),
 * then route 100% traffic to it. Replaces bare `wrangler deploy`, which uploads
 * and cuts over in one step and can serve mixed HTML/JS mid-upload.
 *
 *   pnpm run build:static && node scripts/deploy-static.mjs
 *
 * CI tag: ci-<12-char GITHUB_SHA>-<GITHUB_RUN_ID> (unique per workflow run).
 * Override with DEPLOY_VERSION_TAG / DEPLOY_VERSION_MESSAGE.
 *
 * Plan: Web/Core/PLAN-zero-downtime-deploys.md
 * WfP: set DISPATCH_NAMESPACE (e.g. rinsly-fleet) to upload into a dispatch
 * namespace instead of the account Worker cap. PLAN-workers-for-platforms.md §7.
 */

import { execFileSync } from 'node:child_process'

const CONFIG = 'wrangler.static.jsonc'

const dispatchNs = process.env.DISPATCH_NAMESPACE?.trim() || ''

const tag =
  process.env.DEPLOY_VERSION_TAG?.trim() ||
  (process.env.GITHUB_SHA
    ? `ci-${process.env.GITHUB_SHA.slice(0, 12)}${process.env.GITHUB_RUN_ID ? `-${process.env.GITHUB_RUN_ID}` : ''}`
    : `local-${Date.now()}`)

const message =
  process.env.DEPLOY_VERSION_MESSAGE?.trim() ||
  (process.env.GITHUB_SHA ? `ci ${process.env.GITHUB_SHA.slice(0, 12)}` : `deploy ${tag}`)

const run = (args) =>
  execFileSync('pnpm', ['exec', 'wrangler', ...args], {
    stdio: 'inherit',
    env: process.env,
  })

if (dispatchNs) {
  // User Workers in a dispatch namespace: wrangler deploy --dispatch-namespace.
  // versions upload/deploy does not accept --dispatch-namespace (wrangler 4.x);
  // WfP user Workers also lack gradual-deploy parity (PLAN-workers-for-platforms §7).
  console.log(`deploy-static: namespace deploy → ${dispatchNs}`)
  run(['deploy', '--config', CONFIG, '--dispatch-namespace', dispatchNs])
  process.exit(0)
}

console.log(`deploy-static: upload tag=${tag}`)
run([
  'versions',
  'upload',
  '--config',
  CONFIG,
  '--tag',
  tag,
  '--message',
  message,
])

console.log(`deploy-static: route 100% → ${tag}`)
run([
  'versions',
  'deploy',
  '--config',
  CONFIG,
  '--version-tag',
  tag,
  '--percentage',
  '100',
  '-y',
])
