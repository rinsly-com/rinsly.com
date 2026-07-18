import type { BlockRenderer } from '@rinsly-com/site-core'

import type { Page } from '@/payload-types'
import { Contact } from '@/components/custom/Contact'

type ContactBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'contact' }>

/**
 * Rinsly's custom block renderers, passed to the engine's route factories. The
 * `contact` entry overrides the engine's core contact renderer to mount the
 * OfferteForm quote wizard.
 */
export const extraRenderers: Record<string, BlockRenderer> = {
  contact: (block, locale) => <Contact {...(block as ContactBlock)} locale={locale} />,
}
