/**
 * Break-glass password reset when the editor cannot use forgot-password mail
 * (Email Sending down, wrong inbox, etc.). Preferred path on accp:
 * /admin → Forgot password → branded reset mail (site-core ≥ 0.17.4) → still
 * enter TOTP (or a recovery code). This script never clears 2FA.
 *
 * Local:
 *   RESET_EMAIL=dev@rinsly.local RESET_PASSWORD='...' pnpm payload run scripts/reset-password.ts
 *
 * Accp D1 (wrangler login; NODE_ENV=production → real bindings):
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
