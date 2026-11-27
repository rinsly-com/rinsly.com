/**
 * Every new string the content migration writes, with its source row.
 *
 * Only cleared text: refactor-plan-003 rows marked "cleared verbatim" or
 * "no new claim", Lawyer §16.2 FIX texts (marketing-copy-check.md, 27 Nov),
 * copy-pricing-rewrite.md rows, and the builder brief of 27 Nov. Rows that
 * are on hold (O-04), flagged off (x3v3AndF1: P-02, P-04, P-05, W-06;
 * footerOwnerName: the holder line in G-04 / H-06 / O-05) are not here.
 * Lawyer writes straight apostrophes; the site uses ’ throughout, so those
 * are typographic only.
 */

type Pair = { nl: string; en: string }

export const HOME = {
  /** H-01 */
  eyebrow: {
    nl: 'Bouw en hosting van websites, voor ontwerpstudio’s en bedrijven',
    en: 'Website build and hosting, for design studios and businesses',
  },
  /** H-02, Lawyer §16.2 FIX */
  intro: {
    nl: 'Rinsly bouwt websites als applicaties op één eigen engine, en host en onderhoudt ze. Hosting vanaf €49 per maand, excl. btw. Ontwerpstudio’s krijgen een aandeel in de doorlopende abonnementsomzet van hun toegeschreven klanten, beginnend bij 10% van het bedrag exclusief btw dat Rinsly daadwerkelijk ontvangt per betaalde factuur, volgens de partnervoorwaarden.',
    en: 'Rinsly builds websites as applications on one in-house engine, and hosts and maintains them. Hosting from €49 a month, excl. VAT. Design studios receive a share of the recurring subscription revenue from their attributed clients, starting at 10% of the amount excl. VAT that Rinsly actually receives per settled invoice, under the partner terms.',
  },
  /** H-03 (button 1) */
  partnerButton: { nl: 'Partner worden', en: 'Become a partner' },
  /**
   * Button 2. Brief §2 unifies the header, footer and home-button label to
   * "Website laten maken" / "Get a website built" (§3.2 still quotes H-03's
   * "Website voor mijn bedrijf"; §2 is the later, explicit instruction).
   */
  businessButton: { nl: 'Website laten maken', en: 'Get a website built' },
  /** H-04: door 1 = Lawyer §16.2 FIX, door 2 = plan row (Lawyer: OK, A2). Split at the colon into card title + text. */
  doors: {
    studioTitle: { nl: 'Ontwerpstudio’s en freelance ontwerpers', en: 'Design studios and freelance designers' },
    studioText: {
      nl: 'Jullie ontwerpen, wij bouwen en hosten. Jullie krijgen een aandeel in de doorlopende abonnementsomzet, beginnend bij 10% van het bedrag exclusief btw dat Rinsly daadwerkelijk ontvangt per betaalde factuur, volgens de partnervoorwaarden.',
      en: 'You design, we build and host. You receive a share of the recurring subscription revenue, starting at 10% of the amount excl. VAT that Rinsly actually receives per settled invoice, under the partner terms.',
    },
    businessTitle: { nl: 'Bedrijven', en: 'Businesses' },
    businessText: {
      nl: 'Een website die wij bouwen en onderhouden. Hosting vanaf €49 per maand, excl. btw. Alleen voor zakelijke opdrachtgevers. Heeft u nog geen ontwerp, dan kunnen we u in contact brengen met een ontwerpstudio: u kiest zelf.',
      en: 'A website we build and maintain. Hosting from €49 a month, excl. VAT. Business clients only. No design yet? We can introduce you to a design studio: you choose.',
    },
  },
  /** H-05. The EN section title is the only string here without a plan row (see PR open questions). */
  steps: {
    title: { nl: 'Zo werkt het', en: 'How it works' },
    one: { nl: '1. U vertelt wat u nodig heeft.', en: '1. You tell us what you need.' },
    two: { nl: '2. Wij bouwen het en zetten het live.', en: '2. We build it and take it live.' },
    three: {
      nl: '3. Wij draaien het; teksten en foto’s beheert u zelf in het CMS.',
      en: '3. We run it; you manage words and photos yourself in the CMS.',
    },
  },
  /**
   * H-06, Lawyer §16.2 FIX minus the holder sentences that carry the owner's
   * name (footerOwnerName is off). Identity = trade name, KvK and address only.
   */
  trust: {
    nl: 'Rinsly · KvK 85578835 · Kazernestraat 6, 3441 BB Woerden. U spreekt de persoon die uw site bouwt en beheert. Uw gegevens krijgt u altijd mee. De website en de broncode krijgt u mee zodra het uitstapbedrag (als dat geldt) en openstaande facturen zijn betaald. Zie de algemene voorwaarden en uw offerte.',
    en: 'Rinsly · Chamber of Commerce / KvK 85578835 · Kazernestraat 6, 3441 BB Woerden. You speak to the person who builds and runs your site. You always receive your data. You receive the website and the source code once the exit amount (if any) and any outstanding invoices have been paid. See the general terms and your quote.',
  },
  /** H-09 title; X2 (intro tail); X1 (card) */
  platformTitle: { nl: 'Eén engine achter onze sites', en: 'One engine behind our sites' },
  platformIntroOld: {
    nl: 'Daarom kan een beveiligingsfix één keer gemaakt worden en over alle sites tegelijk uitgerold.',
    en: 'which is why a security fix can be made once and rolled out across every site at the same time.',
  },
  platformIntroNew: {
    nl: 'Daarom kan een beveiligingsfix één keer gemaakt worden en uitgerold naar alle sites op de engine.',
    en: 'which is why a security fix can be made once and rolled out to all sites on the engine.',
  },
  engineCard: {
    nl: 'Een beveiligingsfix maken we één keer en rollen we uit naar alle sites op de engine. Eén gedeelde engine in plaats van losse installaties met eigen plugins.',
    en: 'A security fix is made once and rolled out to all sites on the engine. One shared engine instead of separate installs with their own plugins.',
  },
  /** H-08 / R2 */
  limitsFeature: { nl: 'Vaste limieten, vooraf bekend', en: 'Stated limits, known up front' },
  /** H-07 */
  measureTitle: { nl: 'Meet uw website, gratis en zonder account', en: 'Measure your website, free and without an account' },
  measureText: {
    nl: 'Vijf rapportcijfers voor de website van uw keuze. Probeer het op een URL naar keuze.',
    en: 'Five grades for a website of your choice. Try it on a URL of your choice.',
  },
  /** H-10 */
  closingStudio: {
    nl: 'Vertel wat jullie maken en hoe jullie het nu opleveren; dan horen jullie of dit past.',
    en: 'Tell us what you make and how you deliver it today, and we will tell you whether it fits.',
  },
  /** H-11, split at the question mark into title + button */
  closingBusinessTitle: { nl: 'Een website voor uw bedrijf?', en: 'A website for your business?' },
  closingBusinessButton: { nl: 'Bekijk wat het kost', en: 'See what it costs' },
} satisfies Record<string, unknown>

export const PRICING = {
  /** P-01 */
  h1: { nl: 'Prijzen: hosting vanaf €49 per maand', en: 'Pricing: hosting from €49 a month' },
  /** P-15, Lawyer §16.2 FIX */
  metaTitle: { nl: 'Hosting vanaf €49 per maand excl. btw · Rinsly', en: 'Hosting from €49 a month excl. VAT · Rinsly' },
  /**
   * Live meta description minus the "gratis bij drie jaar hosting" sentence
   * (P-16, its replacement, waits for F1). Deletion only.
   */
  metaDescription: {
    nl: 'Hosting vanaf €49 per maand. Limieten in gigabytes en requests, niet in bijvoeglijke naamwoorden.',
    en: 'Hosting from €49 per month. Limits in gigabytes and requests, not in adjectives.',
  },
  /** Live hero intro minus the €0 / 36-month sentences (P-02 is behind x3v3AndF1). Deletion only. */
  heroIntro: {
    nl: 'Het pakket volgt niet het aantal pagina’s, maar hoeveel de site opslaat en hoeveel verkeer die trekt: pagina’s kosten niets, een mediabibliotheek en een database wel. Bij elk pakket ziet u precies waar de grens ligt voordat een upgrade nodig is.',
    en: 'The plan does not follow the number of pages but how much the site stores and how much traffic it takes: pages cost nothing, a media library and a database do. Every plan states exactly where the limit sits before an upgrade is needed.',
  },
  /** P-03, paid-route half (EN) */
  paidBuildEn:
    'Or pay for the build: from €2,500, then ongoing and cancellable monthly with one month’s notice. A paid build can, by arrangement, be spread over the first year. All prices excl. 21% VAT. A paid build scales with complexity.',
  /** P-07 / R9 */
  careEdge: { nl: 'Eén omgeving per site, aan de edge', en: 'One environment per site, at the edge' },
  /** P-12 / A6 */
  managedFor: { nl: 'Ontzorgd, inclusief 1 uur wijzigingen per maand', en: 'Taken care of, including 1 hour of changes per month' },
  /** P-12: one quote button (the pricing block has no per-tier button field in site-core) */
  quoteButton: { nl: 'Vraag een offerte aan', en: 'Request a quote' },
  /** P-08 */
  dpaLine: { nl: 'Verwerkersovereenkomst (AVG) bij elk pakket', en: 'Data processing agreement (GDPR) with every plan' },
  /** P-14, Lawyer §16.2 FIX */
  indexation: {
    nl: 'Rinsly mag de vergoeding jaarlijks per 1 januari aanpassen aan de consumentenprijsindex (CBS). Een verdergaande verhoging kondigen we ten minste één maand van tevoren aan; bent u het daarmee niet eens, dan kunt u opzeggen tegen de ingangsdatum. Zie de algemene voorwaarden.',
    en: 'Rinsly may adjust the fee each 1 January in line with the CBS consumer price index. A further increase is announced at least one month in advance; if you do not agree, you may cancel effective on the date it starts. See the general terms.',
  },
  /** P-10 / A2 */
  limitNote: {
    nl: 'Over een limiet? Dan melden we dat vooraf en kiest u: bijbetalen per eenheid (€1 per extra GB media, €5 per extra GB database, €2 per extra miljoen requests per maand) of een pakket omhoog.',
    en: 'Over a limit? We tell you in advance and you choose: pay per unit (€1 per extra GB of media, €5 per extra GB of database, €2 per extra million requests a month) or move up a plan.',
  },
  /** P-13 / A4 (replaces the second half of the answer) */
  invoiceOld: {
    nl: 'Uw overeenkomst over de website loopt in beide gevallen via Rinsly, en dat is precies wat u beschermt: stopt de studio ermee, dan gaat uw site zonder onderbreking bij ons verder.',
    en: 'Your agreement about the website runs through Rinsly either way, which is what protects you: if the studio stops, your site carries on with us without interruption.',
  },
  invoiceNew: {
    nl: 'Uw overeenkomst over de website loopt in beide gevallen via Rinsly. Stopt de studio ermee, dan gaat uw site bij ons verder; we zorgen dat de overgang soepel verloopt.',
    en: 'Your agreement about the website runs through Rinsly either way. If the studio stops, your site carries on with us; we make sure the transition goes smoothly.',
  },
  /** S-02 + P-06 (same release) */
  careSupportTitle: { nl: 'Wat houdt e-mailondersteuning bij Care in?', en: 'What does email support on Care include?' },
  careSupportBody: {
    nl: 'Bij Care beantwoorden we gewone vragen per e-mail. Voor storingen is geen vaste reactietijd afgesproken. Een SLA met vastgelegde reactietijden is alleen mogelijk bij Op maat, en alleen als die is overeengekomen.',
    en: 'On Care we answer ordinary questions by email. No fixed response time has been agreed for outages. An SLA with specified response times is only possible on Custom, and only if agreed.',
  },
  /** P-09 (EN question title has no plan row; see PR open questions) */
  dpaFaqTitle: { nl: 'Is er een verwerkersovereenkomst?', en: 'Is there a data processing agreement?' },
  dpaFaqBody: {
    nl: 'Ja. Bij elk pakket sluiten we een verwerkersovereenkomst, zoals de AVG vereist.',
    en: 'Yes. Every plan includes a data processing agreement, as the GDPR requires.',
  },
} satisfies Record<string, unknown>

export const PARTNER = {
  /** PA-01, Lawyer §16.2 FIX */
  h1: {
    nl: 'Jullie ontwerpen. Rinsly bouwt en host. Jullie kunnen meeverdienen aan de doorlopende abonnementsomzet, volgens de partnervoorwaarden.',
    en: 'You design. Rinsly builds and hosts. You can earn a share of the recurring subscription revenue, under the partner terms.',
  },
  /** PA-02, Lawyer §16.2 draft (appendix C was missing; Lawyer: use as is) */
  intro: {
    nl: 'Jullie ontwerpen, wij bouwen en hosten. Jij kiest wie de klant factureert: Rinsly, of jullie zelf. Doorverkoop en eigen branding zijn toegestaan. Factureer je de eindklant zelf, dan koop je bij Rinsly in tegen de lijstprijs min jouw percentage, zet je ontwerp en hosting op één factuur, en bepaal je zelf de prijs en desgewenst de abonnementsvorm. Het aandeel begint bij 10% van de doorlopende abonnementsomzet exclusief btw, over het bedrag dat Rinsly daadwerkelijk ontvangt per betaalde factuur van een toegeschreven, betalende site, en kan in vaste stappen oplopen tot maximaal 35%, volgens de partnervoorwaarden. Eenmalige bouwkosten en meerwerk worden niet gedeeld.',
    en: 'You design, we build and host. You choose who invoices the client: Rinsly, or you. Reselling and your own branding are allowed. If you invoice the end client yourself, you buy from Rinsly at list minus your percentage, put design and hosting on one invoice, and set the price and your own tiers if you want. The share starts at 10% of recurring subscription revenue excl. VAT, on the amount Rinsly actually receives per settled invoice for an attributed, paying site, and can rise in fixed steps to a maximum of 35%, under the partner terms. One-off build fees and extra work are not shared.',
  },
  /** PA-04, Lawyer §16.2 FIX, with the meta-only shortening Lawyer allows for the 155-character limit */
  metaDescription: {
    nl: 'Jullie ontwerpen, Rinsly bouwt en host. Een aandeel in de doorlopende abonnementsomzet, beginnend bij 10% van het bedrag per betaalde factuur, volgens de partnervoorwaarden.',
    en: 'You design, Rinsly builds and hosts. A share of the recurring subscription revenue, starting at 10% of the amount per settled invoice, under the partner terms.',
  },
  /** PA-05: H2 and rungs (terms v3.3 art. 5) */
  ladderTitle: { nl: 'Het aandeel: een vaste ladder', en: 'The share: a fixed ladder' },
  /** Live ladder intro minus the "0%" and "eindigt op 35%" sentences. Deletion only. */
  ladderIntro: {
    nl: 'Het aandeel wordt niet per partner onderhandeld: het is opgebouwd uit deze vaste ladder.',
    en: 'The share is not negotiated per partner: it is composed from this fixed ladder.',
  },
  rungBase: { nl: 'Basis 10%', en: 'Base 10%' },
  rungFirstLine: { nl: 'Eerste lijn +10%', en: 'First line +10%' },
  rungSales: { nl: 'Verkoop +10%', en: 'Sales +10%' },
  rungVolume: { nl: 'Volume +5%', en: 'Volume +5%' },
  rungVolumeText: {
    nl: 'Vanaf vijf betalende toegeschreven eindklanten.',
    en: 'From five paying attributed clients.',
  },
  /** PA-05 caveat, Lawyer §16.2 */
  caveat: {
    nl: 'De percentages gelden over de doorlopende abonnementsomzet exclusief btw, volgens de partnervoorwaarden. Eerste lijn en verkoop komen er alleen bij als die trede loopt. Volume telt vanaf vijf betalende toegeschreven eindklanten. Het maximum van alle treden samen is 35%.',
    en: 'The percentages apply to recurring subscription revenue excl. VAT, under the partner terms. First line and sales are added only while that rung applies. Volume counts from five paying attributed end clients. The maximum of all rungs together is 35%.',
  },
  /** PA-06, Lawyer §16.2 FIX */
  base: {
    nl: 'De basis is 10% van de doorlopende abonnementsomzet exclusief btw: het bedrag dat Rinsly daadwerkelijk heeft ontvangen op een betaalde factuur van een toegeschreven, betalende site, na aftrek van de kosten van de betaaldienstverlener. Eenmalige bouwkosten en meerwerk worden niet gedeeld.',
    en: 'The base is 10% of recurring subscription revenue excl. VAT: the amount Rinsly has actually received on a settled invoice for an attributed, paying site, after payment-provider fees. One-off build fees and extra work are not shared.',
  },
  /** PA-08 */
  invoiceChoiceOld: {
    nl: 'De partner kiest wie factureert. Niet afleiden uit de grootte van de studio.',
    en: 'The partner chooses who invoices. Do not infer it from the size of the studio.',
  },
  invoiceChoiceNew: { nl: 'Jij kiest wie de klant factureert.', en: 'You choose who invoices the client.' },
  /** PA-13 */
  defaultOld: {
    nl: 'Dat is de standaard, en daarop staan de voorwaarden, de SLA, de verwerkersovereenkomst en het eigendom van site en data.',
    en: 'That is the default, and it carries the terms, the SLA, the processor agreement and the client’s ownership of the site and the data.',
  },
  defaultNew: {
    nl: 'Dat is de standaard, en daarop staan de voorwaarden en de verwerkersovereenkomst.',
    en: 'That is the default, and it carries the terms and the data processing agreement.',
  },
  /** PA-14 calculator footnote */
  calculatorFootnote: { nl: 'Dit is een indicatie, geen aanbod.', en: 'This is an indication, not an offer.' },
  /** PA-15 */
  costFaq: {
    nl: 'De basis van het aandeel is 10%. Eenmalige bouwkosten en meerwerk worden niet gedeeld.',
    en: 'The base share is 10%. One-off build fees and extra work are not shared.',
  },
  /** PA-18 */
  closingTitle: { nl: 'Plan een partnergesprek', en: 'Book a partner call' },
  /** H-09 title phrase (Lawyer §14.8) applied to the X1 card on this page */
  engineTitle: { nl: 'Eén engine achter onze sites', en: 'One engine behind our sites' },
  engineFixOld: {
    nl: 'Een beveiligingsfix maken we één keer en rollen uit over alle klanten tegelijk.',
    en: 'A security fix is made once and rolled out to every client at once.',
  },
  /** X1 first sentence */
  engineFixNew: {
    nl: 'Een beveiligingsfix maken we één keer en rollen we uit naar alle sites op de engine.',
    en: 'A security fix is made once and rolled out to all sites on the engine.',
  },
  /** "Waarom" intro: the absolute "voor al onze sites" swapped for the cleared "achter onze sites" (H-09). */
  whyOld: { nl: 'Eén geversioneerde engine voor al onze sites', en: 'One versioned engine for every site' },
  whyNew: { nl: 'Eén geversioneerde engine achter onze sites', en: 'One versioned engine behind our sites' },
  /** PA-11: R3 (= A7) */
  operationsCard: {
    nl: 'Limieten in gigabytes en requests, vooraf bekend.',
    en: 'Limits in gigabytes and requests, known in advance.',
  },
  /** PA-11: R4 */
  runStep: {
    nl: 'Edge-hosting, SSL, beveiliging en CMS-updates, en uitrol naar alle sites op de engine.',
    en: 'Edge hosting, SSL, security and CMS updates, and rollout to all sites on the engine.',
  },
  /** PA-11: R5 */
  diagramCaption: {
    nl: 'Jullie leveren het design system aan. Rinsly bouwt het als een echte applicatie op de gedeelde engine en zet het live, en draait daarna edge-hosting, SSL, beveiliging en CMS-updates.',
    en: 'You deliver the design system. Rinsly builds it as a real application on the shared engine and takes it live, then runs edge hosting, SSL, security and CMS updates.',
  },
  /** PA-11: measurement CTA ("halve minuut" and "elke URL" out) */
  measureTitle: { nl: 'Meet een site', en: 'Measure a site' },
  measureText: {
    nl: 'Probeer de meting zelf op een URL naar keuze. Vijf rapportcijfers, gratis en zonder account.',
    en: 'Try the measurement yourself on a URL of your choice. Five grades, free and without an account.',
  },
  /** PA-17: Dutch left on the EN page */
  enFixes: [
    ['meerwerk', 'additional work'],
    ['€199,20', '€199.20'],
  ] as [string, string][],
} satisfies Record<string, unknown>

export const CONTACT = {
  /** C-01 / Lawyer X8 */
  introOld: {
    nl: 'Kies hieronder wie u bent, dan stellen we de juiste vragen en geen enkele overbodige.',
    en: 'Choose below who you are, then we ask the right questions and none of the pointless ones.',
  },
  introNew: {
    nl: 'Kies hieronder wie u bent, dan stellen we de juiste vragen.',
    en: 'Choose below who you are and we ask the right questions.',
  },
} satisfies Record<string, Pair>

export const NAV = {
  /** G-01 / brief §2 (one label for the business door everywhere) */
  website: { nl: 'Website laten maken', en: 'Get a website built' },
  studios: { nl: 'Voor ontwerpstudio’s', en: 'For design studios' },
  /** G-02 */
  tagline: {
    nl: 'Bouw en hosting van websites, voor ontwerpstudio’s en bedrijven. Uit Woerden.',
    en: 'Website build and hosting, for design studios and businesses. From Woerden.',
  },
  /** G-04 (address part; the holder line waits for footerOwnerName) */
  address: 'Kazernestraat 6, 3441 BB Woerden',
} satisfies Record<string, unknown>
