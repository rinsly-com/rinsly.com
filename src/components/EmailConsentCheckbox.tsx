'use client'

import { Checkbox } from '@rinsly-com/ui/checkbox'
import { Field } from '@rinsly-com/ui/field'

import { EMAIL_CONSENT_TEXT, type EmailConsentLocale } from '@/lib/emailConsent'

/**
 * Optional email-consent box. Defaults to unticked. The label is the server
 * constant for the locale on screen, so the stored sentence matches the UI.
 */
export function EmailConsentCheckbox({
  id,
  locale,
  checked = false,
  onCheckedChange,
}: {
  id: string
  locale: EmailConsentLocale
  checked?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const label = EMAIL_CONSENT_TEXT[locale]
  return (
    <Field.Root>
      <Field.Label
        className={[
          'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm font-normal transition-colors',
          checked ? 'border-accent bg-accent-soft' : 'border-hair hover:border-accent/50',
        ].join(' ')}
      >
        <Checkbox.Root
          id={id}
          name="emailConsent"
          nativeButton
          checked={checked}
          onCheckedChange={(value: boolean) => {
            onCheckedChange(value)
          }}
          render={<button type="button" />}
          className={[
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border p-0 transition-all',
            checked
              ? 'border-accent bg-accent text-white'
              : 'border-hair bg-paper text-transparent',
          ].join(' ')}
        >
          <Checkbox.Indicator keepMounted>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span className="text-ink">{label}</span>
      </Field.Label>
    </Field.Root>
  )
}
