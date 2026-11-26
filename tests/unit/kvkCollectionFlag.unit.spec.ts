import { describe, expect, it } from 'vitest'

import { isKvkCollectionEnabled } from '../../src/lib/kvkCollectionFlag'

describe('isKvkCollectionEnabled', () => {
  it('is off unless the value is 1, true, or yes', () => {
    expect(isKvkCollectionEnabled('')).toBe(false)
    expect(isKvkCollectionEnabled('0')).toBe(false)
    expect(isKvkCollectionEnabled('false')).toBe(false)
    expect(isKvkCollectionEnabled('off')).toBe(false)
    expect(isKvkCollectionEnabled('no')).toBe(false)
    expect(isKvkCollectionEnabled('1')).toBe(true)
    expect(isKvkCollectionEnabled('true')).toBe(true)
    expect(isKvkCollectionEnabled('YES')).toBe(true)
    expect(isKvkCollectionEnabled(' True ')).toBe(true)
  })
})
