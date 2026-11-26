// @vitest-environment jsdom

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

import { act, createElement, type ReactElement } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import { CheckAanvraagForm } from '@/components/check/CheckAanvraagForm'
import { OfferteForm } from '@/components/OfferteForm'
import { EMAIL_CONSENT_TEXT } from '@/lib/emailConsent'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@rinsly-com/site-core/ui', () => ({
  Turnstile: () => null,
  turnstileHeaders: () => ({}),
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
  vi.unstubAllGlobals()
})

function expectUnticked(name: string) {
  const box = screen.getByRole('checkbox', { name })
  expect(box.getAttribute('aria-checked')).toBe('false')
  expect(box.hasAttribute('required')).toBe(false)
  return box
}

function postedBody(
  fetchMock: ReturnType<
    typeof vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>
  >,
): Record<string, unknown> {
  const raw = fetchMock.mock.calls[0]?.[1]?.body
  if (typeof raw !== 'string') throw new Error('expected a JSON string body')
  return JSON.parse(raw) as Record<string, unknown>
}

function okFetch() {
  return vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  )
}

function setValue(id: string, value: string) {
  const el = document.getElementById(id)
  if (!(el instanceof HTMLInputElement)) throw new Error(`missing #${id}`)
  fireEvent.change(el, { target: { value } })
}

function fillCheckForm() {
  setValue('check-url', 'https://example.nl')
  setValue('check-naam', 'Ada')
  setValue('check-telefoon', '0612345678')
}

describe('email consent checkbox', () => {
  it('does not ask for email consent on the /check form', async () => {
    const fetchMock = okFetch()
    vi.stubGlobal('fetch', fetchMock)

    hydrate(createElement(CheckAanvraagForm))
    expect(screen.queryByRole('checkbox')).toBeNull()

    fillCheckForm()
    fireEvent.click(screen.getByRole('button', { name: 'Vraag de gratis check aan' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
    const body = postedBody(fetchMock)
    expect(body).not.toHaveProperty('emailConsent')
    expect(body).not.toHaveProperty('locale')
    expect(body).not.toHaveProperty('consentAt')
    expect(body).not.toHaveProperty('consentText')
    expect(body).not.toHaveProperty('consentGiven')
  })

  it('starts unticked on the Dutch contact quote form and does not block submit', () => {
    hydrate(createElement(OfferteForm, { locale: 'nl' }))
    fireEvent.click(screen.getByRole('button', { name: /Ik wil een website/ }))
    setValue('offerte-bedrijf', 'Studio')
    setValue('offerte-naam', 'Ada')
    setValue('offerte-email', 'ada@example.nl')
    fireEvent.click(screen.getByRole('button', { name: 'Volgende' }))
    fireEvent.click(screen.getByRole('button', { name: /Care/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Volgende' }))
    fireEvent.click(screen.getByRole('button', { name: 'Volgende' }))

    expectUnticked(EMAIL_CONSENT_TEXT.nl)
    expect(screen.getByRole('link', { name: 'privacyverklaring' }).getAttribute('href')).toBe(
      '/nl/privacy',
    )
    expect(
      screen.getByRole('button', { name: 'Aanvraag versturen' }).hasAttribute('disabled'),
    ).toBe(false)
  })

  it('starts unticked on the English contact quote form', () => {
    hydrate(createElement(OfferteForm, { locale: 'en' }))
    fireEvent.click(screen.getByRole('button', { name: /I want a website/ }))
    setValue('offerte-bedrijf', 'Studio')
    setValue('offerte-naam', 'Ada')
    setValue('offerte-email', 'ada@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: /Care/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expectUnticked(EMAIL_CONSENT_TEXT.en)
    expect(screen.getByRole('link', { name: 'privacy policy' }).getAttribute('href')).toBe(
      '/en/privacy',
    )
    expect(screen.getByRole('button', { name: 'Send request' }).hasAttribute('disabled')).toBe(
      false,
    )
  })
})
