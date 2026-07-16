/**
 * Seed the Rinsly site as a ONE-PAGER: a single `home` page whose sections carry
 * anchors, with the nav scrolling to them. The multi-page infrastructure (Pages
 * collection + /[locale]/[slug] route) stays intact — add more pages in the
 * admin any time and link to them from the nav.
 *
 * Run with:  pnpm seed        (= payload run scripts/seed.ts)
 *
 * Idempotent: re-running rebuilds the home page + globals, deletes any stray
 * non-home pages, and re-publishes. On a fresh DB a dev admin is created:
 * dev@rinsly.local / rinsly-dev.
 */
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-d1-sqlite'

import config from '../src/payload.config'
import type { User } from '../src/payload-types'

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>
type Block = Record<string, unknown>
type Locale = 'nl' | 'en'

const t = <T,>(locale: Locale, nl: T, en: T): T => (locale === 'nl' ? nl : en)

/** Lexical richText value: one paragraph per string. */
const richBody = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      textStyle: '',
      children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
    })),
  },
})

/** Internal link to a section on the home page (`/[locale]#anchor`). */
const anchorLink = (label: string, home: number, anchor: string, variant?: string): Block => ({
  label,
  type: 'internal',
  page: home,
  anchor,
  ...(variant ? { variant } : {}),
})

const feature = (text: string, included = true) => ({ text, included })

const homeLayout = (locale: Locale, home: number): Block[] => {
  const hero: Block = {
    blockType: 'hero',
    header: {
      eyebrow: t(locale, 'Webontwikkeling & hosting', 'Web development & hosting'),
      title: t(locale, 'Websites die werken. Zorgeloos gehost.', 'Websites that work. Hosted without worries.'),
      intro: t(
        locale,
        'Rinsly bouwt en beheert snelle, veilige websites op het Cloudflare-platform. Onbezorgd online, up-to-date en veilig — zonder dat u er omkijken naar heeft.',
        'Rinsly builds and maintains fast, secure websites on the Cloudflare platform. Online without worries, up to date and secure — with nothing for you to manage.',
      ),
    },
    buttons: [
      anchorLink(t(locale, 'Bekijk diensten', 'View services'), home, 'diensten', 'primary'),
      anchorLink(t(locale, 'Neem contact op', 'Get in touch'), home, 'contact', 'secondary'),
    ],
  }

  const services: Block = {
    blockType: 'services',
    anchor: 'diensten',
    header: {
      eyebrow: t(locale, 'Wat we doen', 'What we do'),
      title: t(locale, 'Alles onder één dak', 'Everything under one roof'),
      intro: t(
        locale,
        'Van eerste ontwerp tot dagelijks beheer — één aanspreekpunt voor uw hele online aanwezigheid.',
        'From first design to day-to-day management — one point of contact for your whole online presence.',
      ),
    },
    cards: [
      {
        icon: 'IconCode',
        title: t(locale, 'Webontwikkeling', 'Web development'),
        description: t(
          locale,
          'Maatwerk websites en webapplicaties, gebouwd met moderne techniek.',
          'Custom websites and web apps, built with modern technology.',
        ),
        features: [
          feature('Payload CMS'),
          feature('Next.js & React'),
          feature(t(locale, 'Responsief ontwerp', 'Responsive design')),
        ],
      },
      {
        icon: 'IconServer',
        title: t(locale, 'Hosting & onderhoud', 'Hosting & maintenance'),
        description: t(
          locale,
          'Snelle, veilige hosting met technisch onderhoud in één vast bedrag.',
          'Fast, secure hosting with technical maintenance in one fixed fee.',
        ),
        features: [
          feature(t(locale, 'Cloudflare-platform', 'Cloudflare platform')),
          feature(t(locale, 'SSL & monitoring', 'SSL & monitoring')),
          feature(t(locale, 'Back-ups & updates', 'Backups & updates')),
        ],
      },
      {
        icon: 'IconTrendingUp',
        title: t(locale, 'Doorontwikkeling', 'Continuous improvement'),
        description: t(
          locale,
          'Uw site groeit mee — nieuwe functies, pagina’s en optimalisatie.',
          'Your site keeps growing — new features, pages and optimisation.',
        ),
        features: [
          feature(t(locale, 'Nieuwe functies', 'New features')),
          feature(t(locale, 'SEO & performance', 'SEO & performance')),
          feature(t(locale, 'Advies op maat', 'Tailored advice')),
        ],
      },
    ],
  }

  const pricing: Block = {
    blockType: 'pricing',
    anchor: 'prijzen',
    header: {
      eyebrow: t(locale, 'Prijzen', 'Pricing'),
      title: t(locale, 'Kies wat bij u past', 'Pick what fits'),
      intro: t(locale, 'Alle bedragen zijn exclusief 21% btw.', 'All prices exclude 21% VAT.'),
    },
    tiers: [
      {
        name: t(locale, 'Basis', 'Basic'),
        for: t(locale, 'Kleine site, alleen hosting', 'Small site, hosting only'),
        price: '€45',
        per: t(locale, '/ mnd', '/ mo'),
        priceNote: t(locale, 'of €495 per jaar', 'or €495 per year'),
        recommended: false,
        features: [
          feature(t(locale, 'Hosting op Cloudflare', 'Hosting on Cloudflare')),
          feature(t(locale, 'SSL & uptime-monitoring', 'SSL & uptime monitoring')),
          feature(t(locale, 'Wekelijkse back-ups', 'Weekly backups')),
          feature(t(locale, 'Contentwijzigingen', 'Content changes'), false),
          feature(t(locale, 'Doorontwikkeling', 'Continuous improvement'), false),
        ],
      },
      {
        name: t(locale, 'Hosting & Onderhoud', 'Hosting & Maintenance'),
        for: t(locale, 'Volledig ontzorgd', 'Fully managed'),
        price: '€90',
        per: t(locale, '/ mnd', '/ mo'),
        priceNote: t(locale, 'of €990 per jaar (1 maand gratis)', 'or €990 per year (1 month free)'),
        recommended: true,
        badge: t(locale, 'Aanbevolen', 'Recommended'),
        features: [
          feature(t(locale, 'Hosting op Cloudflare', 'Hosting on Cloudflare')),
          feature(t(locale, 'SSL & uptime-monitoring', 'SSL & uptime monitoring')),
          feature(t(locale, 'Beveiligingsupdates & patches', 'Security updates & patches')),
          feature(t(locale, 'Payload CMS-updates', 'Payload CMS updates')),
          feature(t(locale, 'Wekelijkse back-ups', 'Weekly backups')),
          feature(t(locale, 'Tot 1 uur/mnd wijzigingen', 'Up to 1 hr/mo changes')),
          feature(t(locale, 'Reactietijd binnen 2 werkdagen', 'Response within 2 business days')),
        ],
      },
      {
        name: t(locale, 'Op maat', 'Custom'),
        for: t(locale, 'Grotere projecten', 'Larger projects'),
        price: t(locale, 'Op aanvraag', 'On request'),
        per: '',
        recommended: false,
        features: [
          feature(t(locale, 'Alles uit Onderhoud', 'Everything in Maintenance')),
          feature(t(locale, 'Meer wijzigingsuren', 'More change hours')),
          feature(t(locale, 'Doorontwikkeling', 'Continuous improvement')),
          feature(t(locale, 'SLA op maat', 'Custom SLA')),
        ],
      },
    ],
  }

  const about: Block = {
    blockType: 'richText',
    anchor: 'over',
    width: 'narrow',
    header: {
      eyebrow: t(locale, 'Over ons', 'About'),
      title: t(locale, 'Persoonlijk, technisch sterk, betrouwbaar', 'Personal, technically strong, reliable'),
    },
    content: richBody(
      t(
        locale,
        'Rinsly bouwt en beheert moderne websites met bewezen techniek — Payload CMS, Next.js en het Cloudflare-platform. Na de lancering nemen we het volledige technische beheer uit handen, zodat u zich op uw eigen werk kunt richten.',
        'Rinsly builds and maintains modern websites with proven technology — Payload CMS, Next.js and the Cloudflare platform. After launch we take the full technical management off your hands, so you can focus on your own work.',
      ),
      t(
        locale,
        'Korte lijnen, eerlijk advies en één vast aanspreekpunt. U weet wat u betaalt en uw site blijft snel, veilig en up-to-date.',
        'Short lines of communication, honest advice and a single point of contact. You know what you pay, and your site stays fast, secure and up to date.',
      ),
    ),
  }

  const faq: Block = {
    blockType: 'accordion',
    anchor: 'faq',
    header: {
      eyebrow: t(locale, 'Veelgestelde vragen', 'FAQ'),
      title: t(locale, 'Goed om te weten', 'Good to know'),
    },
    items: [
      {
        title: t(locale, 'Wat kost het bouwen van de website?', 'What does building the website cost?'),
        body: richBody(
          t(
            locale,
            'Dat hangt af van de omvang en complexiteit van de website. Op basis van uw wensen maken we vooraf een heldere offerte op maat — daarna weet u precies waar u aan toe bent.',
            'That depends on the size and complexity of the website. Based on your needs we prepare a clear, tailored quote up front — so you know exactly where you stand.',
          ),
        ),
      },
      {
        title: t(locale, 'Zit ik ergens aan vast?', 'Am I locked in?'),
        body: richBody(
          t(
            locale,
            'Nee. De overeenkomst is doorlopend en maandelijks opzegbaar met een opzegtermijn van één maand.',
            'No. The agreement is ongoing and cancellable monthly, with a one-month notice period.',
          ),
        ),
      },
      {
        title: t(locale, 'Van wie is de website?', 'Who owns the website?'),
        body: richBody(
          t(
            locale,
            'De website en alle data blijven altijd uw eigendom.',
            'The website and all data always remain your property.',
          ),
        ),
      },
    ],
  }

  const contact: Block = {
    blockType: 'contact',
    anchor: 'contact',
    header: {
      eyebrow: 'Contact',
      title: t(locale, 'Neem contact op', 'Get in touch'),
      intro: t(
        locale,
        'Vragen of een project in gedachten? Stuur een bericht of bel — u krijgt snel antwoord.',
        'Questions or a project in mind? Send a message or call — you’ll hear back quickly.',
      ),
    },
    showForm: true,
    items: [{ kind: 'email', label: 'E-mail', value: 'contact@rinsly.com' }],
    buttons: [
      { label: t(locale, 'Mail ons', 'Email us'), variant: 'secondary', type: 'external', url: 'mailto:contact@rinsly.com' },
    ],
  }

  const stackNote: Block = {
    blockType: 'note',
    text: t(
      locale,
      'Werkt u liever met een andere technologie? Geen probleem — we passen onze stack aan op uw voorkeur.',
      'Prefer a different technology? No problem — we adapt our stack to your preference.',
    ),
  }

  const cta: Block = {
    blockType: 'cta',
    eyebrow: t(locale, 'Aan de slag', 'Get started'),
    title: t(locale, 'Klaar om online te gaan?', 'Ready to go live?'),
    text: t(
      locale,
      'Vertel ons over uw project — we denken graag met u mee.',
      'Tell us about your project — we’d love to help.',
    ),
    button: anchorLink(t(locale, 'Neem contact op', 'Get in touch'), home, 'contact', 'primary'),
  }

  // Render order: hero → services → stack note → CTA → about → pricing → FAQ → contact.
  return [hero, services, stackNote, cta, about, pricing, faq, contact]
}

const headerData = (locale: Locale, home: number) => ({
  navItems: [
    anchorLink(t(locale, 'Diensten', 'Services'), home, 'diensten'),
    anchorLink(t(locale, 'Over ons', 'About'), home, 'over'),
    anchorLink(t(locale, 'Prijzen', 'Pricing'), home, 'prijzen'),
  ],
  cta: anchorLink('Contact', home, 'contact'),
})

const footerLocalized = (locale: Locale) => ({
  tagline: t(
    locale,
    'Webontwikkeling & hosting uit Woerden. Onbezorgd online.',
    'Web development & hosting from Woerden. Online without worries.',
  ),
  menuItems: [
    { label: t(locale, 'Diensten', 'Services'), url: `/${locale}#diensten` },
    { label: t(locale, 'Over ons', 'About'), url: `/${locale}#over` },
    { label: t(locale, 'Prijzen', 'Pricing'), url: `/${locale}#prijzen` },
    { label: 'Contact', url: `/${locale}#contact` },
  ],
  copyright: t(
    locale,
    '© Rinsly 2026 — Alle rechten voorbehouden.',
    '© Rinsly 2026 — All rights reserved.',
  ),
})

const footerShared = {
  email: 'contact@rinsly.com',
  kvk: '85578835',
  btw: 'NL248209085B01',
}

/** Drizzle-push orphan repair (dev only; a no-op on a migrated database). */
async function repairOrphanedVersions(payload: PayloadInstance) {
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { run: (query: ReturnType<typeof sql>) => Promise<unknown> }
    }
  ).drizzle
  if (!drizzle) return
  try {
    await drizzle.run(
      sql`UPDATE _pages_v SET parent_id = (SELECT p.id FROM pages p WHERE p.slug = _pages_v.version_slug)
          WHERE parent_id IS NULL AND EXISTS (SELECT 1 FROM pages p WHERE p.slug = _pages_v.version_slug)`,
    )
    await drizzle.run(sql`DELETE FROM _pages_v WHERE parent_id IS NULL`)
  } catch {
    /* healthy database — nothing to repair */
  }
}

async function run() {
  const payload = await getPayload({ config })
  await repairOrphanedVersions(payload)

  // Admin user
  const users = await payload.find({ collection: 'users', limit: 1, sort: 'createdAt' })
  let user = users.docs[0] as User | undefined
  if (!user) {
    user = (await payload.create({
      collection: 'users',
      data: { email: 'dev@rinsly.local', password: 'rinsly-dev', roles: ['admin'] },
    })) as User
    console.log('Created dev admin dev@rinsly.local / rinsly-dev')
  } else if (!user.roles?.includes('admin')) {
    user = (await payload.update({
      collection: 'users',
      id: user.id,
      data: { roles: [...(user.roles ?? []), 'admin'] },
    })) as User
  }
  console.log(`Seeding as ${user.email}`)

  // Ensure the single home page exists (create with just slug + nl title).
  const found = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    draft: true,
    limit: 1,
    depth: 0,
  })
  let home = found.docs.find((d) => d?.id != null) as { id: number } | undefined
  if (!home) {
    home = (await payload.create({
      collection: 'pages',
      draft: true,
      locale: 'nl',
      data: { slug: 'home', title: 'Home' } as never,
      user,
    })) as { id: number }
  }
  const homeId = home.id

  // Fill both locales, then publish.
  await payload.update({
    collection: 'pages',
    id: homeId,
    draft: true,
    locale: 'nl',
    data: { title: 'Rinsly', layout: homeLayout('nl', homeId) } as never,
    user,
  })
  await payload.update({
    collection: 'pages',
    id: homeId,
    draft: true,
    locale: 'en',
    data: { title: 'Rinsly', layout: homeLayout('en', homeId) } as never,
    user,
  })
  await payload.update({ collection: 'pages', id: homeId, data: { _status: 'published' } as never, user })
  console.log('Published home (one-pager)')

  // One-pager: remove any stray non-home pages (the collection + route stay, so
  // new pages can be added in the admin later).
  const others = await payload.find({
    collection: 'pages',
    where: { slug: { not_equals: 'home' } },
    draft: true,
    limit: 200,
    depth: 0,
  })
  for (const doc of others.docs) {
    if (doc?.id == null) continue
    await payload.delete({ collection: 'pages', id: doc.id, user })
    console.log(`Removed stray page /${(doc as { slug?: string }).slug}`)
  }

  // Globals
  await payload.updateGlobal({ slug: 'header', locale: 'nl', data: headerData('nl', homeId) as never, user })
  await payload.updateGlobal({ slug: 'header', locale: 'en', data: headerData('en', homeId) as never, user })
  await payload.updateGlobal({
    slug: 'footer',
    locale: 'nl',
    data: { ...footerShared, ...footerLocalized('nl') } as never,
    user,
  })
  await payload.updateGlobal({ slug: 'footer', locale: 'en', data: footerLocalized('en') as never, user })
  console.log('Globals seeded (header, footer)')

  console.log('Seed complete.')
}

try {
  await run()
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
