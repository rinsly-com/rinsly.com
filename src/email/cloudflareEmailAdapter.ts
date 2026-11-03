import {
  createCloudflareEmailSendingAdapter,
  type EmailSendBinding,
} from '@rinsly-com/site-core/email/cloudflareEmailSending'

import { getBindings } from '../lib/bindings'

/**
 * Payload mail via the EMAIL binding (noreply@rinsly.com). Auth mail and the
 * form notifications use payload.sendEmail. With no binding (local `next dev`)
 * the message is logged instead of sent.
 *
 * Wrangler's SendEmail.send() does not overlap EmailSendBinding, so narrow
 * from unknown instead of intersecting CloudflareEnv (that cast is TS2352).
 */
function isSendEmail(value: unknown): value is EmailSendBinding {
  if (typeof value !== 'object' || value === null) return false
  return typeof Reflect.get(value, 'send') === 'function'
}

function readSendBinding(env: CloudflareEnv): EmailSendBinding | null {
  const candidate: unknown = env.EMAIL
  return isSendEmail(candidate) ? candidate : null
}

export const cloudflareEmailAdapter = createCloudflareEmailSendingAdapter({
  defaultFromAddress: 'noreply@rinsly.com',
  defaultFromName: 'Rinsly',
  getSendBinding: async () => readSendBinding(await getBindings()),
})
