import { turnstileHeaders } from '@rinsly-com/site-core/ui'

/**
 * Plain header fields for `fetch`. The engine returns a class instance;
 * object-spreading that drops the prototype.
 */
export function turnstileHeaderRecord(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(turnstileHeaders(token))) {
    if (typeof value === 'string') headers[key] = value
  }
  return headers
}
