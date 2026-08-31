import { describe, expect, it } from 'vitest'
import { staticContentSecurityPolicy } from '../../scripts/staticCsp.mjs'

describe('staticContentSecurityPolicy', () => {
  it('allowlists Cloudflare Web Analytics script + RUM connect', () => {
    const csp = staticContentSecurityPolicy('https://accp.rinsly.com')

    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com")
    expect(csp).toContain(
      "connect-src 'self' https://accp.rinsly.com https://cloudflareinsights.com",
    )
    expect(csp).toContain("img-src 'self' data: https://accp.rinsly.com")
    expect(csp).toContain("form-action 'self' https://accp.rinsly.com")
    expect(csp).not.toMatch(/script-src 'self' 'unsafe-inline';/)
  })

  it('strips a path from the API URL before emitting origins', () => {
    const csp = staticContentSecurityPolicy('https://accp.rinsly.com/api')
    expect(csp).toContain('https://accp.rinsly.com')
    expect(csp).not.toContain('https://accp.rinsly.com/api')
  })
})
