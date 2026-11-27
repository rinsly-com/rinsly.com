import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@rinsly-com/site-core/ui', () => ({
  Eyebrow: ({ children }: { children: unknown }) => <span>{children as string}</span>,
  Section: ({ children }: { children: unknown }) => <section>{children as string}</section>,
}))
vi.mock('@/components/custom/product/ProductLink', () => ({ ProductLink: () => <span>link</span> }))

import { CmsPhone, MiniEnvironments } from '@/components/custom/product/Frames'
import { ProductHero } from '@/components/custom/product/ProductHero'

describe('redesign v8 frames', () => {
  it('the phone draws the save label from the CMS, and an empty button without one; no notch, no side rail, no images', () => {
    const nl = renderToStaticMarkup(<CmsPhone saveLabel="Opslaan" />)
    expect(nl).toContain('>Opslaan<')
    expect(nl).not.toMatch(/<img|<svg|url\(/)
    const en = renderToStaticMarkup(<CmsPhone saveLabel={null} />)
    expect(en).not.toContain('Opslaan')
    expect(en).toContain('aria-hidden="true"')
  })

  it('Live/Staging labels come from the CMS; without them only the windows are drawn', () => {
    const nl = renderToStaticMarkup(<MiniEnvironments liveLabel="Live" stagingLabel="Staging" />)
    expect(nl).toContain('>Live<')
    expect(nl).toContain('>Staging<')
    expect(nl).not.toMatch(/€|<img|<svg/)
    const en = renderToStaticMarkup(<MiniEnvironments />)
    expect(en).not.toMatch(/Live|Staging/)
  })

  it('productHero renders the environments frame and hides an empty price chip', () => {
    const html = renderToStaticMarkup(
      <ProductHero
        locale="nl"
        title="Prijzen"
        sub="Sub"
        priceChip={{ amount: null, suffix: null }}
        buttons={[]}
        variant="split"
        showcase={{ kind: 'environments', url: 'example.nl', badge: 'Managed', caption: 'Voorbeeldindeling', liveLabel: 'Live', stagingLabel: 'Staging' }}
      />,
    )
    expect(html).toContain('>Live<')
    expect(html).not.toContain('data-count')
    expect(html).toContain('Voorbeeldindeling')
  })
})
