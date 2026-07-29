/**
 * Seed the Rinsly site as a ONE-PAGER: a single `home` page whose sections carry
 * anchors, with the nav scrolling to them. The multi-page infrastructure (Pages
 * collection + /[locale]/[slug] route) stays intact — add more pages in the
 * admin any time and link to them from the nav.
 *
 * Run with:  pnpm seed        (= payload run scripts/seed.ts)
 *
 * Idempotent: re-running rebuilds the home page + globals, deletes any stray
 * non-home pages, and re-publishes. On a fresh DB an admin is created from
 * SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, falling back to the dev credentials
 * dev@rinsly.local / rinsly-dev — set the env vars when seeding a remote DB.
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
      eyebrow: t(locale, 'Webontwikkeling & beheer', 'Web development & management'),
      title: t(locale, 'Websites die werken. Volledig beheerd.', 'Websites that work. Fully managed.'),
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
        title: t(locale, 'Volledig beheer', 'Full management'),
        description: t(
          locale,
          'Wij nemen het complete technische beheer uit handen — hosting inbegrepen, voor één vast bedrag.',
          'We take the full technical management off your hands — hosting included, for one fixed fee.',
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
      title: t(locale, 'Uw website, volledig beheerd', 'Your website, fully managed'),
      intro: t(
        locale,
        'U bent altijd eigenaar van uw site en data, maandelijks opzegbaar, gebouwd als maatwerk op het Cloudflare-platform — geen WordPress-template. Hosting is bij elk pakket inbegrepen. Bij een driejarige beheerovereenkomst bouwen we uw website gratis (afhankelijk van de omvang). Onze tarieven zijn zakelijk en exclusief 21% btw.',
        'You always own your site and data, cancel monthly, custom-built on the Cloudflare platform — not a WordPress template. Hosting is included in every plan. With a three-year management agreement we build your website for free (depending on scale). Our rates are for business customers and exclude 21% VAT.',
      ),
    },
    tiers: [
      {
        name: 'Care',
        for: t(locale, 'Voor sites die wij bouwden', 'For sites we built'),
        price: '€49',
        per: t(locale, '/ mnd', '/ mo'),
        priceNote: t(locale, 'of €539 per jaar (1 maand gratis)', 'or €539 per year (1 month free)'),
        recommended: false,
        features: [
          feature(t(locale, 'Hosting', 'Hosting')),
          feature(t(locale, 'Snelle, performante website', 'Fast, high-performance website')),
          feature(t(locale, 'Volwaardig CMS (geen WordPress)', 'A real CMS (not WordPress)')),
          feature(t(locale, 'SSL & uptime-monitoring', 'SSL & uptime monitoring')),
          feature(t(locale, 'Beveiligings- & CMS-updates', 'Security & CMS updates')),
          feature(t(locale, 'Wekelijkse back-ups', 'Weekly backups')),
          feature(t(locale, 'Ticketsupport', 'Ticket support')),
          feature(t(locale, 'Wijzigingen', 'Changes'), false),
          feature(t(locale, 'Doorontwikkeling', 'Continuous improvement'), false),
        ],
      },
      {
        name: 'Managed',
        for: t(locale, 'Volledig ontzorgd', 'Everything taken care of'),
        price: '€99',
        per: t(locale, '/ mnd', '/ mo'),
        priceNote: t(locale, 'of €1.089 per jaar (1 maand gratis)', 'or €1,089 per year (1 month free)'),
        recommended: true,
        badge: t(locale, 'Aanbevolen', 'Recommended'),
        features: [
          feature(t(locale, 'Alles uit het Care-pakket', 'Everything in the Care package')),
          feature(t(locale, 'Tot 1 uur/mnd wijzigingen/support inbegrepen', 'Up to 1 hr/mo changes/support included')),
          feature(t(locale, 'Eén vast aanspreekpunt', 'One dedicated point of contact')),
        ],
      },
      {
        name: 'Partner',
        for: t(locale, 'Voor sites die moeten groeien', 'For sites that need to grow'),
        price: '€249',
        per: t(locale, '/ mnd', '/ mo'),
        priceNote: t(locale, 'of €2.490 per jaar (2 maanden gratis)', 'or €2,490 per year (2 months free)'),
        recommended: false,
        features: [
          feature(t(locale, 'Alles uit het Managed-pakket', 'Everything in the Managed package')),
          feature(t(locale, 'Tot 4 uur/mnd doorontwikkeling', 'Up to 4 hrs/mo development')),
          feature(t(locale, 'SEO- & performance-optimalisatie', 'SEO & performance optimisation')),
          feature(t(locale, 'Kwartaaloverleg & roadmap', 'Quarterly review & roadmap')),
        ],
      },
      {
        name: t(locale, 'Op maat', 'Custom'),
        for: t(locale, 'Grotere organisaties', 'Larger organisations'),
        price: t(locale, 'vanaf €499', 'from €499'),
        per: t(locale, '/ mnd', '/ mo'),
        priceNote: t(locale, 'op basis van uw wensen', 'tailored to your needs'),
        recommended: false,
        features: [
          feature(t(locale, 'Alles uit het Partner-pakket', 'Everything in the Partner package')),
          feature(t(locale, 'SLA met gegarandeerde reactietijden', 'SLA with guaranteed response times')),
          feature(t(locale, 'Streven naar 99,9% uptime', 'Targeting 99.9% uptime')),
          feature(t(locale, 'Staging-omgeving', 'Staging environment')),
          feature(t(locale, 'Meer ontwikkeluren', 'More development hours')),
          feature(t(locale, 'Verwerkersovereenkomst (AVG) & beveiligingsmaatregelen', 'Data-processing agreement (GDPR) & security measures')),
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
            'Een maatwerksite start vanaf €2.500 (excl. btw); de exacte prijs hangt af van de omvang en complexiteit. Op basis van uw wensen maken we vooraf een heldere offerte op maat — daarna weet u precies waar u aan toe bent.',
            'A custom site starts from €2,500 (excl. VAT); the exact price depends on the size and complexity. Based on your needs we prepare a clear, tailored quote up front — so you know exactly where you stand.',
          ),
          t(
            locale,
            'Net gestart? In overleg kunnen de bouwkosten over het eerste jaar worden gespreid.',
            'Just starting out? By arrangement, the build cost can be spread over the first year.',
          ),
          t(
            locale,
            'Gaat u een beheerovereenkomst van drie jaar aan, dan bouwen we uw website gratis — afhankelijk van de omvang van de site.',
            'If you commit to a three-year management agreement, we build your website for free — depending on the scale of the site.',
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
    'Webontwikkeling & beheer uit Woerden. Onbezorgd online.',
    'Web development & management from Woerden. Online without worries.',
  ),
  menuItems: [
    { label: t(locale, 'Diensten', 'Services'), url: `/${locale}#diensten` },
    { label: t(locale, 'Over ons', 'About'), url: `/${locale}#over` },
    { label: t(locale, 'Prijzen', 'Pricing'), url: `/${locale}#prijzen` },
    { label: 'Contact', url: `/${locale}#contact` },
  ],
  infoLinks: [
    { label: t(locale, 'Privacyverklaring', 'Privacy policy'), url: `/${locale}/privacy` },
    { label: t(locale, 'Algemene voorwaarden', 'Terms & conditions'), url: `/${locale}/voorwaarden` },
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

/* -------------------------------------------------------------------------- */
/* Legal pages (privacyverklaring + algemene voorwaarden)                     */
/*                                                                            */
/* Rendered as standalone rich-text pages at /[locale]/privacy and           */
/* /[locale]/voorwaarden. Content is authored below as a compact node list    */
/* (headings / paragraphs / lists, with **bold** inline) and compiled to      */
/* Lexical. These are solid market-standard drafts and are kept consistent    */
/* with the offerte contract + verwerkersovereenkomst — have a Dutch lawyer   */
/* confirm the binding wording before relying on them.                        */
/* -------------------------------------------------------------------------- */

type LegalNode = { h: string } | { p: string } | { ul: string[] } | { ol: string[] }

/** Split a string on `**bold**` markers into Lexical text nodes. */
const inlineText = (s: string) =>
  s
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? { type: 'text', detail: 0, format: 1, mode: 'normal', style: '', text: part.slice(2, -2), version: 1 }
        : { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: part, version: 1 },
    )

const legalRich = (nodes: LegalNode[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: nodes.map((n) => {
      if ('h' in n) {
        return { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, direction: 'ltr', children: inlineText(n.h) }
      }
      if ('ul' in n || 'ol' in n) {
        const items = 'ul' in n ? n.ul : n.ol
        const ordered = 'ol' in n
        return {
          type: 'list',
          listType: ordered ? 'number' : 'bullet',
          tag: ordered ? 'ol' : 'ul',
          start: 1,
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: items.map((text, i) => ({
            type: 'listitem',
            value: i + 1,
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: inlineText(text),
          })),
        }
      }
      return {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: inlineText(n.p),
      }
    }),
  },
})

/** A one-block layout carrying a legal document as reading-width prose. */
const legalLayout = (eyebrow: string, title: string, nodes: LegalNode[]): Block[] => [
  { blockType: 'richText', width: 'narrow', header: { eyebrow, title }, content: legalRich(nodes) },
]

const privacyNodes: Record<Locale, LegalNode[]> = {
  nl: [
    { p: 'Laatst bijgewerkt: 17 juli 2026.' },
    { p: 'Rinsly hecht veel waarde aan de bescherming van uw persoonsgegevens. In deze privacyverklaring leggen we uit welke gegevens we verwerken wanneer u onze website bezoekt of contact met ons opneemt, met welk doel en op welke grondslag, en welke rechten u heeft.' },
    { h: '1. Verwerkingsverantwoordelijke' },
    { p: 'Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden. KvK 85578835. E-mail: contact@rinsly.com. Rinsly is de verwerkingsverantwoordelijke voor de verwerking van persoonsgegevens via deze website.' },
    { h: '2. Welke gegevens we verwerken' },
    { ul: [
      '**Contactgegevens** die u zelf verstrekt via het contactformulier of per e-mail: uw naam, e-mailadres en de inhoud van uw bericht.',
      '**Technische gegevens** die automatisch worden vastgelegd wanneer u de site bezoekt: uw IP-adres, browsertype en technische log- en gebruiksgegevens.',
    ] },
    { h: '3. Doeleinden en grondslagen' },
    { p: 'We verwerken uw gegevens uitsluitend voor de volgende doeleinden:' },
    { ul: [
      'Het beantwoorden van uw vraag of het opstellen van een offerte. Grondslag: de uitvoering van of stappen voorafgaand aan een overeenkomst (art. 6 lid 1 sub b AVG).',
      'Het beveiligen, onderhouden en verbeteren van de website. Grondslag: ons gerechtvaardigd belang bij een veilige en goed werkende website (art. 6 lid 1 sub f AVG).',
      'Het voldoen aan wettelijke verplichtingen, zoals de fiscale bewaarplicht. Grondslag: een wettelijke plicht (art. 6 lid 1 sub c AVG).',
    ] },
    { h: '4. Cookies' },
    { p: 'Deze website plaatst uitsluitend functionele en strikt noodzakelijke cookies die nodig zijn om de site goed te laten werken en te beveiligen. Hiervoor is geen toestemming vereist. Worden er in de toekomst analytische of tracking-cookies geplaatst, dan vragen we daarvoor vooraf uw toestemming.' },
    { h: '5. Bewaartermijnen' },
    { p: 'We bewaren uw gegevens niet langer dan nodig is voor de genoemde doeleinden. Contactgegevens bewaren we zolang dat nodig is om uw vraag af te handelen en gedurende een redelijke periode daarna; gegevens die onder een wettelijke bewaarplicht vallen, bewaren we gedurende de wettelijke termijn. Technische logbestanden bewaren we voor een beperkte periode.' },
    { h: '6. Verwerkers en derden' },
    { p: 'Voor de hosting en werking van de website maken we gebruik van Cloudflare, Inc., dat als verwerker in onze opdracht persoonsgegevens verwerkt. We verkopen uw gegevens niet en delen deze niet met derden, behalve wanneer dat noodzakelijk is voor de genoemde doeleinden of wanneer we daartoe wettelijk verplicht zijn.' },
    { h: '7. Doorgifte buiten de EER' },
    { p: "Cloudflare, Inc. is gevestigd in de Verenigde Staten. Voor zover daarbij persoonsgegevens buiten de Europese Economische Ruimte worden verwerkt, gebeurt dat onder passende waarborgen zoals het EU-US Data Privacy Framework of de modelcontractbepalingen (SCC's) van de Europese Commissie." },
    { h: '8. Uw rechten' },
    { p: 'U heeft het recht op inzage, rectificatie, verwijdering, beperking van de verwerking, bezwaar tegen de verwerking en gegevensoverdraagbaarheid. Stuur uw verzoek naar contact@rinsly.com; we reageren binnen de wettelijke termijn. Bent u het niet eens met hoe we met uw gegevens omgaan, dan kunt u een klacht indienen bij de Autoriteit Persoonsgegevens.' },
    { h: '9. Beveiliging' },
    { p: 'We nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen, waaronder versleutelde verbindingen (TLS), toegangsbeheer en regelmatige back-ups.' },
    { h: '10. Wijzigingen' },
    { p: 'We kunnen deze privacyverklaring van tijd tot tijd aanpassen. De actuele versie staat altijd op deze pagina, met de datum van de laatste wijziging bovenaan.' },
  ],
  en: [
    { p: 'Last updated: 17 July 2026.' },
    { p: 'Rinsly takes the protection of your personal data seriously. This privacy policy explains which data we process when you visit our website or contact us, for what purpose and on what legal basis, and what rights you have.' },
    { h: '1. Controller' },
    { p: 'Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden, the Netherlands. Chamber of Commerce (KvK) 85578835. Email: contact@rinsly.com. Rinsly is the controller for the processing of personal data through this website.' },
    { h: '2. Data we process' },
    { ul: [
      '**Contact details** you provide yourself through the contact form or by email: your name, email address and the content of your message.',
      '**Technical data** recorded automatically when you visit the site: your IP address, browser type and technical log and usage data.',
    ] },
    { h: '3. Purposes and legal bases' },
    { p: 'We process your data only for the following purposes:' },
    { ul: [
      'Answering your question or preparing a quote. Basis: performance of, or steps prior to, a contract (art. 6(1)(b) GDPR).',
      'Securing, maintaining and improving the website. Basis: our legitimate interest in a secure, well-functioning website (art. 6(1)(f) GDPR).',
      'Complying with legal obligations, such as tax retention rules. Basis: a legal obligation (art. 6(1)(c) GDPR).',
    ] },
    { h: '4. Cookies' },
    { p: 'This website places only functional and strictly necessary cookies required for the site to work and to be secure. No consent is required for these. Should analytics or tracking cookies be introduced in the future, we will ask for your consent first.' },
    { h: '5. Retention' },
    { p: 'We do not keep your data longer than necessary for the purposes above. We keep contact details for as long as needed to handle your enquiry and for a reasonable period afterwards; data subject to a legal retention obligation is kept for the statutory term. Technical logs are kept for a limited period.' },
    { h: '6. Processors and third parties' },
    { p: 'For hosting and running the website we use Cloudflare, Inc., which processes personal data as our processor on our instructions. We do not sell your data and do not share it with third parties except where necessary for the purposes above or where legally required.' },
    { h: '7. Transfers outside the EEA' },
    { p: "Cloudflare, Inc. is based in the United States. Where personal data is processed outside the European Economic Area, this takes place under appropriate safeguards such as the EU-US Data Privacy Framework or the European Commission's Standard Contractual Clauses (SCCs)." },
    { h: '8. Your rights' },
    { p: 'You have the right to access, rectification, erasure, restriction of processing, objection to processing and data portability. Send your request to contact@rinsly.com; we will respond within the statutory period. If you disagree with how we handle your data, you may lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).' },
    { h: '9. Security' },
    { p: 'We take appropriate technical and organisational measures to protect your personal data, including encrypted connections (TLS), access control and regular backups.' },
    { h: '10. Changes' },
    { p: 'We may update this privacy policy from time to time. The current version is always available on this page, with the date of the last change shown at the top.' },
  ],
}

const voorwaardenNodes: Record<Locale, LegalNode[]> = {
  nl: [
    { p: 'Laatst bijgewerkt: 17 juli 2026.' },
    { h: 'Artikel 1 — Definities' },
    { ul: [
      '**Rinsly:** de eenmanszaak Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden, KvK 85578835, gebruiker van deze algemene voorwaarden.',
      '**Opdrachtgever:** de partij die met Rinsly een overeenkomst aangaat of daartoe een offerte ontvangt.',
      '**Diensten:** het bouwen van websites en/of het verzorgen van hosting en technisch onderhoud, zoals nader omschreven in de offerte of overeenkomst.',
      '**Meerwerk:** werkzaamheden die buiten de overeengekomen Diensten vallen.',
    ] },
    { h: 'Artikel 2 — Toepasselijkheid' },
    { ol: [
      'Deze algemene voorwaarden zijn van toepassing op alle offertes, aanbiedingen en overeenkomsten tussen Rinsly en opdrachtgever.',
      'Afwijkingen gelden alleen als deze schriftelijk zijn overeengekomen.',
      'De toepasselijkheid van inkoop- of andere voorwaarden van opdrachtgever wordt uitdrukkelijk van de hand gewezen.',
      'Deze voorwaarden zijn gericht op zakelijke opdrachtgevers.',
    ] },
    { h: 'Artikel 3 — Offertes en totstandkoming' },
    { ol: [
      'Offertes en op de website genoemde vanaf-prijzen zijn vrijblijvend en indicatief, tenzij uitdrukkelijk anders vermeld.',
      'Een overeenkomst komt tot stand na schriftelijke aanvaarding of ondertekening door beide partijen.',
      'Kennelijke vergissingen of fouten in een offerte binden Rinsly niet.',
    ] },
    { h: 'Artikel 4 — Prijzen en betaling' },
    { ol: [
      'Alle prijzen zijn zakelijk en exclusief 21% btw.',
      'Facturatie van hosting en onderhoud vindt vooraf plaats, per jaar of per kwartaal. Betaling geschiedt binnen 14 dagen na factuurdatum.',
      'Bij niet-tijdige betaling is opdrachtgever van rechtswege in verzuim en is de wettelijke handelsrente en redelijke incassokosten verschuldigd.',
      'Rinsly mag de vergoeding jaarlijks per 1 januari aanpassen aan de consumentenprijsindex (CBS). Verdergaande verhogingen worden ten minste één maand vooraf aangekondigd; is opdrachtgever het daarmee niet eens, dan kan zij de overeenkomst opzeggen tegen de ingangsdatum van de verhoging.',
    ] },
    { h: 'Artikel 5 — Uitvoering' },
    { ol: [
      'Rinsly voert de Diensten naar beste inzicht en vermogen uit; het betreft een inspanningsverplichting.',
      'Opdrachtgever verstrekt tijdig de informatie, content en toegang die Rinsly redelijkerwijs nodig heeft, en staat in voor de rechtmatigheid van aangeleverde content.',
      'Genoemde termijnen zijn indicatief en niet fataal, tenzij schriftelijk anders overeengekomen.',
    ] },
    { h: 'Artikel 6 — Hosting en diensten van derden' },
    { ol: [
      'De website wordt gehost op het Cloudflare-platform. Op de diensten van Cloudflare zijn diens eigen voorwaarden van toepassing.',
      'Rinsly is niet aansprakelijk voor storingen, wijzigingen of uitval die aan Cloudflare of andere toeleveranciers zijn toe te rekenen.',
    ] },
    { h: 'Artikel 7 — Beschikbaarheid en onderhoud' },
    { ol: [
      'Rinsly spant zich in voor een goede beschikbaarheid van de website en voert het onderhoud met zorg uit. Een specifieke of ononderbroken beschikbaarheid wordt niet gegarandeerd, tenzij daarover in een afzonderlijke service level agreement (SLA) uitdrukkelijk anders is overeengekomen.',
      'Rinsly maakt periodiek back-ups zodat herstel bij dataverlies redelijkerwijs mogelijk is.',
      'Storingen kunnen per e-mail worden gemeld; Rinsly reageert binnen de in de overeenkomst of SLA genoemde termijn.',
    ] },
    { h: 'Artikel 8 — Meerwerk' },
    { ol: [
      'Werkzaamheden buiten de overeengekomen Diensten gelden als Meerwerk en worden vooraf afgesproken of op nacalculatie uitgevoerd tegen € 95 per uur (excl. btw).',
    ] },
    { h: 'Artikel 9 — Looptijd en opzegging' },
    { ol: [
      'Onderhouds- en hostingovereenkomsten worden aangegaan voor onbepaalde tijd en zijn maandelijks opzegbaar met een opzegtermijn van één maand.',
      'Vooruitbetaalde vergoedingen over de periode na de opzegdatum worden naar rato terugbetaald.',
      'Elke partij kan de overeenkomst met onmiddellijke ingang ontbinden bij een wezenlijke, niet-herstelde tekortkoming van de andere partij of bij diens faillissement of surseance van betaling.',
    ] },
    { h: 'Artikel 10 — Intellectueel eigendom en eigendom' },
    { ol: [
      'De website, de inhoud en de bijbehorende data blijven eigendom van opdrachtgever. Na volledige betaling verkrijgt opdrachtgever het recht op vrije overdracht van de website en de broncode.',
      'Door Rinsly gebruikte generieke onderdelen, hulpmiddelen en kennis blijven aan Rinsly voorbehouden.',
      'Bij beëindiging verleent Rinsly redelijke medewerking aan de overdracht van de website, data en het domein en houdt de omgeving hiervoor nog dertig dagen beschikbaar.',
    ] },
    { h: 'Artikel 11 — Verwerking van persoonsgegevens' },
    { ol: [
      'Voor zover Rinsly bij de Diensten persoonsgegevens verwerkt in opdracht van opdrachtgever, geldt de tussen partijen gesloten verwerkersovereenkomst, die onderdeel uitmaakt van de overeenkomst.',
    ] },
    { h: 'Artikel 12 — Aansprakelijkheid' },
    { ol: [
      'De aansprakelijkheid van Rinsly is beperkt tot directe schade en tot ten hoogste het bedrag dat opdrachtgever in de twaalf maanden voorafgaand aan de schadeveroorzakende gebeurtenis uit hoofde van de overeenkomst heeft betaald.',
      'Rinsly is niet aansprakelijk voor indirecte schade, waaronder gevolgschade, gederfde omzet en dataverlies buiten de laatst beschikbare back-up.',
      'Deze beperkingen gelden niet bij opzet of bewuste roekeloosheid van Rinsly.',
    ] },
    { h: 'Artikel 13 — Overmacht' },
    { ol: [
      'Bij overmacht worden de verplichtingen opgeschort. Onder overmacht valt mede het uitvallen van of storingen bij toeleveranciers zoals Cloudflare.',
    ] },
    { h: 'Artikel 14 — Geheimhouding' },
    { ol: [
      'Partijen houden vertrouwelijke informatie geheim en gebruiken deze uitsluitend voor de uitvoering van de overeenkomst.',
    ] },
    { h: 'Artikel 15 — Klachten' },
    { ol: [
      'Klachten over de Diensten worden binnen bekwame tijd na ontdekking schriftelijk aan Rinsly gemeld, zodat Rinsly gelegenheid heeft deze te verhelpen.',
    ] },
    { h: 'Artikel 16 — Wijziging van de voorwaarden' },
    { ol: [
      'Rinsly mag deze algemene voorwaarden wijzigen. Wijzigingen gelden voor lopende overeenkomsten na aankondiging, met inachtneming van een redelijke termijn.',
    ] },
    { h: 'Artikel 17 — Toepasselijk recht en geschillen' },
    { ol: [
      'Op alle overeenkomsten is Nederlands recht van toepassing.',
      'Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement van de vestigingsplaats van Rinsly.',
    ] },
  ],
  en: [
    { p: 'Last updated: 17 July 2026.' },
    { h: 'Article 1 — Definitions' },
    { ul: [
      '**Rinsly:** the sole proprietorship Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden, the Netherlands, KvK 85578835, user of these terms.',
      '**Client:** the party entering into an agreement with Rinsly or receiving a quote for that purpose.',
      '**Services:** building websites and/or providing hosting and technical maintenance, as further described in the quote or agreement.',
      '**Additional work:** work falling outside the agreed Services.',
    ] },
    { h: 'Article 2 — Applicability' },
    { ol: [
      'These terms apply to all quotes, offers and agreements between Rinsly and the client.',
      'Deviations apply only where agreed in writing.',
      "The applicability of the client's purchasing or other terms is expressly rejected.",
      'These terms are intended for business clients.',
    ] },
    { h: 'Article 3 — Quotes and formation' },
    { ol: [
      'Quotes and any "from" prices stated on the website are without obligation and indicative, unless expressly stated otherwise.',
      'An agreement is formed upon written acceptance or signature by both parties.',
      'Obvious mistakes or errors in a quote do not bind Rinsly.',
    ] },
    { h: 'Article 4 — Prices and payment' },
    { ol: [
      'All prices are for business clients and exclude 21% VAT.',
      'Hosting and maintenance are invoiced in advance, annually or quarterly. Payment is due within 14 days of the invoice date.',
      'On late payment the client is in default by operation of law and owes the statutory commercial interest and reasonable collection costs.',
      'Rinsly may adjust the fee annually on 1 January in line with the Dutch consumer price index (CBS). Increases beyond that are announced at least one month in advance; if the client does not agree, it may terminate the agreement as at the effective date of the increase.',
    ] },
    { h: 'Article 5 — Performance' },
    { ol: [
      'Rinsly performs the Services to the best of its insight and ability; this is a best-efforts obligation.',
      'The client provides, in good time, the information, content and access Rinsly reasonably needs, and warrants the lawfulness of content it supplies.',
      'Stated deadlines are indicative and not strict, unless agreed otherwise in writing.',
    ] },
    { h: 'Article 6 — Hosting and third-party services' },
    { ol: [
      "The website is hosted on the Cloudflare platform. Cloudflare's own terms apply to its services.",
      'Rinsly is not liable for outages, changes or downtime attributable to Cloudflare or other suppliers.',
    ] },
    { h: 'Article 7 — Availability and maintenance' },
    { ol: [
      'Rinsly makes reasonable efforts to keep the website available and performs maintenance with care. No specific or uninterrupted availability is guaranteed unless expressly agreed otherwise in a separate service level agreement (SLA).',
      'Rinsly makes periodic backups so that recovery from data loss is reasonably possible.',
      'Incidents may be reported by email; Rinsly responds within the period stated in the agreement or SLA.',
    ] },
    { h: 'Article 8 — Additional work' },
    { ol: [
      'Work outside the agreed Services counts as additional work and is agreed in advance or carried out on a time-and-materials basis at € 95 per hour (excl. VAT).',
    ] },
    { h: 'Article 9 — Term and termination' },
    { ol: [
      "Maintenance and hosting agreements are entered into for an indefinite term and are cancellable monthly with one month's notice.",
      'Fees prepaid for the period after the termination date are refunded pro rata.',
      'Either party may terminate the agreement with immediate effect in the event of a material, uncured breach by the other party or its bankruptcy or suspension of payment.',
    ] },
    { h: 'Article 10 — Intellectual property and ownership' },
    { ol: [
      "The website, its content and associated data remain the client's property. After full payment the client obtains the right to freely transfer the website and source code.",
      'Generic components, tools and know-how used by Rinsly remain reserved to Rinsly.',
      'On termination Rinsly gives reasonable assistance with the transfer of the website, data and domain and keeps the environment available for a further thirty days.',
    ] },
    { h: 'Article 11 — Processing of personal data' },
    { ol: [
      "Where Rinsly processes personal data on the client's instructions as part of the Services, the data-processing agreement concluded between the parties applies and forms part of the agreement.",
    ] },
    { h: 'Article 12 — Liability' },
    { ol: [
      "Rinsly's liability is limited to direct damage and to at most the amount the client paid under the agreement in the twelve months preceding the event causing the damage.",
      'Rinsly is not liable for indirect damage, including consequential loss, lost revenue and data loss beyond the last available backup.',
      "These limitations do not apply in the event of intent or deliberate recklessness on Rinsly's part.",
    ] },
    { h: 'Article 13 — Force majeure' },
    { ol: [
      'In the event of force majeure the obligations are suspended. Force majeure includes the failure of or disruptions at suppliers such as Cloudflare.',
    ] },
    { h: 'Article 14 — Confidentiality' },
    { ol: [
      'The parties keep confidential information secret and use it only to perform the agreement.',
    ] },
    { h: 'Article 15 — Complaints' },
    { ol: [
      'Complaints about the Services are reported to Rinsly in writing within a reasonable time of discovery, so that Rinsly has the opportunity to remedy them.',
    ] },
    { h: 'Article 16 — Changes to these terms' },
    { ol: [
      'Rinsly may amend these terms. Changes apply to ongoing agreements after announcement, observing a reasonable period.',
    ] },
    { h: 'Article 17 — Governing law and disputes' },
    { ol: [
      'All agreements are governed by Dutch law.',
      'Disputes are submitted to the competent court in the district where Rinsly is established.',
    ] },
  ],
}

/** The two content pages seeded alongside the home one-pager. */
const contentPages = [
  {
    slug: 'privacy',
    title: (locale: Locale) => t(locale, 'Privacyverklaring', 'Privacy policy'),
    layout: (locale: Locale) =>
      legalLayout(t(locale, 'Juridisch', 'Legal'), t(locale, 'Privacyverklaring', 'Privacy policy'), privacyNodes[locale]),
  },
  {
    slug: 'voorwaarden',
    title: (locale: Locale) => t(locale, 'Algemene voorwaarden', 'Terms & conditions'),
    layout: (locale: Locale) =>
      legalLayout(t(locale, 'Juridisch', 'Legal'), t(locale, 'Algemene voorwaarden', 'Terms & conditions'), voorwaardenNodes[locale]),
  },
]

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
    const email = process.env.SEED_ADMIN_EMAIL || 'dev@rinsly.local'
    const password = process.env.SEED_ADMIN_PASSWORD || 'rinsly-dev'
    user = (await payload.create({
      collection: 'users',
      data: { email, password, roles: ['admin'] },
    })) as User
    console.log(`Created admin ${email}`)
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

  // Standalone legal pages (privacyverklaring + algemene voorwaarden), linked
  // from the footer. Upserted by slug and published in both locales.
  for (const page of contentPages) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      draft: true,
      limit: 1,
      depth: 0,
    })
    let doc = existing.docs.find((d) => d?.id != null) as { id: number } | undefined
    if (!doc) {
      doc = (await payload.create({
        collection: 'pages',
        draft: true,
        locale: 'nl',
        data: { slug: page.slug, title: page.title('nl') } as never,
        user,
      })) as { id: number }
    }
    for (const locale of ['nl', 'en'] as Locale[]) {
      await payload.update({
        collection: 'pages',
        id: doc.id,
        draft: true,
        locale,
        data: { title: page.title(locale), layout: page.layout(locale) } as never,
        user,
      })
    }
    await payload.update({ collection: 'pages', id: doc.id, data: { _status: 'published' } as never, user })
    console.log(`Published /${page.slug}`)
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
