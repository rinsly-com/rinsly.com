;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

import { act, createElement, type ReactElement } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import { CheckAanvraagForm } from '@/components/check/CheckAanvraagForm'
import { CheckRunner } from '@/components/check/CheckRunner'
import { OfferteForm } from '@/components/OfferteForm'
import { PartnerForm } from '@/components/partner/PartnerForm'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@rinsly-com/site-core/ui', () => ({
  Turnstile: () => null,
  turnstileHeaders: () => ({}),
}))

/**
 * Portal #27: Base UI regenerates ids on hydration, so a label's `for` and
 * `aria-describedby` only stay attached when the control passes an explicit id.
 * This renders the server markup, hydrates it, and checks the pair still matches.
 */
const roots: Root[] = []

function labelPointsAtControl(root: Element) {
  const labels = [...root.querySelectorAll('label')]
  expect(labels.length).toBeGreaterThan(0)
  for (const label of labels) {
    const id = label.getAttribute('for')
    // A wrapping label (the honeypot) is associated by containment, not `for`.
    if (!id) {
      expect(label.querySelector('input, textarea, select, button'), label.textContent ?? undefined).toBeTruthy()
      continue
    }
    const control = root.querySelector(`[id="${id}"]`)
    expect(control, `label "${label.textContent}" for="${id}"`).toBeTruthy()
    const describedBy = control?.getAttribute('aria-describedby')
    if (!describedBy) continue
    for (const describedId of describedBy.split(/\s+/).filter(Boolean)) {
      expect(root.querySelector(`[id="${describedId}"]`), describedId).toBeTruthy()
    }
  }
}

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

describe('form control ids survive hydration', () => {
  it('keeps the check-aanvraag labels attached to their inputs', () => {
    const ui = createElement(CheckAanvraagForm)
    const ssr = document.createElement('div')
    ssr.innerHTML = renderToString(ui)
    labelPointsAtControl(ssr)

    const view = hydrate(ui)
    labelPointsAtControl(view)
    expect(view.querySelector('label[for="check-url"]')).toBeTruthy()
    expect(view.querySelector('#check-url')).toBeInstanceOf(HTMLInputElement)
    expect(view.querySelector('label[for="check-naam"]')).toBeTruthy()
    expect(view.querySelector('label[for="check-telefoon"]')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Vraag de gratis check aan' })).toBeTruthy()
  })

  it('keeps the self-service check label attached to its input', () => {
    const ui = createElement(CheckRunner)
    const view = hydrate(ui)
    labelPointsAtControl(view)
    expect(view.querySelector('label[for="check-run-url"]')).toBeTruthy()
    expect(view.querySelector('#check-run-url')).toBeInstanceOf(HTMLInputElement)
    expect(screen.getByRole('button', { name: 'Test mijn website nu' })).toBeTruthy()
  })

  it('keeps offerte labels, and the figma checkbox description, attached', () => {
    hydrate(createElement(OfferteForm, { locale: 'nl' }))

    fireEvent.click(screen.getByRole('button', { name: /Ik wil een website/ }))
    const company = screen.getByRole('textbox', { name: 'Bedrijf' })
    expect(company.getAttribute('id')).toBe('offerte-bedrijf')
    expect(document.querySelector('label[for="offerte-bedrijf"]')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Terug' }))
    fireEvent.click(screen.getByRole('button', { name: /ontwerpstudio/ }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Naam van je studio' }), {
      target: { value: 'Studio' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Je eigen website' }), {
      target: { value: 'studio.nl' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), {
      target: { value: 'studio@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Volgende' }))

    const figma = screen.getByRole('checkbox', { name: /Figma-licentie/ })
    expect(figma.tagName).toBe('BUTTON')
    expect(figma.getAttribute('id')).toBe('offerte-figma')
    expect(figma.getAttribute('aria-describedby')).toBe('offerte-figma-hint')
    expect(document.querySelector('label[for="offerte-figma"]')).toBeTruthy()
    expect(document.getElementById('offerte-figma-hint')?.textContent).toMatch(/Dev Mode/)
    labelPointsAtControl(document.body)
  })

  it('keeps partner labels and hints attached once the invite resolves', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.includes('/api/partner-aanvraag/verify')) {
          return new Response(
            JSON.stringify({
              ok: true,
              prefill: {
                domein: 'studio.nl',
                bedrijfsnaam: 'Studio Voorbeeld',
                plaats: 'Utrecht',
                land: 'nl',
              },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }
        return new Response('{}', { status: 404 })
      }),
    )

    hydrate(createElement(PartnerForm, { token: 'invite', locale: 'nl' }))

    await waitFor(() => {
      expect(document.getElementById('partner-company')).toBeInstanceOf(HTMLInputElement)
    })

    expect(document.querySelector('label[for="partner-company"]')?.textContent).toBe('Bedrijfsnaam')
    const branches = document.getElementById('partner-branches')
    expect(branches?.getAttribute('aria-describedby')).toBe('partner-branches-hint')
    expect(document.getElementById('partner-branches-hint')?.textContent).toMatch(/Komma/)
    expect(screen.getByRole('button', { name: 'Versturen' })).toBeTruthy()
    labelPointsAtControl(document.body)
  })
})
