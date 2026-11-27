/**
 * Copy for the redesign direction B v5 drafts (migration
 * 20261127_200500_redesign_v5_content). Every string has a source.
 *
 * Sources, in order of preference:
 *  1. Text that is already in the #122 drafts or the accp snapshot (reused by
 *     reference in redesignV5.ts, so it cannot drift).
 *  2. copy.ts (refactor-plan-003 / Lawyer §16.2, as cleared for #122).
 *  3. SOURCE_QUOTES below: strings quoted verbatim from the v5 brief
 *     (Marketeer, Yaron OK 27 Nov 19:37), the redesign spec
 *     (marketing/redesign-spec-2026-11-27.md) and its string audit
 *     (redesign-2026-11-27/v3/STRING-AUDIT.md).
 *  4. Anything else is marked `confirm` (per locale). That is copy Marketeer
 *     has to confirm before the drafts are published; it is listed in the PR.
 *
 * tests/unit/redesignV5.unit.spec.ts checks that every string without a
 * `confirm` mark is a substring of sources 1–3.
 */

export type Locale = 'nl' | 'en'
export type V5String = { nl: string; en: string; confirm?: Locale[] }

/** Verbatim quotes from the v5 brief, the redesign spec and the string audit (source 3). */
export const SOURCE_QUOTES: string[] = [
  // Brief v5 (Marketeer, Yaron OK 19:37) and spec §11
  'Wij bouwen en hosten uw website.',
  'Website laten maken',
  'Voor ontwerpstudio’s',
  'vanaf €49 / mnd',
  'Managed · Aanbevolen €99',
  'basis 10%',
  'Voorbeeldindeling',
  // Spec §2 (Yaron 18:44) and §4.4 (door copy agreed, Yaron 18:44)
  'Uw gegevens krijgt u mee.',
  'Deur 1',
  'Deur 2',
  'Hoe het werkt',
  'jullie ontwerpen / wij bouwen en hosten / jullie delen mee in de abonnementsomzet volgens de partnervoorwaarden',
  // Spec §7.2 / string audit (prijzen)
  'Vier pakketten, excl. 21% btw. De bouwkosten en de looptijd staan in de offerte.',
  'Care, per maand, excl. btw',
  'Worden de prijzen geïndexeerd?',
  'voorbeeld.uwbedrijf.nl',
  // String audit (partner)
  'basis van het aandeel',
  'Elke toegeschreven, betalende site.',
  'Komt er alleen bij als die trede loopt.',
  'Vanaf vijf betalende toegeschreven eindklanten.',
  'Stap 1',
  'Stap 2',
  'Stap 3',
  'Wij verkopen geen ontwerp. Dat doen onze partners.',
  'Waarover wordt het percentage berekend?',
  'voorbeeld.studio.nl',
]

const s = (nl: string, en: string, confirm?: Locale[]): V5String => (confirm ? { nl, en, confirm } : { nl, en })

/** Strings that are new in v5 (not reused from the #122 drafts by reference). */
export const V5 = {
  common: {
    caption: s('Voorbeeldindeling', 'Example layout', ['en']),
    step: [s('Stap 1', 'Step 1', ['en']), s('Stap 2', 'Step 2', ['en']), s('Stap 3', 'Step 3', ['en'])],
    perMonthExcl: s('per maand, excl. btw', 'a month, excl. VAT'),
    dpaFaqTitle: s('Is er een verwerkersovereenkomst?', 'Is there a data processing agreement?', ['en']),
  },
  home: {
    h1: s('Wij bouwen en hosten uw website.', 'We build and host your website.', ['en']),
    sub: s('Hosting vanaf €49 per maand, excl. btw.', 'Hosting from €49 a month, excl. VAT.'),
    url: s('voorbeeld.uwbedrijf.nl', 'example.yourbusiness.com', ['en']),
    badge: s('vanaf €49 / mnd', 'from €49 / mo', ['en']),
    door1Label: s('Deur 1', 'Door 1', ['en']),
    door2Label: s('Deur 2', 'Door 2', ['en']),
    howLine: s('Hoe het werkt', 'How it works'),
    studioBullets: [
      s('Jullie ontwerpen', 'You design'),
      s('Wij bouwen en hosten', 'We build and host'),
      s(
        'Jullie delen mee in de abonnementsomzet volgens de partnervoorwaarden',
        'You share in the subscription revenue under the partner terms',
        ['en'],
      ),
    ],
    businessBullets: [
      s('Een website die wij bouwen en onderhouden', 'A website we build and maintain'),
      s('Hosting vanaf €49 per maand, excl. btw', 'Hosting from €49 a month, excl. VAT'),
      s('Alleen voor zakelijke opdrachtgevers', 'Business clients only'),
    ],
    businessFine: s(
      'Heeft u nog geen ontwerp, dan kunnen we u in contact brengen met een ontwerpstudio: u kiest zelf.',
      'No design yet? We can introduce you to a design studio: you choose.',
    ),
    stepsTitle: s('Zo werkt het', 'How it works'),
    steps: [
      s('U vertelt wat u nodig heeft.', 'You tell us what you need.'),
      s('Wij bouwen het en zetten het live.', 'We build it and take it live.'),
      s('Wij draaien het', 'We run it'),
    ],
    step3Text: s('Teksten en foto’s beheert u zelf in het CMS.', 'You manage words and photos yourself in the CMS.'),
    trust: [
      s('Hosting vanaf €49 per maand, excl. btw', 'Hosting from €49 a month, excl. VAT'),
      s('Verwerkersovereenkomst (AVG) bij elk pakket', 'Data processing agreement (GDPR) with every plan'),
      s('Uw gegevens krijgt u mee', 'You receive your data', ['en']),
      s('Alleen voor zakelijke opdrachtgevers', 'Business clients only'),
    ],
    faqTitle: s('Veelgestelde vragen', 'FAQ'),
    dataFaqTitle: s('Krijg ik mijn gegevens mee als ik stop?', 'Do I get my data if I stop?', ['nl', 'en']),
    dataFaqBody: s(
      'Uw gegevens krijgt u altijd mee. De website en de broncode krijgt u mee zodra het uitstapbedrag (als dat geldt) en openstaande facturen zijn betaald. Zie de algemene voorwaarden en uw offerte.',
      'You always receive your data. You receive the website and the source code once the exit amount (if any) and any outstanding invoices have been paid. See the general terms and your quote.',
    ),
  },
  prijzen: {
    sub: s(
      'Vier pakketten, excl. 21% btw. De bouwkosten en de looptijd staan in de offerte.',
      'Four plans, excl. 21% VAT. The build fee and the term are in the quote.',
      ['en'],
    ),
    chipSuffix: s('Care, per maand, excl. btw', 'Care, a month, excl. VAT', ['en']),
    url: s('voorbeeld.uwbedrijf.nl', 'example.yourbusiness.com', ['en']),
    badge: s('Managed · Aanbevolen €99', 'Managed · Recommended €99', ['en']),
    invoiceUrl: s('rinsly.com/prijzen', 'rinsly.com/en/pricing', ['nl', 'en']),
    invoiceTitle: s('Maandelijks, excl. 21% btw', 'Monthly, excl. 21% VAT', ['nl', 'en']),
    indexationFaqTitle: s('Worden de prijzen geïndexeerd?', 'Are prices indexed?', ['en']),
  },
  partner: {
    url: s('voorbeeld.studio.nl', 'example.studio.com', ['en']),
    badge: s('basis 10%', 'base 10%', ['en']),
    chipSuffix: s('basis van het aandeel', 'base share'),
    rungTexts: [
      s('Elke toegeschreven, betalende site.', 'Every attributed, paying site.', ['en']),
      s('Komt er alleen bij als die trede loopt.', 'Added only while that rung applies.'),
      s('Komt er alleen bij als die trede loopt.', 'Added only while that rung applies.'),
      s('Vanaf vijf betalende toegeschreven eindklanten.', 'From five paying attributed end clients.'),
    ],
    /** Fix (2) of the v5 brief: must not repeat the H1. The brief's "e.g." text, so Marketeer confirms it. */
    stepsTitle: s('Zo werkt de samenwerking', 'How the partnership works', ['nl', 'en']),
    step1Text: s('Wij verkopen geen ontwerp. Dat doen onze partners.', 'We don’t sell design. Our partners do.', ['en']),
    basisFaqTitle: s('Waarover wordt het percentage berekend?', 'What is the percentage calculated on?', ['en']),
  },
} as const
