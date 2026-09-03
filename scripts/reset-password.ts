/**
 * Reset an admin user's password, e.g. after a forgotten login when the mail
 * path is unavailable. Prefer Payload's forgot-password flow on accp once
 * Cloudflare Email Sending is wired (see PLAN-admin-account-recovery.md).
 *
 * Local dev DB:
 *   RESET_EMAIL=dev@rinsly.local RESET_PASSWORD='...' pnpm payload run scripts/reset-password.ts
 *
 * Remote (accp) DB — NODE_ENV=production routes bindings to the real D1, the
 * same way seeding remotely works (requires a wrangler login):
 *   NODE_ENV=production PAYLOAD_SECRET=ignore RESET_EMAIL=yaron@rinsly.com \
 *     RESET_PASSWORD='...' pnpm payload run scripts/reset-password.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const email = process.env.RESET_EMAIL?.trim().toLowerCase()
const password = process.env.RESET_PASSWORD

if (!email || !password) {
  console.error('Set RESET_EMAIL and RESET_PASSWORD.')
  process.exit(1)
}
if (password.length < 8) {
  console.error('Choose a password of at least 8 characters.')
  process.exit(1)
}

const payload = await getPayload({ config: await config })

const { docs } = await payload.find({ collection: 'users', limit: 50, depth: 0 })
const user = docs.find((u) => u.email?.toLowerCase() === email)

if (!user) {
  console.error(`No user with email ${email}. Existing accounts:`)
  for (const u of docs) console.error(`  - ${u.email}`)
  process.exit(1)
}

await payload.update({
  collection: 'users',
  id: user.id,
  data: { password },
  overrideAccess: true,
})

console.log(`Password updated for ${email}. You can log in at /admin now.`)
process.exit(0)
