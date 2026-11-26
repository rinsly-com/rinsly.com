// @vitest-environment jsdom

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

import { act, createElement, type ReactElement } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import { CheckAanvraagForm } from '@/components/check/CheckAanvraagForm'
import { OfferteForm } from '@/components/OfferteForm'
import {
  B2B_CONFIRMATION_TEXT,
  B2B_QUOTE_REQUIRED,
  B2B_QUOTE_REQUIRED_WITH_KVK,
  KVK_FIELD_LABEL,
} from '@/lib/b2bConfirmation'
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

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
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
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.nl)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Ik wil een website/ }))
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.nl)).toBeNull()
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
    const submit = screen.getByRole('button', { name: 'Aanvraag versturen' })
    expect(submit.hasAttribute('disabled')).toBe(false)
    expect(screen.queryByLabelText(KVK_FIELD_LABEL.nl)).toBeNull()
    expect(document.querySelector('#offerte-kvk')).toBeNull()
    expect(screen.getByText(B2B_QUOTE_REQUIRED.nl)).toBeTruthy()
    expect(screen.queryByText(B2B_QUOTE_REQUIRED_WITH_KVK.nl)).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: B2B_CONFIRMATION_TEXT.nl }))
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.nl)).toBeNull()
    expect(submit.hasAttribute('disabled')).toBe(false)
  })

  it('starts unticked on the English contact quote form', () => {
    hydrate(createElement(OfferteForm, { locale: 'en' }))
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.en)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /I want a website/ }))
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.en)).toBeNull()
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
    const submit = screen.getByRole('button', { name: 'Send request' })
    expect(submit.hasAttribute('disabled')).toBe(false)
    expect(screen.queryByLabelText(KVK_FIELD_LABEL.en)).toBeNull()
    expect(document.querySelector('#offerte-kvk')).toBeNull()
    expect(screen.getByText(B2B_QUOTE_REQUIRED.en)).toBeTruthy()
    expect(screen.queryByText(B2B_QUOTE_REQUIRED_WITH_KVK.en)).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: B2B_CONFIRMATION_TEXT.en }))
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.en)).toBeNull()
    expect(submit.hasAttribute('disabled')).toBe(false)
  })

  it('requires a registration number on the English form when collection is on', () => {
    hydrate(createElement(OfferteForm, { locale: 'en', kvkCollectionEnabled: true }))
    fireEvent.click(screen.getByRole('button', { name: /I want a website/ }))
    setValue('offerte-bedrijf', 'Studio')
    setValue('offerte-naam', 'Ada')
    setValue('offerte-email', 'ada@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: /Care/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.getByLabelText(KVK_FIELD_LABEL.en)).toBeTruthy()
    expect(screen.getByText(B2B_QUOTE_REQUIRED_WITH_KVK.en)).toBeTruthy()
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.en)).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: B2B_CONFIRMATION_TEXT.en }))
    expect(screen.getByText(B2B_QUOTE_REQUIRED_WITH_KVK.en)).toBeTruthy()
    setValue('offerte-kvk', 'BE0123456789')
    expect(screen.queryByText(B2B_QUOTE_REQUIRED_WITH_KVK.en)).toBeNull()
  })

  it('shows the registration field when the worker flag is on and the baked form is off', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
      const url = requestUrl(input)
      const body = url.endsWith('/api/offerte-config')
        ? { kvkCollectionEnabled: true }
        : { ok: true }
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    hydrate(createElement(OfferteForm, { locale: 'en' }))
    fireEvent.click(screen.getByRole('button', { name: /I want a website/ }))
    setValue('offerte-bedrijf', 'Studio')
    setValue('offerte-naam', 'Ada')
    setValue('offerte-email', 'ada@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: /Care/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(screen.getByLabelText(KVK_FIELD_LABEL.en)).toBeTruthy()
    })
    expect(screen.getByText(B2B_QUOTE_REQUIRED_WITH_KVK.en)).toBeTruthy()
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.en)).toBeNull()

    fireEvent.click(screen.getByRole('checkbox', { name: B2B_CONFIRMATION_TEXT.en }))
    setValue('offerte-kvk', 'BE0123456789')
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))

    await waitFor(() => {
      const post = fetchMock.mock.calls.find((call) => requestUrl(call[0]).endsWith('/api/offerte'))
      expect(post).toBeTruthy()
    })
    const post = fetchMock.mock.calls.find((call) => requestUrl(call[0]).endsWith('/api/offerte'))
    const raw = post?.[1]?.body
    if (typeof raw !== 'string') throw new Error('expected a JSON string body')
    expect(JSON.parse(raw)).toMatchObject({ b2bConfirmed: true, kvkNummer: 'BE0123456789' })
  })

  it('shows the registration field when a ticked quote is rejected without one', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
      const url = requestUrl(input)
      if (url.endsWith('/api/offerte-config')) {
        return Promise.resolve(
          new Response(JSON.stringify({ kvkCollectionEnabled: false }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ ok: false, error: 'b2b' }), {
          status: 422,
          headers: { 'content-type': 'application/json' },
        }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    hydrate(createElement(OfferteForm, { locale: 'en' }))
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some((call) => requestUrl(call[0]).endsWith('/api/offerte-config')),
      ).toBe(true)
    })

    fireEvent.click(screen.getByRole('button', { name: /I want a website/ }))
    setValue('offerte-bedrijf', 'Studio')
    setValue('offerte-naam', 'Ada')
    setValue('offerte-email', 'ada@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: /Care/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(document.querySelector('#offerte-kvk')).toBeNull()
    fireEvent.click(screen.getByRole('checkbox', { name: B2B_CONFIRMATION_TEXT.en }))
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }))

    await waitFor(() => {
      expect(screen.getByLabelText(KVK_FIELD_LABEL.en)).toBeTruthy()
    })
    expect(screen.getByText(B2B_QUOTE_REQUIRED_WITH_KVK.en)).toBeTruthy()
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.en)).toBeNull()
  })

  it('does not show the business-client sentence on the design-studio path', () => {
    hydrate(createElement(OfferteForm, { locale: 'en', kvkCollectionEnabled: true }))
    fireEvent.click(screen.getByRole('button', { name: /design studio/ }))
    expect(screen.queryByText(B2B_QUOTE_REQUIRED.en)).toBeNull()
    expect(screen.queryByText(B2B_QUOTE_REQUIRED_WITH_KVK.en)).toBeNull()
    expect(screen.queryByLabelText(KVK_FIELD_LABEL.en)).toBeNull()
  })
})
