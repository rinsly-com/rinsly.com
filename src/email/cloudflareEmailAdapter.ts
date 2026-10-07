import { createCloudflareEmailSendingAdapter } from '@rinsly-com/site-core/email/cloudflareEmailSending'

import { getBindings } from '../lib/bindings'

/**
 * Payload e-mail adapter on Cloudflare Email Sending (the EMAIL send_email
 * binding in wrangler.jsonc). Sender domain rinsly.com is onboarded (DKIM on
 * the cf-bounce selector), so DMARC aligns for noreply@rinsly.com.
 *
 * Powers Payload's own auth mails (forgot password, verification) and the
 * submission notifications in the offerte/check endpoints via
 * payload.sendEmail. When the binding is absent (local `next dev` without the
 * Workers runtime mock, or an older deploy) the mail is logged instead of
 * sent, mirroring Payload's no-adapter behaviour without breaking the caller.
 *
 * Wrangler types EMAIL as SendEmail. send() is overloaded on
 * EmailMessage | EmailMessageBuilder, which does not overlap
 * `(msg: Record<string, unknown>) => ...`, so intersecting CloudflareEnv
 * with that shape is TS2352. Narrow from unknown instead.
 */
function isSendEmail(value: unknown): value is SendEmail {
  if (typeof value !== 'object' || value === null) return false
  return typeof Reflect.get(value, 'send') === 'function'
}

function readSendBinding(env: CloudflareEnv): SendEmail | null {
  const candidate: unknown = env.EMAIL
  return isSendEmail(candidate) ? candidate : null
}

export const cloudflareEmailAdapter = createCloudflareEmailSendingAdapter({
  defaultFromAddress: 'noreply@rinsly.com',
  defaultFromName: 'Rinsly',
  getSendBinding: async () => readSendBinding(await getBindings()),
})

/** @deprecated Prefer importing from site-core; kept for local tests. */
export { toAddressList } from '@rinsly-com/site-core/email/cloudflareEmailSending'
