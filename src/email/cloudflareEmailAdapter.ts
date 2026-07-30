import type { EmailAdapter, SendEmailOptions } from 'payload'

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
 */

type Address = { email: string; name?: string }

/** Normalize nodemailer-style recipients (string | {address,name} | arrays). */
export function toAddressList(value: SendEmailOptions['to']): string[] {
  if (!value) return []
  const list = Array.isArray(value) ? value : [value]
  return list
    .map((entry) =>
      typeof entry === 'string'
        ? entry
        : (entry as { address?: string; email?: string }).address ??
          (entry as { email?: string }).email ??
        '',
    )
    .map((s) => s.trim())
    .filter(Boolean)
}

export const cloudflareEmailAdapter =
  ({ defaultFromAddress, defaultFromName }: { defaultFromAddress: string; defaultFromName: string }): EmailAdapter =>
  ({ payload }) => ({
    name: 'cloudflare-email-sending',
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message) => {
      const to = toAddressList(message.to)
      if (to.length === 0) {
        payload.logger.warn({ msg: '[email] dropped message without recipients', subject: message.subject })
        return
      }

      const from: Address =
        typeof message.from === 'string'
          ? { email: message.from }
          : message.from
            ? { email: (message.from as { address: string }).address, name: (message.from as { name?: string }).name }
            : { email: defaultFromAddress, name: defaultFromName }

      const env = (await getBindings()) as CloudflareEnv & {
        EMAIL?: { send: (msg: Record<string, unknown>) => Promise<unknown> }
      }

      if (typeof env.EMAIL?.send !== 'function') {
        payload.logger.info({
          msg: '[email] EMAIL binding unavailable — logging instead of sending',
          to,
          subject: message.subject,
          text: typeof message.text === 'string' ? message.text.slice(0, 500) : undefined,
        })
        return
      }

      await env.EMAIL.send({
        to: to.length === 1 ? to[0] : to,
        from,
        subject: message.subject ?? '',
        ...(message.html ? { html: String(message.html) } : {}),
        // Always include a text part (deliverability; some clients are text-only).
        text:
          typeof message.text === 'string' && message.text.trim() !== ''
            ? message.text
            : String(message.html ?? '').replace(/<[^>]+>/g, ' '),
        ...(message.replyTo ? { replyTo: toAddressList(message.replyTo as SendEmailOptions['to'])[0] } : {}),
      })
    },
  })
