/**
 * Signed unsubscribe tokens for /{locale}/afmelden.
 *
 * The URL must not contain an email address or other PII, even encoded. The
 * token is `v1.<emailHash>.<signature>`. Both MACs are HMAC-SHA256, base64url
 * without padding, keyed by UNSUBSCRIBE_TOKEN_SECRET:
 *
 *   emailHash  = HMAC("unsub-id:v1:"  || normalized_email)
 *   signature  = HMAC("unsub-sig:v1:" || emailHash)
 *
 * Normalized email is trimmed and lowercased, and must contain a single `@`
 * with non-empty local and domain parts and no spaces — the same rule
 * send_smtp.py uses after parseaddr. Tokens do not expire: an old marketing
 * mail must still be withdrawable (AVG 7(3)).
 *
 * Mint and verify share a pinned test vector with a later Python mint in the
 * mail script. If the vector fails, fix the encoding; do not change only one
 * side. Web Crypto (not node:crypto) because this runs in a Worker.
 *
 * The secret is a Worker secret set by Fleet/Yaron. This repo never creates
 * or stores the value.
 */

export const UNSUBSCRIBE_TOKEN_VERSION = 1 as const

const ID_PREFIX = 'unsub-id:v1:'
const SIG_PREFIX = 'unsub-sig:v1:'

export type UnsubscribeLocale = 'nl' | 'en'

export type UnsubscribeVerifyResult =
  | { ok: true; emailHash: string; version: typeof UNSUBSCRIBE_TOKEN_VERSION }
  | { ok: false; reason: 'invalid' | 'missing_secret' }

export function normalizeEmail(raw: string): string | null {
  const addr = raw.trim().toLowerCase()
  const at = addr.indexOf('@')
  if (
    at <= 0 ||
    at !== addr.lastIndexOf('@') ||
    at === addr.length - 1 ||
    addr.includes(' ')
  ) {
    return null
  }
  return addr
}

function toB64url(bytes: ArrayBuffer): string {
  let binary = ''
  const view = new Uint8Array(bytes)
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return toB64url(mac)
}

/** Constant-time string compare, so a wrong signature leaks no timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function emailHash(normalizedEmail: string, secret: string): Promise<string> {
  if (!secret) throw new Error('unsubscribe secret is missing')
  return hmac(secret, `${ID_PREFIX}${normalizedEmail}`)
}

export async function mintUnsubscribeToken(email: string, secret: string): Promise<string> {
  if (!secret) throw new Error('unsubscribe secret is missing')
  const normalized = normalizeEmail(email)
  if (normalized === null) throw new Error('unsubscribe email is invalid')
  const hash = await emailHash(normalized, secret)
  const signature = await hmac(secret, `${SIG_PREFIX}${hash}`)
  return `v1.${hash}.${signature}`
}

export async function verifyUnsubscribeToken(
  token: string,
  secret: string,
): Promise<UnsubscribeVerifyResult> {
  if (!secret) return { ok: false, reason: 'missing_secret' }
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'v1' || !parts[1] || !parts[2]) {
    return { ok: false, reason: 'invalid' }
  }
  const [, hash, provided] = parts
  let expected: string
  try {
    expected = await hmac(secret, `${SIG_PREFIX}${hash}`)
  } catch {
    return { ok: false, reason: 'invalid' }
  }
  if (!safeEqual(provided, expected)) return { ok: false, reason: 'invalid' }
  return { ok: true, emailHash: hash, version: UNSUBSCRIBE_TOKEN_VERSION }
}

/** Public URL for a minted token. origin has no trailing slash. */
export function buildUnsubscribeUrl(origin: string, locale: UnsubscribeLocale, token: string): string {
  const base = origin.replace(/\/+$/, '')
  return `${base}/${locale}/afmelden?token=${encodeURIComponent(token)}`
}
