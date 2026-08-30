import { expect, test, type Frame, type Page } from '@playwright/test'

/**
 * Visual editing, end to end.
 *
 * Every assertion here exists because the thing it checks broke once and could
 * not be caught any other way. `tsc` was green for all of them, and each cost an
 * afternoon:
 *
 *  - Payload validates the Origin header before it will authenticate by COOKIE,
 *    and a browser sends no Origin on a GET navigation — which an iframe load
 *    is. The preview carried a perfectly good session that Payload declined to
 *    read, and silently served the published page instead.
 *  - The Lexical field renders no `id`, only `data-field-path`. Every other
 *    field type has both, so a lookup by id worked everywhere except the one
 *    field it was written for.
 *  - A collapsed block row keeps its fields mounted inside a zero-height
 *    wrapper, so testing that the field EXISTS says nothing about whether it can
 *    be seen or used.
 *  - The panel had no handler for the message the page was sending, so every
 *    keystroke went nowhere.
 *
 * Three of the four are Payload internals rather than public API. If this file
 * starts failing after a Payload upgrade, that is the test doing its job: read
 * `packages/site-core/src/preview/bridge.ts`, which names them in one place.
 */

const EMAIL = process.env.SEED_ADMIN_EMAIL || 'dev@rinsly.local'
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'rinsly-dev'
const RICH_TEXT_PAGE = '/admin/collections/pages/1'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

async function clearStaleLocks(page: Page) {
  await page.evaluate(async () => {
    const res = await fetch('/api/payload-locked-documents?limit=100&depth=0', {
      credentials: 'include',
      headers: { origin: window.location.origin },
    })
    if (!res.ok) return
    const { docs } = (await res.json()) as { docs?: { id: number | string }[] }
    await Promise.all(
      (docs ?? []).map((doc) =>
        fetch(`/api/payload-locked-documents/${doc.id}`, {
          method: 'DELETE',
          credentials: 'include',
        }).catch(() => undefined),
      ),
    )
  })
}

/**
 * The preview frame, looked up fresh every time.
 *
 * Never hold a `Frame` across steps. Payload recomputes the preview URL as form
 * state changes and reloads the iframe, which detaches the old frame object —
 * every call against it then fails until the timeout, and the test reads as
 * "element not visible" when the element is perfectly fine in the frame that
 * actually exists. This was the cause of two intermittent failures.
 */
function previewFrame(page: Page): Frame | undefined {
  return page.frames().find((f) => f.url().includes('preview=1'))
}

/**
 * Sign in through the API, not the form.
 *
 * Clicking the login form is the single flakiest step in this file: the button
 * exists long before React has hydrated it, so an early click does nothing at
 * all and the wait for `/api/users/login` never resolves — a four-minute timeout
 * whose error names the login, not the hydration that caused it. It cost this
 * suite several wrong diagnoses (a preference race, a document lock, worker
 * parallelism) because the symptom appeared in whichever test happened to hit
 * the slow compile.
 *
 * `page.request` shares the browser context's cookie jar, so posting the
 * credentials leaves the browser signed in exactly as the form would, minus the
 * race. Testing that Payload's own login form works is not this file's job.
 */
async function login(page: Page) {
  /**
   * Retry a server error, and only a server error.
   *
   * The first authenticated request against a cold `next dev` compiles the route
   * as it serves it, and can come back 500 before anything is wrong with the
   * credentials. A wrong password is a 401 and must fail immediately — retrying
   * that would turn a real breakage into a slow one, and this suite guards
   * access to unpublished content, so it has to stay loud about it.
   */
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
  expect(res.ok(), `login failed: ${res.status()} ${await res.text().catch(() => '')}`).toBeTruthy()

  await page.goto('/admin', { waitUntil: 'domcontentloaded' })
  await clearStaleLocks(page)
  await resetEditViewPreference(page)
}

/**
 * Payload locks a document while it is open, per SESSION rather than per user.
 * Navigating away is what releases it; a run that ends on the edit view leaves
 * the next one with a read-only form and no preview iframe at all.
 */
async function releaseLock(page: Page) {
  await page.goto('/admin', { waitUntil: 'domcontentloaded' }).catch(() => undefined)
}

/**
 * Put the edit view back to its default, so every test starts from a known
 * state.
 *
 * Payload remembers whether live preview was open, as a per-collection
 * preference (`collection-pages` → `editViewType`). Left alone, a test inherits
 * whatever the previous one did, and the toggler is a toggle — so the same click
 * opens the preview for one test and closes it for the next. Every attempt to
 * detect the current state instead of controlling it has raced something: the
 * `--active` class is applied at hydration, and the iframe is deliberately never
 * unmounted once rendered ("defer load and never unmount", Payload's own
 * comment), so its presence does not mean the preview is open.
 *
 * Deleting the preference removes the question: preview is off on arrival, and
 * one click opens it.
 */
async function resetEditViewPreference(page: Page) {
  await page
    .evaluate(async () => {
      await fetch('/api/payload-preferences/collection-pages', {
        method: 'DELETE',
        credentials: 'include',
      }).catch(() => undefined)
    })
    .catch(() => undefined)
}

/** Clear locks left behind by an earlier run, so a test never inherits one. */
async function openLivePreview(page: Page): Promise<void> {
  await page.goto(RICH_TEXT_PAGE, { waitUntil: 'networkidle' })

  // The preference was cleared at login, so the preview is off and one click
  // opens it. See `resetEditViewPreference` for why this is not detected.
  const toggler = page.locator('.live-preview-toggler').first()
  await expect(toggler).toBeVisible({ timeout: 60_000 })
  await toggler.click()

  /**
   * Wait for a section to have a SIZE, not merely to exist.
   *
   * The annotations appear as soon as the shell renders, but the iframe's
   * stylesheet and fonts land a beat later, and until they do every element
   * measures 0x0 — a click on one reports "element is not visible" even with
   * `force`, because there is no point to click. Existence was the wrong wait:
   * the same mistake the panel bridge made when it polled for the field to
   * exist rather than to be laid out.
   */
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
          .catch(() => 0)
      },
      { timeout: 120_000, intervals: [500] },
    )
    .toBeGreaterThan(0)
}

/** The frame, asserted present — call at the point of use, never cached. */
function frameOf(page: Page): Frame {
  const frame = previewFrame(page)
  expect(frame, 'preview frame').toBeTruthy()
  return frame!
}

test.describe('live preview', () => {
  /**
   * One worker, one test at a time.
   *
   * Every test here signs in as the same admin and opens the same document, and
   * both of those are single-occupancy: Payload locks a document per session, so
   * a second browser gets it read-only, and the edit-view preference is stored
   * per user, so two runs racing each other flip it under one another. Run in
   * parallel — which is what `--repeat-each` does by default — they interfere,
   * and the symptom is never the real cause: a login that never resolves, a
   * preview that never opens, a different test failing each time.
   *
   * That erratic pattern sent this file through several wrong diagnoses. It is
   * not flakiness in the app; it is shared state, and the fix is to stop sharing
   * it concurrently.
   */
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

    // The row has to be opened first: a collapsed block row renders none of its
    // fields, so asserting against a shut one proves nothing. Clicking the
    // region is what asks the panel to expand it, which is the real flow.
    // No `force`: it skips the scroll-into-view a real click performs, and this
    // block sits well below the fold, so a forced click lands on coordinates
    // outside the viewport and hits nothing. The layout wait in
    // `openLivePreview` is what makes an ordinary click safe here.
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
