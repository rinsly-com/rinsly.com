import type { Locale } from './index'

export function createPreviewShell(
  renderers: Record<string, (block: unknown, locale: Locale) => unknown>,
): unknown
