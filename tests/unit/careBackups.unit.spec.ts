import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Care (€49/mo) includes daily backups: continuous point-in-time database
 * restore (Cloudflare D1 Time Travel) plus a nightly media backup. The same
 * line is inherited by Managed, Growth and Op maat ("everything in Care").
 * Daily backups must not read as a Growth-only extra, and Care must not be
 * described as weekly.
 */
const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')
const checkConfig = readFileSync(new URL('../../src/check.config.ts', import.meta.url), 'utf8')

const DAILY_NL = 'Dagelijkse back-ups'
const DAILY_EN = 'Daily backups'
const PITR_NL = 'doorlopend puntherstel van de database via Cloudflare D1 Time Travel'
const PITR_EN = 'continuous point-in-time database restore via Cloudflare D1 Time Travel'
const MEDIA_NL = 'nachtelijke mediaback-up'
const MEDIA_EN = 'nightly media backup'

function prijzenLayoutSource(): string {
  const start = seed.indexOf('const prijzenLayout')
  const end = seed.indexOf('/* -------------------------------- /website')
  if (start < 0 || end < start) throw new Error('prijzenLayout slice not found')
  return seed.slice(start, end)
}

function tierSource(name: string): string {
  const layout = prijzenLayoutSource()
  const start = layout.indexOf(`name: '${name}'`)
  if (start < 0) throw new Error(`tier ${name} not found`)
  const next = layout.indexOf("name:", start + 1)
  return layout.slice(start, next < 0 ? undefined : next)
}

describe('Care daily backups', () => {
  const care = tierSource('Care')
  const growth = tierSource('Growth')

  it('names daily backups on Care, with both mechanisms, in Dutch and English', () => {
    expect(care).toContain(DAILY_NL)
    expect(care).toContain(DAILY_EN)
    expect(care).toContain(PITR_NL)
    expect(care).toContain(PITR_EN)
    expect(care).toContain(MEDIA_NL)
    expect(care).toContain(MEDIA_EN)
    expect(care).toContain("price: '€49'")
    expect(care).not.toContain('Wekelijkse')
    expect(care).not.toContain('Weekly')
  })

  it('does not list daily backups as a Growth-only extra', () => {
    expect(growth).toContain('Alles uit Managed')
    expect(growth).toContain('Everything in Managed')
    expect(growth).not.toContain(DAILY_NL)
    expect(growth).not.toContain(DAILY_EN)
    expect(growth).not.toContain('Wekelijkse')
    expect(growth).not.toContain('Weekly')
  })

  it('says the platform FAQ includes them from Care on every plan', () => {
    expect(seed).toContain('Dagelijkse back-ups horen bij elk pakket, vanaf Care, zonder onderscheid')
    expect(seed).toContain('Daily backups come with every plan, from Care up, with no distinction')
    expect(seed).not.toContain('Wekelijkse back-ups')
    expect(seed).not.toContain('Weekly backups')
  })

  it('uses the same phrase on the €49 scorecard line', () => {
    expect(checkConfig).toContain('vanaf €49 per maand')
    expect(checkConfig).toContain('dagelijkse back-ups')
    expect(checkConfig).toContain(PITR_NL)
    expect(checkConfig).toContain(MEDIA_NL)
  })
})
