import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { isKvkCollectionEnabled, KVK_COLLECTION_FLAG } from '../../src/lib/kvkCollectionFlag'

const deployProdSource = readFileSync(
  new URL('../../.github/workflows/deploy-prod.yml', import.meta.url),
  'utf8',
)
const envExampleSource = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8')
const wranglerSource = readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8')

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

describe('wiring', () => {
  it('passes the flag into the prod static build from a repo var, default off', () => {
    expect(KVK_COLLECTION_FLAG).toBe('RINSLY_KVK_COLLECTION_ENABLED')
    expect(deployProdSource).toMatch(
      /RINSLY_KVK_COLLECTION_ENABLED:\s*\$\{\{\s*vars\.RINSLY_KVK_COLLECTION_ENABLED\s*\}\}/,
    )
    const wranglerWithoutComments = wranglerSource.replace(/\/\/.*$/gm, '')
    expect(wranglerWithoutComments).not.toContain('RINSLY_KVK_COLLECTION_ENABLED')
    expect(envExampleSource).toMatch(/# RINSLY_KVK_COLLECTION_ENABLED=/)
    expect(envExampleSource).not.toMatch(/^RINSLY_KVK_COLLECTION_ENABLED=/m)
    const kvkBlock = envExampleSource.slice(
      envExampleSource.indexOf('Quote form'),
      envExampleSource.indexOf('# RINSLY_KVK_COLLECTION_ENABLED='),
    )
    expect(kvkBlock).toMatch(/Actions variable/)
    expect(kvkBlock).toMatch(/Worker var/)
    expect(kvkBlock).toMatch(/wrangler.jsonc/)
  })
})
