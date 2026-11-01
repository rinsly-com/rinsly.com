/**
 * Verifier for /partner?token=…
 *
 * Lens mints `<base64url(JSON)>.<base64url(HMAC-SHA256 of that base64url)>`
 * (apps/tenants/src/partnerToken.ts). The signature covers the encoded payload,
 * so key order does not matter. Both sides share one test vector: if it fails,
 * fix the encoding, do not update the expected string on one side only.
 * Web Crypto (not node:crypto) because this runs in a Worker.
 */

export interface PartnerTokenPayload {
  /** Domain of the studio — the identifier shared across all three systems. */
  d: string
  /** Business name, for the greeting and the prefill. */
  n: string
  /** City. */
  c?: string
  /** ISO 3166-1 alpha-2, lowercase. */
  l?: string
  /** Expiry, seconds since the epoch. */
  exp: number
}

export type VerifyResult =
  | { ok: true; payload: PartnerTokenPayload }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' }

function fromB64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function toB64url(bytes: ArrayBuffer): string {
  let binary = ''
  const view = new Uint8Array(bytes)
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]!)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(encodedPayload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload))
  return toB64url(mac)
}

/** Constant-time string compare, so a wrong signature leaks no timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyPartnerToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): Promise<VerifyResult> {
  if (!secret) return { ok: false, reason: 'bad_signature' }
  const dot = token.indexOf('.')
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: 'malformed' }
  const encoded = token.slice(0, dot)
  const provided = token.slice(dot + 1)

  let expected: string
  try {
    expected = await sign(encoded, secret)
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (!safeEqual(provided, expected)) return { ok: false, reason: 'bad_signature' }

  let payload: PartnerTokenPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64url(encoded))) as PartnerTokenPayload
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (typeof payload.d !== 'string' || typeof payload.exp !== 'number') {
    return { ok: false, reason: 'malformed' }
  }
  if (payload.exp * 1000 < now.getTime()) return { ok: false, reason: 'expired' }
  return { ok: true, payload }
}
