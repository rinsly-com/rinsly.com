import { describe, expect, it, vi } from 'vitest'

import { extraRenderers } from '@/blockRenderers'
import { productBlocks } from '@/blocks/product'
import { productRenderers } from '@/components/custom/product/renderers'

const createPreviewShell = vi.hoisted(() =>
  vi.fn((_renderers?: Record<string, unknown>) => {
    function MockPreviewShell() {
      return null
    }
    return MockPreviewShell
  }),
)

vi.mock('@rinsly-com/site-core/preview', () => ({
  createPreviewShell,
}))

const productKeys = () => Object.keys(productRenderers).sort()

const productKeysIn = (map: Record<string, unknown> | undefined) =>
  Object.keys(map ?? {})
    .filter((key) => key in productRenderers)
    .sort()

const previewRendererMap = async (): Promise<Record<string, unknown>> => {
  if (createPreviewShell.mock.calls.length === 0) {
    await import('@/components/PreviewShell')
  }
  const map = createPreviewShell.mock.calls[0]?.[0]
  if (!map) {
    throw new Error('createPreviewShell was not called with a renderer map')
  }
  return map
}

describe('live preview renders the same blocks as the public site', () => {
  it('every product block has a renderer', () => {
    expect(Object.keys(productRenderers).sort()).toEqual(productBlocks.map((block) => block.slug).sort())
  })

  it('both the server map and the live-preview map include the product renderers', async () => {
    const previewMap = await previewRendererMap()
    const expected = productKeys()
    // Keys, not a source grep: a commented-out `...productRenderers` must fail.
    expect(productKeysIn(previewMap)).toEqual(expected)
    expect(productKeysIn(extraRenderers)).toEqual(expected)
  })

  it('every other extra block (revenueCalculator, diagram) and contact is in both maps', async () => {
    const previewMap = await previewRendererMap()
    for (const key of ['contact', 'revenueCalculator', 'diagram']) {
      expect(previewMap).toHaveProperty(key)
      expect(extraRenderers).toHaveProperty(key)
    }
  })
})
