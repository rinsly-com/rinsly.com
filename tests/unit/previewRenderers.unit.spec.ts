import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { productBlocks } from '@/blocks/product'
import { productRenderers } from '@/components/custom/product/renderers'

const source = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

describe('live preview renders the same blocks as the public site', () => {
  it('every product block has a renderer', () => {
    expect(Object.keys(productRenderers).sort()).toEqual(productBlocks.map((block) => block.slug).sort())
  })

  it('both the server map and the live-preview map include the product renderers', () => {
    // PreviewShell is a client module (createPreviewShell), so check its source rather than importing it.
    expect(source('src/blockRenderers.tsx')).toMatch(/\.\.\.productRenderers/)
    expect(source('src/components/PreviewShell.tsx')).toMatch(/\.\.\.productRenderers/)
  })

  it('every other extra block (revenueCalculator, diagram) and contact is in both maps', () => {
    for (const key of ['contact', 'revenueCalculator', 'diagram']) {
      expect(source('src/blockRenderers.tsx')).toContain(`  ${key}: (block`)
      expect(source('src/components/PreviewShell.tsx')).toContain(`  ${key}: (block`)
    }
  })
})
