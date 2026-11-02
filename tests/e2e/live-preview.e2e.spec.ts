import { expect, test, type Frame, type Page } from '@playwright/test'

import { readServerEnv } from '../../src/lib/env'
import { logCaught } from '../../src/lib/logCaught'

/**
 * Live preview, end to end. Each check failed once with `tsc` still green:
 * cookie auth requires an Origin (an iframe GET sends none); Lexical fields
 * expose `data-field-path` and no id; a collapsed block row stays mounted at
 * 0×0; the panel must handle the page's message. Named in
 * `packages/site-core/src/preview/bridge.ts`.
 */

const env = readServerEnv()
const EMAIL = env.SEED_ADMIN_EMAIL || 'dev@rinsly.local'
const PASSWORD = env.SEED_ADMIN_PASSWORD || 'rinsly-dev'
const RICH_TEXT_PAGE = '/admin/collections/pages/1'
const BASE_URL = env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

async function clearStaleLocks(page: Page) {
  await page.evaluate(async () => {
    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null
    const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value)
    const res = await fetch('/api/payload-locked-documents?limit=100&depth=0', {
      credentials: 'include',
      headers: { origin: window.location.origin },
    })
    if (!res.ok) return
    const body: unknown = await res.json()
    const docs = isRecord(body) && isUnknownArray(body['docs']) ? body['docs'] : []
    await Promise.all(
      docs.map((doc) => {
        const id = isRecord(doc) ? doc['id'] : undefined
        if (typeof id !== 'string' && typeof id !== 'number') return Promise.resolve()
        return fetch(`/api/payload-locked-documents/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        }).catch((err: unknown) => {
          const detail = err instanceof Error ? err.message : String(err)
          console.error(`[e2e] could not delete a document lock: ${detail}`)
        })
      }),
    )
  })
}

/**
 * Look the preview frame up at the point of use. Payload reloads the iframe
 * when form state changes, and a held `Frame` then times out as "not visible".
 */
function previewFrame(page: Page): Frame | undefined {
  return page.frames().find((f) => f.url().includes('preview=1'))
}

/**
 * Sign in through the API. The login button exists before hydration, so a
 * click can no-op and the wait names the login instead of the race.
 * `page.request` shares the browser cookie jar.
 */
async function login(page: Page) {
  // Retry 500s only. A cold `next dev` can 500 while compiling the route.
  // A 401 is a bad password and must fail immediately.
  let res = await page.request.post('/api/users/login', {
    data: { email: EMAIL, password: PASSWORD },
    // Payload validates Origin before it will authenticate by cookie.
    headers: { origin: new URL(BASE_URL).origin },
  })

  for (let attempt = 0; attempt < 3 && res.status() >= 500; attempt++) {
    await page.waitForTimeout(2_000)
    res = await page.request.post('/api/users/login', {
      data: { email: EMAIL, password: PASSWORD },
      headers: { origin: new URL(BASE_URL).origin },
    })
  }

  // The body is what says WHY, and a status alone has cost this file hours.
  const loginBody = await res.text().catch((err: unknown) => {
    logCaught('[e2e] login response body unreadable', err)
    return ''
  })
  expect(res.ok(), `login failed: ${res.status()} ${loginBody}`).toBeTruthy()

  await page.goto('/admin', { waitUntil: 'domcontentloaded' })
  await clearStaleLocks(page)
  await resetEditViewPreference(page)
}

/** Navigating away releases Payload's per-session document lock. */
async function releaseLock(page: Page) {
  await page.goto('/admin', { waitUntil: 'domcontentloaded' }).catch((err: unknown) => {
    logCaught('[e2e] could not navigate away to release the lock', err)
  })
}

/**
 * Delete the `collection-pages` edit-view preference so preview starts closed.
 * The toggler is a toggle, `--active` arrives at hydration, and the iframe is
 * never unmounted, so detecting the current state races.
 */
async function resetEditViewPreference(page: Page) {
  await page
    .evaluate(async () => {
      await fetch('/api/payload-preferences/collection-pages', {
        method: 'DELETE',
        credentials: 'include',
      }).catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err)
        console.error(`[e2e] could not delete the edit-view preference: ${detail}`)
      })
    })
    .catch((err: unknown) => {
      logCaught('[e2e] preference reset failed', err)
    })
}

async function openLivePreview(page: Page): Promise<void> {
  await page.goto(RICH_TEXT_PAGE, { waitUntil: 'networkidle' })

  // Preference was cleared at login, so one click opens the preview.
  const toggler = page.locator('.live-preview-toggler').first()
  await expect(toggler).toBeVisible({ timeout: 60_000 })
  await toggler.click()

  // Wait for a laid-out height. Annotations exist before CSS lands, and a
  // 0×0 target reports "not visible" even with `force`.
  await expect
    .poll(
      async () => {
        const frame = previewFrame(page)
        if (!frame) return 0
        return frame
          .locator('[data-rinsly-block]')
          .first()
          .boundingBox()
          .then((b) => Math.round(b?.height ?? 0))
          .catch((err: unknown) => {
            logCaught('[e2e] preview box was not measurable yet', err)
            return 0
          })
      },
      { timeout: 120_000, intervals: [500] },
    )
    .toBeGreaterThan(0)
}

/** The frame, asserted present — call at the point of use, never cached. */
function frameOf(page: Page): Frame {
  const frame = previewFrame(page)
  expect(frame, 'preview frame').toBeTruthy()
  if (!frame) throw new Error('preview frame')
  return frame
}

test.describe('live preview', () => {
  // Same admin, same document: a lock and a per-user preference. Parallel
  // (`--repeat-each`) makes those collide, and the failure looks like a flake.
  test.describe.configure({ mode: 'serial' })
  // Booting the admin, toggling the preview and waiting for the first live
  // merge is comfortably more than the 30s default.
  test.setTimeout(240_000)

  // Navigating away is what releases the lock, so it has to happen even when
  // the test failed — otherwise one failure cascades into the next run.
  test.afterEach(async ({ page }) => {
    await releaseLock(page)
  })

  test('an anonymous request never receives a draft', async ({ request }) => {
    const res = await request.get('/nl?preview=1')
    expect(res.status()).toBe(200)

    // `?preview=1` grants nothing on its own: no session, no preview markup.
    expect(await res.text()).not.toContain('data-rinsly-block')
  })

  test('an authenticated preview is annotated', async ({ page }) => {
    await login(page)
    await openLivePreview(page)
    expect(await frameOf(page).locator('[data-rinsly-block]').count()).toBeGreaterThan(0)
  })

  test('the panel exposes the rich-text field by data-field-path', async ({ page }) => {
    await login(page)
    await openLivePreview(page)

    const region = frameOf(page).locator('[data-rinsly-richtext]').first()
    const path = await region.getAttribute('data-rinsly-richtext')
    expect(path).toBeTruthy()

    // Open the row first: a collapsed block renders no fields. No `force`:
    // this block is below the fold, and a forced click misses the viewport.
    await region.locator('p').first().scrollIntoViewIfNeeded()
    await region.locator('p').first().click()

    // The bridge finds the panel's field by this attribute. The Lexical field
    // renders no id at all, so this is the only handle there is.
    await expect(page.locator(`[data-field-path="${path}"]`)).toHaveCount(1, { timeout: 30_000 })
  })

  test('clicking rich text opens an editor in the page, and typing reaches the form', async ({
    page,
  }) => {
    await login(page)
    await openLivePreview(page)

    const region = frameOf(page).locator('[data-rinsly-richtext][data-rinsly-inpage]').first()
    await expect(region).toBeVisible({ timeout: 30_000 })

    // Read the path BEFORE opening it: the marker lives on the read-only
    // rendering, and opening the editor replaces that element entirely.
    const path = await region.getAttribute('data-rinsly-richtext')

    // See the note above: never `force` a click into the preview.
    await region.locator('p').first().scrollIntoViewIfNeeded()
    await region.locator('p').first().click()

    const editable = frameOf(page).locator('[data-rinsly-editor] [contenteditable="true"]').first()
    await expect(editable).toBeVisible({ timeout: 30_000 })

    const marker = `probe-${Date.now()}`
    await editable.pressSequentially(`${marker} `, { delay: 30 })
    await expect(editable).toContainText(marker, { timeout: 15_000 })

    // The panel's own editor follows, which is only true if the message reached
    // it AND was written to the field.
    await expect(page.locator(`[data-field-path="${path}"]`)).toContainText(marker, {
      timeout: 20_000,
    })

    // The document is never saved: the edit lives in form state and dies with
    // the session, so the seeded content is left exactly as it was found.
  })
})
