/**
 * Seed the Rinsly site as a ONE-PAGER: a single `home` page whose sections carry
 * anchors, with the nav scrolling to them. The multi-page infrastructure (Pages
 * collection + /[locale]/[slug] route) stays intact — add more pages in the
 * admin any time and link to them from the nav.
 *
 * The page is PARTNER-FIRST: it sells the partner proposition to design studios,
 * and the subscription tiers are shown so a partner can sell them on to their own
 * client. End customers arriving directly are the secondary audience.
 *
 * Copy here must follow ~/Rinsly/Marketing (POSITIONING.md, PRICING.md,
 * MESSAGING.md) — that folder is the commercial source of truth, this file is what
 * the world sees. Two rules that are easy to break: "Partner" means a design
 * studio and never a subscription tier (the €249 tier is **Growth**), and
 * "maandelijks opzegbaar" is only true on the paid-build route.
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

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/*                                                                            */
/* The site is a small set of pages, not a one-pager. Every one of them is a   */
/* row in the Pages collection, so `scripts/build-static.mjs` finds them by    */
/* querying published pages and prerenders `[slug]` from them — adding a page  */
/* here needs no route file.                                                  */
/*                                                                            */
/* Internal links need the TARGET PAGE'S ID, so `run()` creates every page     */
/* first, collects the ids into a `PageIds` map, and only then writes layouts. */
/* That is why every layout function takes `ids`.                             */
/* -------------------------------------------------------------------------- */

/** Slug → page id, filled in by `run()` before any layout is built. */
type PageIds = Record<string, number>

const SLUG = {
  home: 'home',
  partner: 'partnerprogramma',
  platform: 'platform',
  prijzen: 'prijzen',
  website: 'website',
  over: 'over',
  contact: 'contact',
} as const

/** Link to another page, optionally to an anchor inside it. */
const pageLink = (
  label: string,
  ids: PageIds,
  slug: string,
  opts: { anchor?: string; variant?: string } = {},
): Block => ({
  label,
  type: 'internal',
  page: ids[slug],
  ...(opts.anchor ? { anchor: opts.anchor } : {}),
  ...(opts.variant ? { variant: opts.variant } : {}),
})

const feature = (text: string, included = true) => ({ text, included })

/**
 * A page's own opening block. `hero` is not home-only — it works anywhere.
 *
 * `variant` is art direction from the engine (0.7.3+): it changes how loud the
 * hero is and where its glow sits, nothing else. Each page gets a different one
 * so they stop opening identically, and **`spotlight` is used once**, on the home
 * page — it is the only variant whose title outgrows the section headings, which
 * is what makes the home page read as the front door.
 */
const pageHero = (
  variant: 'default' | 'spotlight' | 'offset' | 'centered' | 'quiet',
  eyebrow: string,
  title: string,
  intro: string,
  buttons: Block[] = [],
): Block => ({
  blockType: 'hero',
  variant,
  header: { eyebrow, title, intro },
  ...(buttons.length ? { buttons } : {}),
})

/** A schematic from `src/components/custom/Diagram.tsx`, picked by name. */
const diagram = (kind: string, eyebrow: string, title: string, caption: string): Block => ({
  blockType: 'diagram',
  kind,
  eyebrow,
  title,
  caption,
})

const cta = (locale: Locale, ids: PageIds, eyebrow: string, title: string, text: string): Block => ({
  blockType: 'cta',
  eyebrow,
  title,
  text,
  button: pageLink(t(locale, 'Neem contact op', 'Get in touch'), ids, SLUG.contact, { variant: 'primary' }),
})

/* ------------------------------- / (home) --------------------------------- */
/* Deliberately short. It sells the idea and sends each audience onward; the  */
/* arguments live on the pages that own them.                                */

const homeLayout = (locale: Locale, ids: PageIds): Block[] => [
  pageHero(
    'spotlight',
    t(locale, 'Bouw & hosting voor ontwerpstudio’s', 'Build & hosting for design studios'),
    t(
      locale,
      'Jullie ontwerpen. Wij bouwen het en houden het draaiend.',
      'You design. We build it and keep it running.',
    ),
    t(
      locale,
      'Rinsly is de bouw- en beheerafdeling die ontwerpstudio’s niet hebben. Jullie leveren het ontwerp in Figma, wij bouwen het als een echte applicatie en draaien het daarna: hosting, updates en back-ups. Elke keer dat de klant betaalt, gaat er een deel naar jullie.',
      'Rinsly is the build-and-run department design studios don’t have. You deliver the design in Figma, we build it as a real application and run it from there: hosting, updates and backups. Every time the client pays, a share of it comes to you.',
    ),
    [
      pageLink(t(locale, 'Word partner', 'Become a partner'), ids, SLUG.partner, { variant: 'primary' }),
      pageLink(t(locale, 'Ik wil zelf een website', 'I just want a website'), ids, SLUG.website, { variant: 'secondary' }),
    ],
  ),
  {
    blockType: 'services',
    anchor: 'platform',
    header: {
      eyebrow: t(locale, 'Het platform', 'The platform'),
      title: t(locale, 'Eén engine, de hele fleet', 'One engine, the whole fleet'),
      intro: t(
        locale,
        'Geen thema en geen pagebuilder. Elke site is een applicatie op één gedeelde, geversioneerde engine. Daarom kan een beveiligingsfix één keer gemaakt worden en over alle sites tegelijk uitgerold.',
        'No theme, no page builder. Every site is an application on one shared, versioned engine, which is why a security fix can be made once and rolled out across every site at the same time.',
      ),
    },
    cards: [
      {
        icon: 'IconBrandFigma',
        title: t(locale, 'Van Figma naar productie', 'From Figma to production'),
        description: t(
          locale,
          'Wij bouwen uit Dev Mode. Type-scale, spacing, responsive gedrag en motion zitten in de engine, dus het ontwerp overleeft de bouw.',
          'We build from Dev Mode. Type scale, spacing, responsive behaviour and motion live in the engine, so the design survives the build.',
        ),
        features: [
          feature('Payload CMS, Next.js & React'),
          feature(t(locale, 'Meertalig, toegankelijk, getypeerd', 'Multilingual, accessible, typed')),
        ],
      },
      {
        icon: 'IconPackages',
        title: t(locale, 'Eén geversioneerde engine', 'One versioned engine'),
        description: t(
          locale,
          'Een beveiligingsfix maken we één keer en rollen we uit over de hele fleet. Geen plugin-sprawl, geen WordPress.',
          'A security fix is made once and rolled out across the whole fleet. No plugin sprawl, no WordPress.',
        ),
        features: [
          feature(t(locale, 'Fix in één release', 'Fixed in one release')),
          feature(t(locale, 'Elke site houdt zijn eigen ontwerp', 'Every site keeps its own design')),
        ],
      },
      {
        icon: 'IconServer2',
        title: t(locale, 'Draaien aan de edge', 'Running at the edge'),
        description: t(
          locale,
          'Eén omgeving per site, aan de edge, met limieten die we gewoon opschrijven.',
          'One environment per site, at the edge, with limits we simply write down.',
        ),
        features: [
          feature(t(locale, 'Edge-hosting & SSL', 'Edge hosting & SSL')),
          feature(t(locale, 'Doorlopend databaseherstel', 'Continuous database recovery')),
        ],
      },
    ],
  },
  {
    blockType: 'cta',
    eyebrow: t(locale, 'De techniek', 'The technical part'),
    title: t(locale, 'Eén fix, de hele fleet', 'One fix, the whole fleet'),
    text: t(
      locale,
      'Hoe die engine werkt, wat er in een release gebeurt en waar uw data staat. Dat leggen we liever uit dan dat we het samenvatten.',
      'How that engine works, what happens in a release, and where your data lives: we would rather explain it than summarise it.',
    ),
    button: pageLink(t(locale, 'Zo werkt het platform', 'How the platform works'), ids, SLUG.platform, { variant: 'primary' }),
  },
  {
    blockType: 'richText',
    width: 'wide',
    header: {
      eyebrow: t(locale, 'Twee deuren', 'Two doors'),
      title: t(locale, 'Voor wie is Rinsly?', 'Who is Rinsly for?'),
    },
    content: proseRich(
      locale === 'nl'
        ? [
            { p: '**Ontwerpstudio’s en freelance ontwerpers.** Jullie ontwerpen, wij bouwen en hosten, en van de doorlopende hostingomzet gaat een deel naar jullie, zolang die klant blijft. Eén ontwerp dat blijft betalen, in plaats van één keer factureren en klaar. Dit is waar onze aandacht naartoe gaat.' },
            { p: '**Bedrijven die zelf een site willen.** Dat kan gewoon, op precies dezelfde voorwaarden en voor dezelfde prijs. Zoekt u nog een ontwerper, dan brengen we u in contact met een van onze partners. Wij verkopen zelf geen ontwerp.' },
          ]
        : [
            { p: '**Design studios and freelance designers.** You design, we build and host, and a share of the recurring hosting revenue comes to you for as long as that client stays. One design that keeps paying, instead of invoicing once and moving on. This is where our attention goes.' },
            { p: '**Businesses that want a site of their own.** That works too, on exactly the same terms and for the same price. Still looking for a designer? We’ll introduce you to one of our partners: we don’t sell design ourselves.' },
          ],
    ),
  },
  cta(
    locale,
    ids,
    t(locale, 'Aan de slag', 'Get started'),
    t(locale, 'Klaar om samen te werken?', 'Ready to work together?'),
    t(
      locale,
      'Vertel wat je maakt en hoe je het nu oplevert, dan zeggen we eerlijk of dit iets voor je is.',
      'Tell us what you make and how you deliver it today: we’ll tell you honestly whether this is for you.',
    ),
  ),
]

/* --------------------------- /partnerprogramma ---------------------------- */
/* The pitch, broken into small blocks. It used to be one enormous richText   */
/* on the home page, which nobody reads.                                     */

const partnerLayout = (locale: Locale, ids: PageIds): Block[] => [
  pageHero(
    'offset',
    t(locale, 'Partnerprogramma', 'Partner programme'),
    t(locale, 'Eén ontwerp, elke maand inkomsten', 'One design, revenue every month'),
    t(
      locale,
      'Nu betaalt een ontwerpopdracht één keer. Je levert het bestand, je factureert, en die website verdient daarna niets meer voor je, terwijl iemand anders er maandelijks aan verdient met hosting. Breng het bij ons onder en dat maandbedrag loopt deels naar jou terug, zolang de site leeft.',
      'Right now a design job pays once. You deliver the file, you invoice, and that website never earns you anything again, while somebody else takes a monthly fee to host it. Bring it to us and part of that monthly fee comes back to you, for as long as the site is live.',
    ),
    [pageLink(t(locale, 'Vraag een partnergesprek aan', 'Request a partner call'), ids, SLUG.contact, { variant: 'primary' })],
  ),
  {
    blockType: 'services',
    anchor: 'hoe',
    header: {
      eyebrow: t(locale, 'Hoe het werkt', 'How it works'),
      title: t(locale, 'Jullie ontwerpen, wij doen de rest', 'You design, we do the rest'),
    },
    cards: [
      {
        icon: 'IconBrandFigma',
        title: t(locale, '1. Jullie ontwerpen', '1. You design'),
        description: t(
          locale,
          'Wat jullie al doen: het ontwerp, in Figma. Eén harde eis is een eigen licentie met Dev Mode: daaruit bouwen we.',
          'What you already do: the design, in Figma. One hard requirement is your own licence with Dev Mode, that’s what we build from.',
        ),
        features: [feature(t(locale, 'Aanlevering als Figma-bestand', 'Delivered as a Figma file'))],
      },
      {
        icon: 'IconCode',
        title: t(locale, '2. Wij bouwen en zetten live', '2. We build and launch'),
        description: t(
          locale,
          'Wij maken er een getypeerde applicatie van op onze engine en zetten die live. De klant sluit de overeenkomst bij Rinsly.',
          'We turn it into a typed application on our engine and take it live. The client’s agreement is with Rinsly.',
        ),
        features: [feature(t(locale, 'Gratis bouw bij drie jaar hosting', 'Free build on three years of hosting'))],
      },
      {
        icon: 'IconRefresh',
        title: t(locale, '3. Wij draaien het', '3. We run it'),
        description: t(
          locale,
          'Updates, back-ups, support. Jij hoeft nooit meer een CMS te patchen of op zondag een storing op te lossen.',
          'Updates, backups, support. You never patch a CMS or fix a Sunday outage again.',
        ),
        features: [feature(t(locale, 'Jij krijgt je deel van de omzet', 'You get your share of the revenue'))],
      },
    ],
  },
  diagram(
    'figmaToProduction',
    t(locale, 'Van ontwerp naar live', 'From design to live'),
    t(locale, 'Drie stappen, en maar één ervan is van jou', 'Three steps, and only one of them is yours'),
    t(
      locale,
      'Jullie leveren het Figma-bestand met Dev Mode aan. Rinsly bouwt het als getypeerde applicatie op de gedeelde engine en zet het live, en draait daarna de hosting, het CMS en de back-ups.',
      'You hand over the Figma file with Dev Mode. Rinsly builds it as a typed application on the shared engine and takes it live, then runs the hosting, the CMS and the backups.',
    ),
  ),
  {
    blockType: 'richText',
    anchor: 'tarief',
    width: 'wide',
    header: {
      eyebrow: t(locale, 'Wat je verdient', 'What you earn'),
      title: t(locale, 'Je tarief bepaal je zelf', 'You set your own rate'),
    },
    content: proseRich(
      locale === 'nl'
        ? [
            { p: 'De basis is **0%**, en dat is geen onderhandeltruc: de vergoeding betaalt niet voor een introductie die je één keer doet, maar voor werk dat elke maand doorgaat. Elk procentpunt koop je met een verantwoordelijkheid, of met omzet.' },
            { p: 'De omzetniveaus tellen bij elkaar op, dus het maximum is **35%** van de doorlopende abonnementsomzet, exclusief btw. Eenmalige bouwkosten en meerwerk vallen erbuiten.' },
            { p: 'Tien klanten op **Managed** met exclusiviteit en relatiebeheer is 15% van €990: ongeveer €149 per maand, voor ontwerpen die je al gemaakt had. Bij de elfde klant gaat je portfolio over de €1.000 en komt er een omzetniveau bij, dus 20%. Reken het hieronder zelf na.' },
          ]
        : [
            { p: 'The base is **0%**, and that is not a bargaining trick: the fee does not pay for an introduction you make once, it pays for work that continues every month. Every percentage point is bought with a responsibility, or with volume.' },
            { p: 'The volume levels stack, so the maximum is **35%** of the recurring subscription revenue, excluding VAT. One-off build fees and additional work are not shared.' },
            { p: 'Ten clients on **Managed** with exclusivity and relationship management is 15% of €990: about €149 a month, for designs you had already made. Add an eleventh and your portfolio passes €1.000, which adds a volume level, so 20%. Work it out yourself below.' },
          ],
    ),
  },
  {
    blockType: 'revenueCalculator',
    anchor: 'rekenen',
    eyebrow: t(locale, 'Rekenen', 'Do the maths'),
    title: t(locale, 'Wat zou jij eraan overhouden?', 'What would you take home?'),
    intro: t(
      locale,
      'Kies een pakket, schuif het aantal klanten en vink aan wat je zou oppakken. Het tarief en je aandeel rekenen mee.',
      'Pick a plan, drag the number of clients and tick what you would take on. The rate and your share follow along.',
    ),
    footnote: t(
      locale,
      'De omzetniveaus tellen bij elkaar op, dus het maximum is 35% van de doorlopende abonnementsomzet, exclusief btw. Eenmalige bouwkosten en meerwerk vallen erbuiten. Uitbetaling volgt het geld van de klant: wij betalen niet voordat wij betaald zijn, en op het factuurritme van die klant. Dit is een indicatie, geen aanbod.',
      'The volume levels stack, so the maximum is 35% of the recurring subscription revenue, excluding VAT. One-off build fees and additional work are not shared. Payment follows the client’s money: we do not pay before we have been paid, and we pay on that client’s billing rhythm. This is an indication, not an offer.',
    ),
  },
  {
    blockType: 'richText',
    anchor: 'facturatie',
    width: 'wide',
    header: {
      eyebrow: t(locale, 'Facturatie', 'Invoicing'),
      title: t(locale, 'Jij kiest wie de klant factureert', 'You choose who invoices the client'),
    },
    content: proseRich(
      locale === 'nl'
        ? [
            { p: 'Wil je niets met facturatie te maken hebben, of wil je juist alles op je eigen factuur? Beide kan, en het maakt voor ons niets uit.' },
            { ul: [
              '**Wij factureren de klant.** Jij hoeft niets in te kopen. Zodra de klant betaald heeft, betalen wij jouw deel uit, op het factuurritme van die klant: betaalt hij per maand, dan word jij per maand betaald.',
              '**Jij factureert je eigen klant.** Je koopt bij ons in tegen de prijs min jouw percentage en zet hosting op je eigen factuur, naast je ontwerpwerk. Je bepaalt dan zelf je prijs en desgewenst je eigen abonnementsvorm, en je mag ons noemen zoals je elke infrastructuurpartij zou noemen.',
            ] },
            { p: 'Wat in beide gevallen hetzelfde blijft: de overeenkomst over de website loopt tussen Rinsly en de eindklant. Dat is er niet om jou buiten te sluiten, maar om jou vrij te laten: **wil je een klant niet langer onder je houden, dan gaat die zonder onderbreking verder als klant van Rinsly**: zelfde site, zelfde voorwaarden, zelfde prijs. Je kunt dus weglopen zonder dat jouw klant iets kwijtraakt.' },
          ]
        : [
            { p: 'Want nothing to do with invoicing, or want everything on your own invoice? Both work, and it makes no difference to us.' },
            { ul: [
              '**We invoice the client.** You buy nothing. As soon as the client has paid, we pay out your share, on that client’s billing rhythm: if they pay monthly, you are paid monthly.',
              '**You invoice your own client.** You buy from us at the price minus your percentage and put hosting on your own invoice, next to your design work. You then set your own price, and your own tiers if you want, and you may name us the way you would credit any infrastructure provider.',
            ] },
            { p: 'What stays the same either way: the agreement about the website runs between Rinsly and the end client. That is not there to cut you out but to leave you free: **if you no longer want to carry a client, they simply carry on as a Rinsly client**: same site, same terms, same price. So you can walk away without your client losing anything.' },
          ],
    ),
  },
  diagram(
    'invoicingRoutes',
    t(locale, 'Twee routes', 'Two routes'),
    t(locale, 'Wie stuurt welke factuur', 'Who sends which invoice'),
    t(
      locale,
      'Route A: Rinsly factureert de eindklant de lijstprijs en betaalt jou je aandeel uit. Route B: jij factureert je eigen klant en koopt bij ons in tegen de lijstprijs min jouw percentage. De overeenkomst over de website loopt in beide gevallen tussen Rinsly en de eindklant.',
      'Route A: Rinsly invoices the end client at list and pays out your share. Route B: you invoice your own client and buy from us at list minus your percentage. Either way, the agreement about the website runs between Rinsly and the end client.',
    ),
  ),
  {
    blockType: 'services',
    anchor: 'leads',
    header: {
      eyebrow: t(locale, 'Leads voor partners', 'Leads for partners'),
      title: t(locale, 'Sneller groeien dan je eigen boek toelaat', 'Grow faster than your own book allows'),
      intro: t(
        locale,
        'Wij meten websites op grote schaal: we sporen bedrijven op, scoren hun site tegen de huidige stand van het web en laten de beste kandidaten door een model beoordelen. Als partner krijg je daar elke maand een deel van, zonder dat het je iets kost, en heb je er meer nodig, dan maken we ze op aanvraag aan.',
        'We measure websites at scale: we find businesses, score their site against current web practice and have a model judge the best candidates. As a partner you get a share of that every month at no cost, and if you need more, we generate them on request.',
      ),
    },
    cards: [
      {
        icon: 'IconSeeding',
        title: t(locale, 'Elke maand inbegrepen', 'Included every month'),
        description: t(
          locale,
          'Bij je partnerschap hoort een maandelijkse portie leads. Kost je niets, hoef je niet af te nemen, en je zit er niet aan vast.',
          'A monthly allocation of leads comes with your partnership. Costs you nothing, nothing to sign up for, nothing to cancel.',
        ),
        features: [
          feature(t(locale, 'Vijf rapportcijfers per site', 'Five grades per site')),
          feature(t(locale, 'Bevindingen, screenshot & contactgegevens', 'Findings, screenshot & contact details')),
          feature(t(locale, '30 dagen exclusief voor jou', 'Exclusive to you for 30 days')),
        ],
      },
      {
        icon: 'IconTargetArrow',
        title: t(locale, 'Meer op aanvraag', 'More on request'),
        description: t(
          locale,
          'Wil je een specifieke regio of branche uitkammen, of een campagne draaien? Dan maken we ze op aanvraag aan: per stuk, per tien of per honderd.',
          'Want to comb through a specific region or branch, or run a campaign? We generate them on request: one, ten or a hundred at a time.',
        ),
        features: [
          feature(t(locale, 'Filteren op branche en regio', 'Filter by branch and region')),
          feature(t(locale, 'Geen abonnement, geen verplichting', 'No subscription, no commitment')),
          feature(t(locale, 'Prijs op aanvraag', 'Price on request')),
        ],
      },
      {
        icon: 'IconRocket',
        title: t(locale, 'Wordt het een klant?', 'Does one become a client?'),
        description: t(
          locale,
          'Dan telt die klant mee in je portfolio, en tilt dus je tarief op de ladder mee omhoog. Een lead die niets blijkt te zijn vervangen we.',
          'Then that client counts toward your portfolio, and lifts your rate on the ladder with it. A lead that turns out to be nothing gets replaced.',
        ),
        features: [
          feature(t(locale, 'Telt mee voor je omzetniveau', 'Counts toward your revenue level')),
          feature(t(locale, 'Waardeloze leads worden vervangen', 'Worthless leads are replaced')),
          feature(t(locale, 'Jij bepaalt wie je belt', 'You decide who you call')),
        ],
      },
    ],
  },
  {
    blockType: 'accordion',
    anchor: 'faq',
    header: {
      eyebrow: t(locale, 'Veelgestelde vragen', 'FAQ'),
      title: t(locale, 'Eerlijk antwoord', 'Straight answers'),
    },
    items: [
      {
        title: t(locale, 'Zijn jullie dan niet mijn concurrent?', 'Aren’t you my competitor?'),
        body: richBody(
          t(
            locale,
            'Nee. Wij verkopen geen ontwerp. Komt er een klant bij ons die een ontwerper zoekt, dan verwijzen we door naar een partner. We hebben jullie nodig: een hostingbedrijf zonder iets om te hosten is niets.',
            'No: we don’t sell design. If a client comes to us needing a designer, we refer them to a partner. We need you to exist: a hosting company with nothing to host is nothing.',
          ),
        ),
      },
      {
        title: t(locale, 'Ik bouw zelf websites. Is dit dan iets voor mij?', 'I build websites myself. Is this for me?'),
        body: richBody(
          t(
            locale,
            'Eerlijk gezegd minder. Dit werkt als bouwen niet is wat je wilt doen: als het het deel is dat je week opeet en niet betaalt zoals ontwerpen betaalt. Bouw je graag, blijf dan bouwen.',
            'Honestly, less so. This works when building isn’t what you want to be doing: when it’s the part that eats your week and doesn’t pay like design does. If you like building, keep building.',
          ),
        ),
      },
      {
        title: t(locale, 'Wat als jullie omvallen?', 'What if you disappear?'),
        body: richBody(
          t(
            locale,
            'De klant is eigenaar van de site en de data. Dat staat in de overeenkomst, het is geen belofte. De engine is een geversioneerd pakket en de site is een normale Next.js-applicatie; die is over te dragen. En je zit nergens aan vast tenzij je zelf voor exclusiviteit kiest.',
            'The client owns the site and the data. That is in the agreement, not a promise. The engine is a versioned package and the site is a normal Next.js application; it can be handed over. And you are not tied to anything unless you choose exclusivity yourself.',
          ),
        ),
      },
      {
        title: t(locale, 'Mag ik het als mijn eigen dienst verkopen?', 'Can I sell it as my own service?'),
        body: richBody(
          t(
            locale,
            'Ja. Factureer je zelf, dan koop je bij ons in en bepaal je je eigen prijs en abonnementsvorm, en je mag ons noemen zoals je elke infrastructuurpartij zou noemen. Wat niet meebeweegt is de overeenkomst: die blijft tussen Rinsly en de eindklant.',
            'Yes. If you invoice, you buy from us and set your own price and tiers, and you may name us the way you would credit any infrastructure provider. What does not move is the agreement. That stays between Rinsly and the end client.',
          ),
        ),
      },
      {
        title: t(locale, 'Wat kost het mij?', 'What does it cost me?'),
        body: richBody(
          t(
            locale,
            'Niets. Je hebt een eigen Figma-licentie met Dev Mode nodig: die heb je, en dat is de enige eis.',
            'Nothing. You need your own Figma licence with Dev Mode, which you have, and that is the only requirement.',
          ),
        ),
      },
    ],
  },
  cta(
    locale,
    ids,
    t(locale, 'Aan de slag', 'Get started'),
    t(locale, 'Zullen we het gewoon bespreken?', 'Shall we just talk it through?'),
    t(
      locale,
      'Vertel wat je maakt en hoe je het nu oplevert. Past het niet, dan zeggen we dat.',
      'Tell us what you make and how you deliver it today. If it doesn’t fit, we’ll say so.',
    ),
  ),
]

/* -------------------------------- /platform ------------------------------- */

const platformLayout = (locale: Locale, ids: PageIds): Block[] => [
  pageHero(
    'default',
    t(locale, 'Het platform', 'The platform'),
    t(locale, 'Eén engine, één fleet, één maandbedrag', 'One engine, one fleet, one monthly fee'),
    t(
      locale,
      'Elke site die wij bouwen is een applicatie op dezelfde geversioneerde engine. Dat is geen technische voorkeur maar de reden dat we veel sites tegelijk kunnen onderhouden zonder dat het onderhoud ontspoort.',
      'Every site we build is an application on the same versioned engine. That is not a technical preference but the reason we can maintain many sites at once without maintenance running away from us.',
    ),
  ),
  {
    blockType: 'services',
    anchor: 'stack',
    header: {
      eyebrow: t(locale, 'De stack', 'The stack'),
      title: t(locale, 'Waar het op draait', 'What it runs on'),
    },
    cards: [
      {
        icon: 'IconBrandFigma',
        title: t(locale, 'Van Figma naar productie', 'From Figma to production'),
        description: t(
          locale,
          'Wij bouwen uit Dev Mode. Type-scale, spacing, responsive gedrag en motion zitten in de engine, dus het ontwerp overleeft de bouw.',
          'We build from Dev Mode. Type scale, spacing, responsive behaviour and motion live in the engine, so the design survives the build.',
        ),
        features: [
          feature('Payload CMS, Next.js & React'),
          feature(t(locale, 'Meertalig en toegankelijk', 'Multilingual and accessible')),
          feature(t(locale, 'Getypeerd, met tests', 'Typed, with tests')),
        ],
      },
      {
        icon: 'IconPackages',
        title: t(locale, 'Eén geversioneerde engine', 'One versioned engine'),
        description: t(
          locale,
          'Elke site is een dunne app op @rinsly-com/site-core en bevat alleen wat die site eigen maakt. Een lek fixen we één keer.',
          'Every site is a thin app on @rinsly-com/site-core and holds only what makes that site its own. A vulnerability is fixed once.',
        ),
        features: [
          feature(t(locale, 'Fix in één release, uitrol over de fleet', 'Fixed in one release, rolled out fleet-wide')),
          feature(t(locale, 'Geen plugin-sprawl, geen WordPress', 'No plugin sprawl, no WordPress')),
          feature(t(locale, 'Elke site houdt zijn eigen ontwerp', 'Every site keeps its own design')),
        ],
      },
      {
        icon: 'IconServer2',
        title: t(locale, 'Eén platform, aan de edge', 'One platform, at the edge'),
        description: t(
          locale,
          'Eén omgeving per site, met de database en de media op hetzelfde platform. Geen server die van u is en waar u wakker van ligt.',
          'One environment per site, with the database and the media on the same platform. No server of your own to lie awake about.',
        ),
        features: [
          feature(t(locale, 'SSL, aan de edge', 'SSL, at the edge')),
          feature(t(locale, 'Doorlopend databaseherstel', 'Continuous database recovery')),
          feature(t(locale, 'Vaste opslag- en verkeerslimieten', 'Stated storage and traffic limits')),
        ],
      },
    ],
  },
  diagram(
    'oneEngineFleet',
    t(locale, 'De fleet', 'The fleet'),
    t(locale, 'Eén release raakt elke site', 'One release reaches every site'),
    t(
      locale,
      'Elke klantsite is een dunne applicatie op dezelfde geversioneerde engine. Een beveiligingsfix maken we één keer en rollen we uit over de hele fleet, zonder dat een site zijn eigen ontwerp verliest.',
      'Every client site is a thin application on the same versioned engine. A security fix is made once and rolled out across the whole fleet, without a site losing its own design.',
    ),
  ),
  {
    blockType: 'accordion',
    anchor: 'techniek',
    header: {
      eyebrow: t(locale, 'Goed om te weten', 'Good to know'),
      title: t(locale, 'De techniek, zonder omhaal', 'The technical part, plainly'),
    },
    items: [
      {
        title: t(locale, 'Waarom geen WordPress?', 'Why not WordPress?'),
        body: richBody(
          t(
            locale,
            'Omdat elke site bij ons op dezelfde geversioneerde engine draait. Een lek fixen we één keer en rollen we uit over de hele fleet. Tien losse WordPress-installaties met elk hun eigen plugins kun je zo niet onderhouden. Daarom is onderhoud daarop óf duur, óf gebeurt het niet.',
            'Because every site here runs on the same versioned engine. A vulnerability is fixed once and rolled out across the whole fleet. Ten separate WordPress installs, each with its own plugins, cannot be maintained that way, which is why maintenance on them is either expensive or simply not happening.',
          ),
        ),
      },
      {
        title: t(locale, 'Hoe zit het met back-ups en storingen?', 'What about backups and outages?'),
        body: richBody(
          t(
            locale,
            'Voor de database geldt dit voor elk pakket, zonder onderscheid: een ingebouwde Time Travel-functie geeft doorlopend puntherstel naar elk moment binnen de laatste dertig dagen. Voor mediabestanden (afbeeldingen, uploads) bestaat op dit moment geen automatische back-up; dat is een bewuste vermelding, geen kleine letters. We draaien op een wereldwijd edge-netwerk en spannen ons in voor goede beschikbaarheid, maar voeren zelf geen actieve uptime-monitoring uit; een gegarandeerde ononderbroken beschikbaarheid bestaat sowieso niet, en wie dat belooft moet u niet vertrouwen. Wilt u wél harde reactietijden op papier, dan is dat een SLA bij Op maat.',
            'For the database this is the same for every plan, no distinction: a built-in Time Travel feature gives continuous point-in-time recovery to any moment within the last thirty days. For media files (images, uploads) there is currently no automated backup; that is a deliberate disclosure, not fine print. We run on a global edge network and work hard for good availability, but do not run our own active uptime monitoring; a guaranteed uninterrupted availability does not exist regardless, and anyone promising it should not be trusted. If you do want hard response times on paper, that is an SLA on the Custom plan.',
          ),
        ),
      },
      {
        title: t(locale, 'Van wie is de website?', 'Who owns the website?'),
        body: richBody(
          t(
            locale,
            'Van de eindklant: het bedrijf waarvan de website is. De website en alle data zijn en blijven hun eigendom, en dat staat in de overeenkomst tussen Rinsly en die klant.',
            'The end client’s: the business whose website it is. The website and all its data are and remain their property, and that is in the agreement between Rinsly and that client.',
          ),
          t(
            locale,
            'Heeft een ontwerpstudio de site ontworpen of gefactureerd, dan verandert dat niets: de studio wordt daarmee geen eigenaar van de site of van de data van haar klant. Bij beëindiging helpen we de klant met de overdracht van site, data en domein.',
            'If a design studio designed or invoiced the site, that changes nothing: it does not make the studio the owner of the site or of their client’s data. On termination we help the client transfer the site, data and domain.',
          ),
        ),
      },
      {
        title: t(locale, 'Werken jullie ook met een andere techniek?', 'Do you work with other technology?'),
        body: richBody(
          t(
            locale,
            'Niet echt, en dat is een bewuste keuze. De reden dat we veel sites tegelijk kunnen draaien is precies dat ze op één engine staan. Een site op een eigen stack zou dat voordeel weggeven, en dan zijn we een gewone bouwer die per uur factureert.',
            'Not really, and that is deliberate. The reason we can run many sites at once is precisely that they share one engine. A site on its own stack would give that away, and then we would be an ordinary builder invoicing by the hour.',
          ),
        ),
      },
    ],
  },
  cta(
    locale,
    ids,
    t(locale, 'Verder lezen', 'Read on'),
    t(locale, 'Wat kost het, en wat levert het op?', 'What does it cost, and what does it earn?'),
    t(
      locale,
      'De pakketten met hun grenzen staan op de prijzenpagina; wat een ontwerpstudio eraan overhoudt, staat bij het partnerprogramma.',
      'The plans and their limits are on the pricing page; what a design studio earns from it is on the partner programme page.',
    ),
  ),
]

/* -------------------------------- /prijzen -------------------------------- */

const prijzenLayout = (locale: Locale, ids: PageIds): Block[] => [
  pageHero(
    'centered',
    t(locale, 'Prijzen', 'Pricing'),
    t(locale, 'Hosting en beheer, met limieten die vaststaan', 'Hosting and management, with limits that are stated'),
    t(
      locale,
      'Het pakket volgt niet het aantal pagina’s, maar hoeveel de site opslaat en hoeveel verkeer die trekt: pagina’s kosten niets, een mediabibliotheek en een database wel. Bij elk pakket ziet u precies waar de grens ligt voordat een upgrade nodig is.',
      'The plan does not follow the number of pages but how much the site stores and how much traffic it takes: pages cost nothing, a media library and a database do. Every plan states exactly where the limit sits before an upgrade is needed.',
    ),
  ),
  {
    blockType: 'pricing',
    anchor: 'pakketten',
    header: {
      eyebrow: t(locale, 'Wat de klant betaalt', 'What the client pays'),
      title: t(locale, 'Vier pakketten', 'Four plans'),
      intro: t(
        locale,
        'Dit is het abonnement dat de eindklant bij Rinsly afsluit: ook als een partner de site heeft ontworpen. De klant is altijd eigenaar van site en data. Facturatie gaat vooraf, per maand of per jaar; bij jaarbetaling krijgt u een maand korting, bij Growth twee. Alle prijzen exclusief 21% btw. Dit is de prijs die u bij Rinsly betaalt; factureert een ontwerpstudio u zelf, dan geldt haar prijs.',
        'This is the subscription the end client takes with Rinsly: including when a partner designed the site. The client always owns the site and the data. We invoice in advance, monthly or yearly; paying yearly gets you a month free, two on Growth. All prices exclude 21% VAT. This is what you pay Rinsly; if a design studio invoices you themselves, their price applies.',
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
          feature(t(locale, 'Tot 5 GB media', 'Up to 5 GB media')),
          feature(t(locale, 'Tot 250 MB database', 'Up to 250 MB database')),
          feature(t(locale, 'Tot 1 miljoen requests per maand', 'Up to 1 million requests a month')),
          feature(t(locale, 'Edge-hosting & SSL', 'Edge hosting & SSL')),
          feature(t(locale, 'Beveiligings- & CMS-updates', 'Security & CMS updates')),
          feature(t(locale, 'Doorlopend databaseherstel', 'Continuous database recovery')),
          feature(t(locale, 'E-mailsupport, reactie binnen 1 week', 'Email support, reply within a week')),
          feature(t(locale, 'Staging-omgeving', 'Staging environment')),
          feature(t(locale, 'Wijzigingen inbegrepen', 'Changes included'), false),
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
          feature(t(locale, 'Tot 25 GB media', 'Up to 25 GB media')),
          feature(t(locale, 'Tot 1 GB database', 'Up to 1 GB database')),
          feature(t(locale, 'Tot 5 miljoen requests per maand', 'Up to 5 million requests a month')),
          feature(t(locale, 'Alles uit Care', 'Everything in Care')),
          feature(t(locale, 'Tot 1 uur/mnd wijzigingen', 'Up to 1 hr/mo changes')),
          feature(t(locale, 'Eén vast aanspreekpunt', 'One dedicated point of contact')),
        ],
      },
      {
        name: 'Growth',
        for: t(locale, 'Voor sites die moeten groeien', 'For sites that need to grow'),
        price: '€249',
        per: t(locale, '/ mnd', '/ mo'),
        priceNote: t(locale, 'of €2.490 per jaar (2 maanden gratis)', 'or €2,490 per year (2 months free)'),
        recommended: false,
        features: [
          feature(t(locale, 'Tot 100 GB media', 'Up to 100 GB media')),
          feature(t(locale, 'Tot 5 GB database', 'Up to 5 GB database')),
          feature(t(locale, 'Tot 25 miljoen requests per maand', 'Up to 25 million requests a month')),
          feature(t(locale, 'Alles uit Managed', 'Everything in Managed')),
          feature(t(locale, 'Tot 4 uur/mnd doorontwikkeling', 'Up to 4 hrs/mo development')),
          feature(t(locale, 'SEO- & performance-optimalisatie', 'SEO & performance optimisation')),
          feature(t(locale, 'Kwartaalreview & roadmap', 'Quarterly review & roadmap')),
        ],
      },
      {
        name: t(locale, 'Op maat', 'Custom'),
        for: t(locale, 'Grotere organisaties', 'Larger organisations'),
        price: t(locale, 'vanaf €499', 'from €499'),
        per: t(locale, '/ mnd', '/ mo'),
        priceNote: t(locale, 'opslag en verkeer naar volume', 'storage and traffic to volume'),
        recommended: false,
        features: [
          feature(t(locale, 'Opslag, database en verkeer op maat', 'Storage, database and traffic to measure')),
          feature(t(locale, 'Alles uit Growth', 'Everything in Growth')),
          feature(t(locale, 'SLA met gegarandeerde reactietijden', 'SLA with guaranteed response times')),
          feature(t(locale, 'Verwerkersovereenkomst (AVG)', 'Data-processing agreement (GDPR)')),
        ],
      },
    ],
  },
  {
    blockType: 'note',
    text: t(
      locale,
      'Over een limiet? Dan melden we dat en kiest u: bijbetalen per eenheid (€1 per extra GB media, €5 per extra GB database, €2 per extra miljoen requests per maand) of een pakket omhoog. We knijpen uw site nooit stilletjes af.',
      'Over a limit? We tell you, and you choose: pay per unit (€1 per extra GB of media, €5 per extra GB of database, €2 per extra million requests a month) or move up a plan. We never throttle your site quietly.',
    ),
  },
  {
    blockType: 'accordion',
    anchor: 'faq',
    header: {
      eyebrow: t(locale, 'Veelgestelde vragen', 'FAQ'),
      title: t(locale, 'Over prijs en looptijd', 'On price and term'),
    },
    items: [
      {
        title: t(locale, 'Wat kost het bouwen van de website?', 'What does building the website cost?'),
        body: richBody(
          t(
            locale,
            'Een maatwerksite start vanaf €2.500 (excl. btw); de exacte prijs hangt af van de omvang en complexiteit. Op basis van uw wensen maken we vooraf een heldere offerte.',
            'A custom site starts from €2,500 (excl. VAT); the exact price depends on the size and complexity. Based on your needs we prepare a clear quote up front.',
          ),
          t(
            locale,
            'Legt u zich voor drie jaar vast op het hostingabonnement, dan bouwen wij de website gratis, afhankelijk van de omvang. Betaalt u de bouw zelf, dan blijft het abonnement maandelijks opzegbaar. Beide routes bestaan echt; de drie jaar is wat de gratis bouw betaalt.',
            'If you commit to three years of the hosting subscription, we build the website for free, depending on its scale. If you pay for the build yourself, the subscription stays cancellable monthly. Both routes are real; the three years is what pays for the free build.',
          ),
        ),
      },
      {
        title: t(locale, 'Zit ik ergens aan vast?', 'Am I locked in?'),
        body: richBody(
          t(
            locale,
            'Dat hangt af van welke route u kiest. Betaalt u de bouw, dan is de overeenkomst doorlopend en maandelijks opzegbaar met een opzegtermijn van één maand. Kiest u de gratis bouw, dan geldt een minimumlooptijd van 36 maanden op het abonnement; daarna is het net zo goed maandelijks opzegbaar.',
            'That depends on the route you choose. If you pay for the build, the agreement is ongoing and cancellable monthly with one month’s notice. If you choose the free build, a minimum term of 36 months applies to the subscription; after that it is just as monthly-cancellable.',
          ),
        ),
      },
      {
        title: t(locale, 'Van wie krijgen we de factuur?', 'Who sends us the invoice?'),
        body: richBody(
          t(
            locale,
            'Van Rinsly, of van de ontwerpstudio die uw site maakte. Dat kiest de studio. Factureert de studio zelf, dan spreekt u de prijs met haar af. Uw overeenkomst over de website loopt in beide gevallen via Rinsly, en dat is precies wat u beschermt: stopt de studio ermee, dan gaat uw site zonder onderbreking bij ons verder.',
            'From Rinsly, or from the design studio that made your site: the studio chooses. Where the studio invoices you, you agree the price with them. Your agreement about the website runs through Rinsly either way, which is what protects you: if the studio stops, your site carries on with us without interruption.',
          ),
        ),
      },
    ],
  },
  cta(
    locale,
    ids,
    t(locale, 'Aan de slag', 'Get started'),
    t(locale, 'Een offerte binnen een dag', 'A quote within a day'),
    t(
      locale,
      'Vertel wat u nodig hebt: u krijgt een heldere offerte, geen verrassingen achteraf.',
      'Tell us what you need: you’ll get a clear quote, with no surprises later.',
    ),
  ),
]

/* -------------------------------- /website -------------------------------- */
/* The end customer who found us directly. Secondary audience, first-class    */
/* treatment: same engine, same prices, same terms.                          */

const websiteLayout = (locale: Locale, ids: PageIds): Block[] => [
  pageHero(
    'offset',
    t(locale, 'Direct bij Rinsly', 'Directly from Rinsly'),
    t(locale, 'Een website bij ons, zonder tussenpersoon? Dat kan gewoon.', 'A website from us, without a middleman? That works fine.'),
    t(
      locale,
      'Rinsly werkt vooral samen met ontwerpstudio’s, maar u kunt net zo goed zelf aankloppen. U krijgt dezelfde engine, dezelfde limieten en dezelfde prijzen: er verandert niets aan de dienst omdat u er direct om vraagt.',
      'Rinsly mostly works with design studios, but you are just as welcome to come to us directly. You get the same engine, the same limits and the same prices: nothing about the service changes because you asked for it yourself.',
    ),
    [pageLink(t(locale, 'Vraag een offerte aan', 'Request a quote'), ids, SLUG.contact, { variant: 'primary' })],
  ),
  {
    blockType: 'services',
    anchor: 'wat',
    header: {
      eyebrow: t(locale, 'Wat u krijgt', 'What you get'),
      title: t(locale, 'Een site die blijft werken', 'A site that keeps working'),
    },
    cards: [
      {
        icon: 'IconCode',
        title: t(locale, 'Gebouwd, niet in elkaar geklikt', 'Built, not clicked together'),
        description: t(
          locale,
          'Uw site wordt een echte applicatie op ons platform: geen thema met twintig plug-ins die elkaar in de weg zitten.',
          'Your site becomes a real application on our platform: not a theme with twenty plugins tripping over each other.',
        ),
        features: [
          feature(t(locale, 'Volwaardig CMS, zelf te beheren', 'A real CMS you manage yourself')),
          feature(t(locale, 'Snel, ook op een telefoon', 'Fast, on a phone too')),
        ],
      },
      {
        icon: 'IconServer2',
        title: t(locale, 'Hosting en onderhoud inbegrepen', 'Hosting and maintenance included'),
        description: t(
          locale,
          'Eén maandbedrag voor hosting, SSL, databaseherstel en updates. Geen losse rekeningen voor een plugin-update.',
          'One monthly fee for hosting, SSL, database recovery and updates. No separate bills for a plugin update.',
        ),
        features: [
          feature(t(locale, 'Vaste limieten, vooraf bekend', 'Stated limits, known up front')),
          feature(t(locale, 'Data desgewenst in de EU', 'Data in the EU on request')),
        ],
      },
      {
        icon: 'IconUsers',
        title: t(locale, 'Nog geen ontwerper?', 'No designer yet?'),
        description: t(
          locale,
          'Wij ontwerpen zelf niet. Heeft u geen ontwerper, dan brengen we u in contact met een van onze partners: daar kiest u zelf uit.',
          'We don’t design ourselves. If you have no designer, we’ll introduce you to one of our partners, and you choose.',
        ),
        features: [
          feature(t(locale, 'Vrijblijvend doorverwezen', 'Introduced with no obligation')),
          feature(t(locale, 'Of lever uw eigen ontwerp aan', 'Or supply your own design')),
        ],
      },
    ],
  },
  {
    blockType: 'richText',
    anchor: 'hoe',
    width: 'wide',
    header: {
      eyebrow: t(locale, 'Hoe het gaat', 'How it goes'),
      title: t(locale, 'Van eerste gesprek tot live', 'From first conversation to live'),
    },
    content: proseRich(
      locale === 'nl'
        ? [
            { ol: [
              'U vertelt wat u nodig heeft. Wij zeggen wat het kost: vanaf €2.500 voor de bouw, of gratis als u zich voor drie jaar vastlegt op de hosting.',
              'Er komt een ontwerp: van uw eigen ontwerper, van een partner van ons, of op basis van wat u aanlevert.',
              'Wij bouwen het en zetten het live, inclusief domein en e-mailrouting.',
              'Daarna draaien wij het. U beheert de teksten en foto’s zelf in het CMS; het technische deel hoeft u nooit aan te raken.',
            ] },
            { p: 'Wilt u dat uw database en bestanden binnen de EU staan, geef dat dan **voordat we beginnen** aan. Dat wordt bij de bouw vastgelegd en is daarna niet meer om te zetten. Wat die keuze precies wel en niet betekent, staat op de platformpagina.' },
          ]
        : [
            { ol: [
              'You tell us what you need. We tell you what it costs: from €2,500 for the build, or free if you commit to three years of hosting.',
              'A design appears: from your own designer, from one of our partners, or based on what you supply.',
              'We build it and take it live, domain and email routing included.',
              'After that we run it. You manage the words and pictures yourself in the CMS; you never have to touch the technical part.',
            ] },
            { p: 'If you want your database and files stored within the EU, say so **before we start**: it is fixed during the build and cannot be switched afterwards. Exactly what that choice does and does not mean is on the platform page.' },
          ],
    ),
  },
  {
    blockType: 'buttonRow',
    alignment: 'left',
    buttons: [
      pageLink(t(locale, 'Bekijk de prijzen', 'See the pricing'), ids, SLUG.prijzen, { variant: 'primary' }),
      pageLink(t(locale, 'Gratis websitecheck', 'Free website check'), ids, SLUG.contact, { variant: 'secondary' }),
    ],
  },
  cta(
    locale,
    ids,
    t(locale, 'Aan de slag', 'Get started'),
    t(locale, 'Klaar om online te gaan?', 'Ready to go live?'),
    t(
      locale,
      'Vertel ons over uw project: u krijgt snel een helder antwoord.',
      'Tell us about your project: you’ll get a clear answer quickly.',
    ),
  ),
]

/* --------------------------------- /over ---------------------------------- */

const overLayout = (locale: Locale, ids: PageIds): Block[] => [
  pageHero(
    'quiet',
    t(locale, 'Over Rinsly', 'About Rinsly'),
    t(locale, 'Een technisch bedrijf, geen websitebouwer', 'A technical company, not a website maker'),
    t(
      locale,
      'Rinsly is de bouw- en beheerafdeling die ontwerpstudio’s niet hebben. Wij verkopen geen ontwerp. Dat doen onze partners. Wij nemen hun Figma-bestand en maken er een applicatie van die we daarna blijven draaien.',
      'Rinsly is the build-and-run department design studios don’t have. We don’t sell design: our partners do that. We take their Figma file and turn it into an application that we then keep running.',
    ),
  ),
  {
    blockType: 'richText',
    width: 'narrow',
    header: {
      eyebrow: t(locale, 'Hoe we werken', 'How we work'),
      title: t(locale, 'Korte lijnen, harde cijfers', 'Short lines, hard numbers'),
    },
    content: richBody(
      t(
        locale,
        'Rinsly is één persoon met echte infrastructuur. Dat is eerlijker dan een bedrijfsstem die doet alsof er twaalf mensen achter zitten, en het betekent korte lijnen: u spreekt degene die het bouwt en beheert.',
        'Rinsly is one person with real infrastructure. That is more honest than a company voice pretending twelve people are behind it, and it means short lines: you speak to the person who builds and runs it.',
      ),
      t(
        locale,
        'We zeggen ook wat we niet doen: geen ontwerp, geen WordPress, geen mailboxen. En we schrijven grenzen op in gigabytes en requests in plaats van in bijvoeglijke naamwoorden: u weet dus vooraf waar u aan toe bent.',
        'We are equally clear about what we don’t do: no design, no WordPress, no mailboxes. And we write limits down in gigabytes and requests rather than in adjectives, so you know up front where you stand.',
      ),
      t(
        locale,
        'We meten websites ook echt: crawlen, scoren en Lighthouse op grote schaal. Vandaar de gratis websitecheck op deze site: vijf rapportcijfers in een halve minuut.',
        'We genuinely measure websites: crawling, scoring and Lighthouse at scale. Hence the free website check on this site: five grades in half a minute.',
      ),
    ),
  },
  {
    blockType: 'contact',
    anchor: 'gegevens',
    header: {
      eyebrow: t(locale, 'Gegevens', 'Details'),
      title: t(locale, 'Rinsly', 'Rinsly'),
      intro: t(
        locale,
        'Rinsly: Rinse Yaron Schaeffer, webontwikkeling & hosting. Gevestigd in Woerden.',
        'Rinsly: Rinse Yaron Schaeffer, web development & hosting. Based in Woerden, the Netherlands.',
      ),
    },
    showForm: false,
    items: [
      { kind: 'email', label: 'E-mail', value: 'contact@rinsly.com' },
      { kind: 'address', label: t(locale, 'Adres', 'Address'), value: 'Kazernestraat 6, 3441 BB Woerden' },
      { kind: 'text', label: 'KvK', value: '85578835' },
      { kind: 'text', label: t(locale, 'BTW', 'VAT'), value: 'NL004117041B25' },
    ],
    buttons: [pageLink(t(locale, 'Neem contact op', 'Get in touch'), ids, SLUG.contact, { variant: 'primary' })],
  },
]

/* -------------------------------- /contact -------------------------------- */

const contactLayout = (locale: Locale): Block[] => [
  pageHero(
    'quiet',
    'Contact',
    t(locale, 'Waar kunnen we mee helpen?', 'What can we help with?'),
    t(
      locale,
      'Ontwerpstudio en nieuwsgierig naar het partnerprogramma, of ondernemer met een site in gedachten? Kies hieronder wie u bent, dan stellen we de juiste vragen en geen enkele overbodige.',
      'A design studio curious about the partner programme, or a business with a site in mind? Choose below who you are, then we ask the right questions and none of the pointless ones.',
    ),
  ),
  {
    blockType: 'contact',
    anchor: 'formulier',
    header: {
      eyebrow: t(locale, 'Stuur een bericht', 'Send a message'),
      title: t(locale, 'Vertel wat u nodig heeft', 'Tell us what you need'),
    },
    showForm: true,
    items: [
      { kind: 'email', label: 'E-mail', value: 'contact@rinsly.com' },
      { kind: 'phone', label: t(locale, 'Telefoon', 'Phone'), value: '+31 6 24118912' },
    ],
    buttons: [
      { label: t(locale, 'Mail ons direct', 'Email us directly'), variant: 'secondary', type: 'external', url: 'mailto:contact@rinsly.com' },
    ],
  },
]

/* ------------------------------ header / footer ---------------------------- */

const headerData = (locale: Locale, ids: PageIds) => ({
  navItems: [
    pageLink(t(locale, 'Platform', 'Platform'), ids, SLUG.platform),
    pageLink(t(locale, 'Partnerprogramma', 'Partner programme'), ids, SLUG.partner),
    pageLink(t(locale, 'Prijzen', 'Pricing'), ids, SLUG.prijzen),
    pageLink(t(locale, 'Over ons', 'About'), ids, SLUG.over),
  ],
  cta: pageLink('Contact', ids, SLUG.contact),
})

const footerLocalized = (locale: Locale) => ({
  tagline: t(
    locale,
    'Bouw & hosting voor ontwerpstudio’s. Uit Woerden.',
    'Build & hosting for design studios. From Woerden.',
  ),
  menuItems: [
    { label: t(locale, 'Platform', 'Platform'), url: `/${locale}/${SLUG.platform}` },
    { label: t(locale, 'Partnerprogramma', 'Partner programme'), url: `/${locale}/${SLUG.partner}` },
    { label: t(locale, 'Prijzen', 'Pricing'), url: `/${locale}/${SLUG.prijzen}` },
    { label: t(locale, 'Website bij Rinsly', 'A website from Rinsly'), url: `/${locale}/${SLUG.website}` },
    { label: t(locale, 'Over ons', 'About'), url: `/${locale}/${SLUG.over}` },
    { label: 'Contact', url: `/${locale}/${SLUG.contact}` },
  ],
  infoLinks: [
    { label: t(locale, 'Privacyverklaring', 'Privacy policy'), url: `/${locale}/privacy` },
    { label: t(locale, 'Algemene voorwaarden', 'Terms & conditions'), url: `/${locale}/voorwaarden` },
  ],
  copyright: t(
    locale,
    '© Rinsly 2026: Alle rechten voorbehouden.',
    '© Rinsly 2026: All rights reserved.',
  ),
})

const footerShared = {
  email: 'contact@rinsly.com',
  kvk: '85578835',
  btw: 'NL004117041B25',
}

/* -------------------------------------------------------------------------- */
/* Prose documents                                                            */
/*                                                                            */
/* A compact node list (headings / paragraphs / lists, with **bold** inline)  */
/* compiled to Lexical. Used for the legal pages at /[locale]/privacy and     */
/* /[locale]/voorwaarden, and by the home page wherever a section needs a      */
/* bulleted list that `richBody` (paragraphs only) cannot express.            */
/*                                                                            */
/* The legal texts are solid market-standard drafts and are kept consistent   */
/* with the offerte contract + verwerkersovereenkomst — have a Dutch lawyer   */
/* confirm the binding wording before relying on them.                        */
/* -------------------------------------------------------------------------- */

type ProseNode = { h: string } | { p: string } | { ul: string[] } | { ol: string[] }

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

const proseRich = (nodes: ProseNode[]) => ({
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
const legalLayout = (eyebrow: string, title: string, nodes: ProseNode[]): Block[] => [
  { blockType: 'richText', width: 'narrow', header: { eyebrow, title }, content: proseRich(nodes) },
]

const privacyNodes: Record<Locale, ProseNode[]> = {
  nl: [
    { p: 'Laatst bijgewerkt: 15 augustus 2026.' },
    { p: 'Rinsly hecht veel waarde aan de bescherming van uw persoonsgegevens. In deze privacyverklaring leggen we uit welke gegevens we verwerken wanneer u onze website bezoekt of contact met ons opneemt, en ook wanneer wij de website van uw bedrijf hebben gemeten zonder dat u zich bij ons had gemeld (zie artikel 7), met welk doel en op welke grondslag, en welke rechten u heeft.' },
    { h: '1. Verwerkingsverantwoordelijke' },
    { p: 'Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden. KvK 85578835. E-mail: contact@rinsly.com. Rinsly is de verwerkingsverantwoordelijke voor de verwerking van persoonsgegevens via deze website.' },
    { h: '2. Welke gegevens we verwerken' },
    { ul: [
      '**Contactgegevens** die u zelf verstrekt via het contactformulier of per e-mail: uw naam, e-mailadres en de inhoud van uw bericht.',
      '**Technische gegevens** die automatisch worden vastgelegd wanneer u de site bezoekt: uw IP-adres, browsertype en technische log- en gebruiksgegevens.',
      '**Websitecheck-gegevens** wanneer u onze gratis websitecheck gebruikt: het door u opgegeven websiteadres, het gegenereerde rapport en een versleutelde (gehashte) afgeleide van uw IP-adres. Die afgeleide gebruiken we uitsluitend om misbruik te voorkomen (maximaal aantal checks per dag) en verwijderen we binnen 24 uur; het rapport bewaren we 90 dagen. Uw volledige IP-adres slaan we niet op.',
    ] },
    { h: '3. Doeleinden en grondslagen' },
    { p: 'We verwerken uw gegevens uitsluitend voor de volgende doeleinden:' },
    { ul: [
      'Het beantwoorden van uw vraag of het opstellen van een offerte. Grondslag: de uitvoering van of stappen voorafgaand aan een overeenkomst (art. 6 lid 1 sub b AVG).',
      'Het beveiligen, onderhouden en verbeteren van de website, waaronder het beperken van misbruik van de gratis websitecheck. Grondslag: ons gerechtvaardigd belang bij een veilige en goed werkende website (art. 6 lid 1 sub f AVG).',
      'Het voldoen aan wettelijke verplichtingen, zoals de fiscale bewaarplicht. Grondslag: een wettelijke plicht (art. 6 lid 1 sub c AVG).',
    ] },
    { h: '4. Cookies' },
    { p: 'Deze website plaatst uitsluitend functionele en strikt noodzakelijke cookies die nodig zijn om de site goed te laten werken en te beveiligen. Hiervoor is geen toestemming vereist. Worden er in de toekomst analytische of tracking-cookies geplaatst, dan vragen we daarvoor vooraf uw toestemming.' },
    { h: '5. Bewaartermijnen' },
    { p: 'We bewaren uw gegevens niet langer dan nodig is voor de genoemde doeleinden. Contactgegevens bewaren we zolang dat nodig is om uw vraag af te handelen en gedurende een redelijke periode daarna; gegevens die onder een wettelijke bewaarplicht vallen, bewaren we gedurende de wettelijke termijn. Technische logbestanden bewaren we voor een beperkte periode.' },
    { h: '6. Verwerkers en derden' },
    { p: 'Voor de hosting en werking van de website maken we gebruik van Cloudflare, Inc., dat als verwerker in onze opdracht persoonsgegevens verwerkt. Voor de beoordelingen die we bij het meten van bedrijfswebsites opstellen (zie artikel 7) maken we daarnaast gebruik van Anthropic, PBC, dat als verwerker de gemeten gegevens en schermafbeeldingen verwerkt om die beoordeling te genereren. We verkopen de gegevens van websitebezoekers en contactpersonen niet en delen deze niet met derden, behalve wanneer dat noodzakelijk is voor de genoemde doeleinden of wanneer we daartoe wettelijk verplicht zijn. Voor bedrijfsgegevens die wij zelf verzamelen door websites te meten geldt een eigen regeling: die kunnen wij delen met onze partners, onder de voorwaarden in artikel 7.' },
    { h: '7. Bedrijven waarvan wij de website hebben gemeten' },
    { p: 'Rinsly meet websites op grote schaal om te zien hoe ver ze afstaan van de huidige stand van het web. Daarbij bezoeken we openbaar toegankelijke websites en leggen we vast: het websiteadres en de bedrijfsnaam, de meetresultaten (vijf rapportcijfers en de bevindingen daarachter), een schermafbeelding van de openbare pagina, en de contactgegevens die het bedrijf zelf openbaar op die website of in een openbaar register heeft gepubliceerd. Zijn die contactgegevens die van een persoon: bij een eenmanszaak of zzp\u2019er bijvoorbeeld, dan zijn het persoonsgegevens en geldt deze paragraaf.' },
    { p: '**We hebben deze gegevens niet van u gekregen, maar zelf uit openbare bronnen verzameld.** Daarom informeren wij u hier actief, en niet pas als u het vraagt.' },
    { ul: [
      '**Doel:** beoordelen of het bedrijf gebaat is bij een nieuwe of beter onderhouden website, en het bedrijf daarover benaderen, door ons of door een van onze partners.',
      '**Grondslag:** ons gerechtvaardigd belang bij zakelijke acquisitie en dat van onze partners (art. 6 lid 1 sub f AVG). We beperken ons tot zakelijke contactgegevens en zakelijke communicatie, en verwerken geen bijzondere categorie\u00ebn persoonsgegevens.',
      '**Geautomatiseerde beoordeling:** de meetresultaten en een schermafbeelding van de website worden verwerkt door Anthropic, PBC (de aanbieder van het Claude-model) om de beoordeling te genereren. Dit betreft geen geautomatiseerde besluitvorming met rechtsgevolgen voor u: de beoordeling bepaalt alleen of en hoe we, of onze partners, contact opnemen, niet of u een dienst krijgt of tegen welke voorwaarden.',
      '**Delen met partners:** wij kunnen zo\u2019n beoordeling (een \u201clead\u201d) beschikbaar stellen aan een ontwerpstudio waarmee wij samenwerken. Die partner mag de gegevens uitsluitend gebruiken om het bedrijf te benaderen over een website, mag ze niet doorverkopen of verder verspreiden, en is voor dat eigen gebruik zelf verwerkingsverantwoordelijke.',
      '**Bewaartermijn:** wij bewaren een beoordeling zolang die actueel genoeg is om bruikbaar te zijn en in elk geval niet langer dan twaalf maanden na de meting, tenzij het bedrijf klant wordt.',
    ] },
    { p: 'U kunt hier op elk moment bezwaar tegen maken, en dat kost u niets meer dan een e-mail aan contact@rinsly.com. Bij bezwaar verwijderen we het bedrijf uit onze gegevens, benaderen we het niet meer, stellen we het niet meer aan partners beschikbaar en geven we het bezwaar door aan partners die de beoordeling al hadden ontvangen. Dezelfde rechten uit artikel 9 (inzage, rectificatie, verwijdering) gelden onverkort.' },
    { h: '8. Doorgifte buiten de EER' },
    { p: "Cloudflare, Inc. en Anthropic, PBC zijn gevestigd in de Verenigde Staten. Voor zover daarbij persoonsgegevens buiten de Europese Economische Ruimte worden verwerkt, gebeurt dat onder passende waarborgen zoals het EU-US Data Privacy Framework of de modelcontractbepalingen (SCC's) van de Europese Commissie." },
    { h: '9. Uw rechten' },
    { p: 'U heeft het recht op inzage, rectificatie, verwijdering, beperking van de verwerking, bezwaar tegen de verwerking en gegevensoverdraagbaarheid. Stuur uw verzoek naar contact@rinsly.com; we reageren binnen de wettelijke termijn. Bent u het niet eens met hoe we met uw gegevens omgaan, dan kunt u een klacht indienen bij de Autoriteit Persoonsgegevens.' },
    { h: '10. Beveiliging' },
    { p: 'We nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen, waaronder versleutelde verbindingen (TLS), toegangsbeheer en doorlopend puntherstel van de database via Cloudflare Time Travel. Een back-up van mediabestanden is op dit moment niet geautomatiseerd.' },
    { h: '11. Wijzigingen' },
    { p: 'We kunnen deze privacyverklaring van tijd tot tijd aanpassen. De actuele versie staat altijd op deze pagina, met de datum van de laatste wijziging bovenaan.' },
  ],
  en: [
    { p: 'Last updated: 15 August 2026.' },
    { p: 'Rinsly takes the protection of your personal data seriously. This privacy policy explains which data we process when you visit our website or contact us, and also when we have measured your company’s website without you having contacted us (see section 7), for what purpose and on what legal basis, and what rights you have.' },
    { h: '1. Controller' },
    { p: 'Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden, the Netherlands. Chamber of Commerce (KvK) 85578835. Email: contact@rinsly.com. Rinsly is the controller for the processing of personal data through this website.' },
    { h: '2. Data we process' },
    { ul: [
      '**Contact details** you provide yourself through the contact form or by email: your name, email address and the content of your message.',
      '**Technical data** recorded automatically when you visit the site: your IP address, browser type and technical log and usage data.',
      '**Website-check data** when you use our free website check: the web address you submit, the generated report and an encrypted (hashed) derivative of your IP address. We use that derivative solely to prevent abuse (a daily maximum of checks) and delete it within 24 hours; the report is kept for 90 days. We do not store your full IP address.',
    ] },
    { h: '3. Purposes and legal bases' },
    { p: 'We process your data only for the following purposes:' },
    { ul: [
      'Answering your question or preparing a quote. Basis: performance of, or steps prior to, a contract (art. 6(1)(b) GDPR).',
      'Securing, maintaining and improving the website, including limiting abuse of the free website check. Basis: our legitimate interest in a secure, well-functioning website (art. 6(1)(f) GDPR).',
      'Complying with legal obligations, such as tax retention rules. Basis: a legal obligation (art. 6(1)(c) GDPR).',
    ] },
    { h: '4. Cookies' },
    { p: 'This website places only functional and strictly necessary cookies required for the site to work and to be secure. No consent is required for these. Should analytics or tracking cookies be introduced in the future, we will ask for your consent first.' },
    { h: '5. Retention' },
    { p: 'We do not keep your data longer than necessary for the purposes above. We keep contact details for as long as needed to handle your enquiry and for a reasonable period afterwards; data subject to a legal retention obligation is kept for the statutory term. Technical logs are kept for a limited period.' },
    { h: '6. Processors and third parties' },
    { p: 'For hosting and running the website we use Cloudflare, Inc., which processes personal data as our processor on our instructions. For the assessments we generate when measuring business websites (see section 7) we also use Anthropic, PBC, which processes the measured data and screenshots as our processor to generate that assessment. We do not sell your data and do not share it with third parties except where necessary for the purposes above or where legally required.' },
    { h: '7. Businesses whose website we measured' },
    { p: 'Rinsly measures websites at scale to see how far they sit from current web practice. In doing so we visit publicly accessible websites and record: the web address and company name, the measurement results (five grades and the findings behind them), a screenshot of the public page, and the contact details the business itself has published on that website or in a public register. Where those contact details belong to an individual (a sole trader or freelancer, for instance) they are personal data and this section applies.' },
    { p: '**We did not obtain this data from you; we collected it ourselves from public sources.** That is why we inform you here actively, rather than only on request.' },
    { ul: [
      '**Purpose:** to assess whether the business would benefit from a new or better-maintained website, and to approach it about that, by us or by one of our partners.',
      '**Legal basis:** our legitimate interest, and that of our partners, in business acquisition (art. 6(1)(f) GDPR). We limit ourselves to business contact details and business communication, and process no special categories of personal data.',
      '**Automated assessment:** the measurement results and a screenshot of the website are processed by Anthropic, PBC (the provider of the Claude model) to generate the assessment. This is not automated decision-making with legal effects on you: the assessment only determines whether and how we, or our partners, get in touch, not whether you receive a service or on what terms.',
      '**Sharing with partners:** we may make such an assessment (a \u201clead\u201d) available to a design studio we work with. That partner may use the data only to approach the business about a website, may not resell or further distribute it, and is an independent controller for its own use.',
      '**Retention:** we keep an assessment for as long as it is current enough to be useful, and in any event no longer than twelve months after the measurement, unless the business becomes a client.',
    ] },
    { p: 'You may object to this at any time, and it costs you no more than an email to contact@rinsly.com. On objection we remove the business from our data, stop approaching it, stop making it available to partners, and pass the objection on to any partner that had already received the assessment. The rights in section 9 (access, rectification, erasure) apply in full.' },
    { h: '8. Transfers outside the EEA' },
    { p: "Cloudflare, Inc. and Anthropic, PBC are based in the United States. Where personal data is processed outside the European Economic Area, this takes place under appropriate safeguards such as the EU-US Data Privacy Framework or the European Commission's Standard Contractual Clauses (SCCs)." },
    { h: '9. Your rights' },
    { p: 'You have the right to access, rectification, erasure, restriction of processing, objection to processing and data portability. Send your request to contact@rinsly.com; we will respond within the statutory period. If you disagree with how we handle your data, you may lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).' },
    { h: '10. Security' },
    { p: 'We take appropriate technical and organisational measures to protect your personal data, including encrypted connections (TLS), access control and continuous point-in-time database recovery via Cloudflare Time Travel. A backup of media files is not currently automated.' },
    { h: '11. Changes' },
    { p: 'We may update this privacy policy from time to time. The current version is always available on this page, with the date of the last change shown at the top.' },
  ],
}

const voorwaardenNodes: Record<Locale, ProseNode[]> = {
  nl: [
    { p: 'Laatst bijgewerkt: 17 juli 2026.' },
    { h: 'Artikel 1: Definities' },
    { ul: [
      '**Rinsly:** de eenmanszaak Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden, KvK 85578835, gebruiker van deze algemene voorwaarden.',
      '**Opdrachtgever:** de partij die met Rinsly een overeenkomst aangaat of daartoe een offerte ontvangt.',
      '**Diensten:** het bouwen van websites en/of het verzorgen van hosting en technisch onderhoud, zoals nader omschreven in de offerte of overeenkomst.',
      '**Meerwerk:** werkzaamheden die buiten de overeengekomen Diensten vallen.',
    ] },
    { h: 'Artikel 2: Toepasselijkheid' },
    { ol: [
      'Deze algemene voorwaarden zijn van toepassing op alle offertes, aanbiedingen en overeenkomsten tussen Rinsly en opdrachtgever.',
      'Afwijkingen gelden alleen als deze schriftelijk zijn overeengekomen.',
      'De toepasselijkheid van inkoop- of andere voorwaarden van opdrachtgever wordt uitdrukkelijk van de hand gewezen.',
      'Deze voorwaarden zijn gericht op zakelijke opdrachtgevers.',
    ] },
    { h: 'Artikel 3: Offertes en totstandkoming' },
    { ol: [
      'Offertes en op de website genoemde vanaf-prijzen zijn vrijblijvend en indicatief, tenzij uitdrukkelijk anders vermeld.',
      'Een overeenkomst komt tot stand na schriftelijke aanvaarding of ondertekening door beide partijen.',
      'Kennelijke vergissingen of fouten in een offerte binden Rinsly niet.',
    ] },
    { h: 'Artikel 4: Prijzen en betaling' },
    { ol: [
      'Alle prijzen zijn zakelijk en exclusief 21% btw.',
      'Facturatie van hosting en onderhoud vindt vooraf plaats, per maand of per jaar, naar keuze van opdrachtgever. Betaling geschiedt binnen 14 dagen na factuurdatum.',
      'Bij niet-tijdige betaling is opdrachtgever van rechtswege in verzuim en is de wettelijke handelsrente en redelijke incassokosten verschuldigd.',
      'Rinsly mag de vergoeding jaarlijks per 1 januari aanpassen aan de consumentenprijsindex (CBS). Verdergaande verhogingen worden ten minste één maand vooraf aangekondigd; is opdrachtgever het daarmee niet eens, dan kan zij de overeenkomst opzeggen tegen de ingangsdatum van de verhoging.',
    ] },
    { h: 'Artikel 5: Uitvoering' },
    { ol: [
      'Rinsly voert de Diensten naar beste inzicht en vermogen uit; het betreft een inspanningsverplichting.',
      'Opdrachtgever verstrekt tijdig de informatie, content en toegang die Rinsly redelijkerwijs nodig heeft, en staat in voor de rechtmatigheid van aangeleverde content.',
      'Genoemde termijnen zijn indicatief en niet fataal, tenzij schriftelijk anders overeengekomen.',
    ] },
    { h: 'Artikel 6: Hosting en diensten van derden' },
    { ol: [
      'De website wordt gehost op een extern hostingplatform, aan de edge. Op de diensten van die hostingpartij zijn diens eigen voorwaarden van toepassing.',
      'Rinsly is niet aansprakelijk voor storingen, wijzigingen of uitval die aan de hostingpartij of andere toeleveranciers zijn toe te rekenen.',
    ] },
    { h: 'Artikel 7: Beschikbaarheid en onderhoud' },
    { ol: [
      'Rinsly spant zich in voor een goede beschikbaarheid van de website en voert het onderhoud met zorg uit. Rinsly voert daarbij zelf geen actieve uptime-monitoring uit. Een specifieke of ononderbroken beschikbaarheid wordt niet gegarandeerd, tenzij daarover in een afzonderlijke service level agreement (SLA) uitdrukkelijk anders is overeengekomen.',
      'De database van de website is doorlopend herstelbaar naar elk moment binnen de laatste dertig dagen via Cloudflare Time Travel. Een back-up van mediabestanden is op dit moment niet geautomatiseerd.',
      'Storingen kunnen per e-mail worden gemeld; Rinsly reageert binnen de in de overeenkomst of SLA genoemde termijn.',
    ] },
    { h: 'Artikel 8: Meerwerk' },
    { ol: [
      'Werkzaamheden buiten de overeengekomen Diensten gelden als Meerwerk en worden vooraf afgesproken of op nacalculatie uitgevoerd tegen € 95 per uur (excl. btw).',
    ] },
    { h: 'Artikel 9: Looptijd en opzegging' },
    { ol: [
      'Onderhouds- en hostingovereenkomsten worden aangegaan voor onbepaalde tijd en zijn maandelijks opzegbaar met een opzegtermijn van één maand.',
      'Is de website zonder eenmalige bouwkosten opgeleverd omdat opdrachtgever zich voor een minimumlooptijd heeft verbonden, dan geldt die minimumlooptijd: in beginsel 36 maanden, en is tussentijdse opzegging pas mogelijk na afloop daarvan. De minimumlooptijd wordt in het voorstel vastgelegd. Na afloop loopt de overeenkomst door voor onbepaalde tijd en geldt lid 1.',
      'Vooruitbetaalde vergoedingen over de periode na de opzegdatum worden naar rato terugbetaald.',
      'Elke partij kan de overeenkomst met onmiddellijke ingang ontbinden bij een wezenlijke, niet-herstelde tekortkoming van de andere partij of bij diens faillissement of surseance van betaling.',
    ] },
    { h: 'Artikel 10: Intellectueel eigendom en eigendom' },
    { ol: [
      'De website, de inhoud en de bijbehorende data blijven eigendom van opdrachtgever. Na volledige betaling verkrijgt opdrachtgever het recht op vrije overdracht van de website en de broncode.',
      'Door Rinsly gebruikte generieke onderdelen, hulpmiddelen en kennis blijven aan Rinsly voorbehouden.',
      'Bij beëindiging verleent Rinsly redelijke medewerking aan de overdracht van de website, data en het domein en houdt de omgeving hiervoor nog dertig dagen beschikbaar.',
    ] },
    { h: 'Artikel 11: Verwerking van persoonsgegevens' },
    { ol: [
      'Voor zover Rinsly bij de Diensten persoonsgegevens verwerkt in opdracht van opdrachtgever, geldt de tussen partijen gesloten verwerkersovereenkomst, die onderdeel uitmaakt van de overeenkomst.',
    ] },
    { h: 'Artikel 12: Aansprakelijkheid' },
    { ol: [
      'De aansprakelijkheid van Rinsly is beperkt tot directe schade en tot ten hoogste het bedrag dat opdrachtgever in de twaalf maanden voorafgaand aan de schadeveroorzakende gebeurtenis uit hoofde van de overeenkomst heeft betaald.',
      'Rinsly is niet aansprakelijk voor indirecte schade, waaronder gevolgschade, gederfde omzet en dataverlies dat niet kan worden hersteld via Cloudflare Time Travel. Voor mediabestanden geldt dat er op dit moment geen back-up bestaat om op terug te vallen.',
      'Deze beperkingen gelden niet bij opzet of bewuste roekeloosheid van Rinsly.',
    ] },
    { h: 'Artikel 13: Overmacht' },
    { ol: [
      'Bij overmacht worden de verplichtingen opgeschort. Onder overmacht valt mede het uitvallen van of storingen bij toeleveranciers, waaronder de hostingpartij.',
    ] },
    { h: 'Artikel 14: Geheimhouding' },
    { ol: [
      'Partijen houden vertrouwelijke informatie geheim en gebruiken deze uitsluitend voor de uitvoering van de overeenkomst.',
    ] },
    { h: 'Artikel 15: Klachten' },
    { ol: [
      'Klachten over de Diensten worden binnen bekwame tijd na ontdekking schriftelijk aan Rinsly gemeld, zodat Rinsly gelegenheid heeft deze te verhelpen.',
    ] },
    { h: 'Artikel 16: Wijziging van de voorwaarden' },
    { ol: [
      'Rinsly mag deze algemene voorwaarden wijzigen. Wijzigingen gelden voor lopende overeenkomsten na aankondiging, met inachtneming van een redelijke termijn.',
    ] },
    { h: 'Artikel 17: Toepasselijk recht en geschillen' },
    { ol: [
      'Op alle overeenkomsten is Nederlands recht van toepassing.',
      'Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement van de vestigingsplaats van Rinsly.',
    ] },
  ],
  en: [
    { p: 'Last updated: 17 July 2026.' },
    { h: 'Article 1: Definitions' },
    { ul: [
      '**Rinsly:** the sole proprietorship Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden, the Netherlands, KvK 85578835, user of these terms.',
      '**Client:** the party entering into an agreement with Rinsly or receiving a quote for that purpose.',
      '**Services:** building websites and/or providing hosting and technical maintenance, as further described in the quote or agreement.',
      '**Additional work:** work falling outside the agreed Services.',
    ] },
    { h: 'Article 2: Applicability' },
    { ol: [
      'These terms apply to all quotes, offers and agreements between Rinsly and the client.',
      'Deviations apply only where agreed in writing.',
      "The applicability of the client's purchasing or other terms is expressly rejected.",
      'These terms are intended for business clients.',
    ] },
    { h: 'Article 3: Quotes and formation' },
    { ol: [
      'Quotes and any "from" prices stated on the website are without obligation and indicative, unless expressly stated otherwise.',
      'An agreement is formed upon written acceptance or signature by both parties.',
      'Obvious mistakes or errors in a quote do not bind Rinsly.',
    ] },
    { h: 'Article 4: Prices and payment' },
    { ol: [
      'All prices are for business clients and exclude 21% VAT.',
      'Hosting and maintenance are invoiced in advance, monthly or annually, at the client’s choice. Payment is due within 14 days of the invoice date.',
      'On late payment the client is in default by operation of law and owes the statutory commercial interest and reasonable collection costs.',
      'Rinsly may adjust the fee annually on 1 January in line with the Dutch consumer price index (CBS). Increases beyond that are announced at least one month in advance; if the client does not agree, it may terminate the agreement as at the effective date of the increase.',
    ] },
    { h: 'Article 5: Performance' },
    { ol: [
      'Rinsly performs the Services to the best of its insight and ability; this is a best-efforts obligation.',
      'The client provides, in good time, the information, content and access Rinsly reasonably needs, and warrants the lawfulness of content it supplies.',
      'Stated deadlines are indicative and not strict, unless agreed otherwise in writing.',
    ] },
    { h: 'Article 6: Hosting and third-party services' },
    { ol: [
      "The website is hosted on an external hosting platform, at the edge. That provider's own terms apply to its services.",
      'Rinsly is not liable for outages, changes or downtime attributable to the hosting provider or other suppliers.',
    ] },
    { h: 'Article 7: Availability and maintenance' },
    { ol: [
      'Rinsly makes reasonable efforts to keep the website available and performs maintenance with care. Rinsly does not run its own active uptime monitoring. No specific or uninterrupted availability is guaranteed unless expressly agreed otherwise in a separate service level agreement (SLA).',
      "The website's database is continuously recoverable to any point within the last thirty days via Cloudflare Time Travel. A backup of media files is not currently automated.",
      'Incidents may be reported by email; Rinsly responds within the period stated in the agreement or SLA.',
    ] },
    { h: 'Article 8: Additional work' },
    { ol: [
      'Work outside the agreed Services counts as additional work and is agreed in advance or carried out on a time-and-materials basis at € 95 per hour (excl. VAT).',
    ] },
    { h: 'Article 9: Term and termination' },
    { ol: [
      "Maintenance and hosting agreements are entered into for an indefinite term and are cancellable monthly with one month's notice.",
      'Where the website was delivered without a one-off build fee because the client committed to a minimum term, that minimum term applies: in principle 36 months, and early termination is only possible once it has expired. The minimum term is recorded in the proposal. After it expires the agreement continues for an indefinite term and paragraph 1 applies.',
      'Fees prepaid for the period after the termination date are refunded pro rata.',
      'Either party may terminate the agreement with immediate effect in the event of a material, uncured breach by the other party or its bankruptcy or suspension of payment.',
    ] },
    { h: 'Article 10: Intellectual property and ownership' },
    { ol: [
      "The website, its content and associated data remain the client's property. After full payment the client obtains the right to freely transfer the website and source code.",
      'Generic components, tools and know-how used by Rinsly remain reserved to Rinsly.',
      'On termination Rinsly gives reasonable assistance with the transfer of the website, data and domain and keeps the environment available for a further thirty days.',
    ] },
    { h: 'Article 11: Processing of personal data' },
    { ol: [
      "Where Rinsly processes personal data on the client's instructions as part of the Services, the data-processing agreement concluded between the parties applies and forms part of the agreement.",
    ] },
    { h: 'Article 12: Liability' },
    { ol: [
      "Rinsly's liability is limited to direct damage and to at most the amount the client paid under the agreement in the twelve months preceding the event causing the damage.",
      'Rinsly is not liable for indirect damage, including consequential loss, lost revenue and data loss that cannot be recovered via Cloudflare Time Travel. For media files, there is currently no backup to fall back on at all.',
      "These limitations do not apply in the event of intent or deliberate recklessness on Rinsly's part.",
    ] },
    { h: 'Article 13: Force majeure' },
    { ol: [
      'In the event of force majeure the obligations are suspended. Force majeure includes the failure of or disruptions at suppliers, including the hosting provider.',
    ] },
    { h: 'Article 14: Confidentiality' },
    { ol: [
      'The parties keep confidential information secret and use it only to perform the agreement.',
    ] },
    { h: 'Article 15: Complaints' },
    { ol: [
      'Complaints about the Services are reported to Rinsly in writing within a reasonable time of discovery, so that Rinsly has the opportunity to remedy them.',
    ] },
    { h: 'Article 16: Changes to these terms' },
    { ol: [
      'Rinsly may amend these terms. Changes apply to ongoing agreements after announcement, observing a reasonable period.',
    ] },
    { h: 'Article 17: Governing law and disputes' },
    { ol: [
      'All agreements are governed by Dutch law.',
      'Disputes are submitted to the competent court in the district where Rinsly is established.',
    ] },
  ],
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

  // Every page in the site, in one list. Layouts are written only after all of
  // them exist, because an internal link stores the TARGET PAGE'S id — a page
  // cannot link to a sibling that has not been created yet.
  const sitePages: { slug: string; title: (l: Locale) => string; layout: (l: Locale, ids: PageIds) => Block[] }[] = [
    { slug: SLUG.home, title: () => 'Rinsly', layout: homeLayout },
    {
      slug: SLUG.partner,
      title: (l) => t(l, 'Partnerprogramma', 'Partner programme'),
      layout: partnerLayout,
    },
    { slug: SLUG.platform, title: (l) => t(l, 'Platform', 'Platform'), layout: platformLayout },
    { slug: SLUG.prijzen, title: (l) => t(l, 'Prijzen', 'Pricing'), layout: prijzenLayout },
    {
      slug: SLUG.website,
      title: (l) => t(l, 'Website bij Rinsly', 'A website from Rinsly'),
      layout: websiteLayout,
    },
    { slug: SLUG.over, title: (l) => t(l, 'Over ons', 'About'), layout: overLayout },
    { slug: SLUG.contact, title: () => 'Contact', layout: (l) => contactLayout(l) },
    // The legal pages carry no internal links, but they ride along so that one
    // loop owns "which pages exist".
    {
      slug: 'privacy',
      title: (l) => t(l, 'Privacyverklaring', 'Privacy policy'),
      layout: (l) => legalLayout(t(l, 'Juridisch', 'Legal'), t(l, 'Privacyverklaring', 'Privacy policy'), privacyNodes[l]),
    },
    {
      slug: 'voorwaarden',
      title: (l) => t(l, 'Algemene voorwaarden', 'Terms & conditions'),
      layout: (l) => legalLayout(t(l, 'Juridisch', 'Legal'), t(l, 'Algemene voorwaarden', 'Terms & conditions'), voorwaardenNodes[l]),
    },
  ]

  // Pass 1 — make sure every page row exists, and collect slug → id.
  const ids: PageIds = {}
  for (const page of sitePages) {
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
    ids[page.slug] = doc.id
  }

  // Pass 2 — write both locales' layouts, then publish.
  for (const page of sitePages) {
    for (const locale of ['nl', 'en'] as Locale[]) {
      await payload.update({
        collection: 'pages',
        id: ids[page.slug],
        draft: true,
        locale,
        data: { title: page.title(locale), layout: page.layout(locale, ids) } as never,
        user,
      })
    }
    await payload.update({
      collection: 'pages',
      id: ids[page.slug],
      data: { _status: 'published' } as never,
      user,
    })
    console.log(`Published /${page.slug === SLUG.home ? '' : page.slug}`)
  }

  // Globals
  await payload.updateGlobal({ slug: 'header', locale: 'nl', data: headerData('nl', ids) as never, user })
  await payload.updateGlobal({ slug: 'header', locale: 'en', data: headerData('en', ids) as never, user })
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
