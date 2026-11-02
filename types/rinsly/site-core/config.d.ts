import type { Payload, SanitizedConfig } from 'payload'

export function buildSiteConfig(options: {
  onContentPublished?: (args: { reason: string; payload: Payload }) => Promise<void> | void
  [key: string]: unknown
}): Promise<SanitizedConfig>
