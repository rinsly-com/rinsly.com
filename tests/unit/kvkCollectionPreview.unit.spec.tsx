// @vitest-environment jsdom

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

import { act, type ReactElement } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { KvkCollectionFlagProvider } from '@/components/KvkCollectionFlag'
import { PreviewContact } from '@/components/PreviewShell'
import { B2B_QUOTE_REQUIRED, B2B_QUOTE_REQUIRED_WITH_KVK, KVK_FIELD_LABEL } from '@/lib/b2bConfirmation'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@rinsly-com/site-core/ui', () => ({
  Turnstile: () => null,
  turnstileHeaders: () => ({}),
  Section: ({ children }: { children?: React.ReactNode }) => children,
  SectionHeading: () => null,
  Buttons: () => null,
  Icon: () => null,
}))

const roots: Root[] = []

function hydrate(ui: ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  container.innerHTML = renderToString(ui)
  let root!: Root
  act(() => {
    root = hydrateRoot(container, ui)
  })
  roots.push(root)
  return container
}

afterEach(() => {
  for (const root of roots) root.unmount()
  roots.length = 0
  document.body.innerHTML = ''
  vi.unstubAllEnvs()
})

function previewContact(enabled: boolean) {
  return (
    <KvkCollectionFlagProvider enabled={enabled}>
      <PreviewContact blockType="contact" locale="nl" />
    </KvkCollectionFlagProvider>
  )
}

function goToQuoteConfirm() {
  fireEvent.click(screen.getByRole('button', { name: /Ik wil een website/ }))
  const bedrijf = document.getElementById('offerte-bedrijf')
  const naam = document.getElementById('offerte-naam')
  const email = document.getElementById('offerte-email')
  if (!(bedrijf instanceof HTMLInputElement && naam instanceof HTMLInputElement && email instanceof HTMLInputElement)) {
    throw new Error('missing quote fields')
  }
  fireEvent.change(bedrijf, { target: { value: 'Studio' } })
  fireEvent.change(naam, { target: { value: 'Ada' } })
  fireEvent.change(email, { target: { value: 'ada@example.nl' } })
  fireEvent.click(screen.getByRole('button', { name: 'Volgende' }))
  fireEvent.click(screen.getByRole('button', { name: /Care/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Volgende' }))
  fireEvent.click(screen.getByRole('button', { name: 'Volgende' }))
}

describe('preview KvK collection flag', () => {
  it('shows the KvK field when the server-provided flag is on, even if process env is off', () => {
    vi.stubEnv('RINSLY_KVK_COLLECTION_ENABLED', '')
    hydrate(previewContact(true))
    goToQuoteConfirm()
    expect(screen.getByLabelText(KVK_FIELD_LABEL.nl)).toBeTruthy()
    expect(screen.getByText(B2B_QUOTE_REQUIRED_WITH_KVK.nl)).toBeTruthy()
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.nl)).toBeNull()
  })

  it('keeps the field hidden when the server-provided flag is off', () => {
    vi.stubEnv('RINSLY_KVK_COLLECTION_ENABLED', 'true')
    hydrate(previewContact(false))
    goToQuoteConfirm()
    expect(screen.queryByLabelText(KVK_FIELD_LABEL.nl)).toBeNull()
    expect(document.querySelector('#offerte-kvk')).toBeNull()
    expect(screen.getByText(B2B_QUOTE_REQUIRED.nl)).toBeTruthy()
    expect(screen.queryByText(B2B_QUOTE_REQUIRED_WITH_KVK.nl)).toBeNull()
  })
})
