import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import { Section } from '@/components/frontend/ui/Section'

type Props = Extract<NonNullable<Page['layout']>[number], { blockType: 'note' }> & {
  locale: Locale
}

/** Small centered callout in the proposal's accent style. */
export function Note({ text }: Props) {
  if (!text) return null
  return (
    <Section className="pb-6 sm:pb-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-hair border-l-[3px] border-l-accent bg-accent-soft px-5 py-4 text-center text-sm text-ink">
        {text}
      </div>
    </Section>
  )
}

export default Note
