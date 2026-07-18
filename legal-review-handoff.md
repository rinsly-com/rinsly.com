# Legal review request — new commitments on the Rinsly pricing page

**To:** [legal reviewer / Dutch counsel]
**From:** Rinsly
**Date:** 2026-07-17
**Turnaround needed before:** publishing the updated pricing page / deploying to production
**Jurisdiction & framework:** Netherlands (Dutch law); GDPR / AVG for the data-processing items.

---

## Why I'm sending this

Rinsly (a Dutch one-person web studio: custom website builds + fully-managed
hosting/maintenance) is about to publish an updated pricing page. The update
**adds several statements that become contractual commitments the moment they are
public** — an uptime guarantee, guaranteed SLA response times, and a
data-processing agreement (verwerkersovereenkomst). None of these were advertised
before. I want them reviewed **before** they go live, and I want the underlying
contract/SLA documents to actually match and honour what the page promises.

I am not asking you to price anything or comment on commercial strategy — only on
legal exposure, enforceability, and what backing documents/wording I need.

---

## Exactly what the page will now say (verbatim, NL + EN)

These appear under the top **"Op maat" / "Custom"** plan (priced "vanaf €499 / from
€499 per month"), unless noted:

1. **Uptime guarantee**
   - NL: *"99,9% uptime-garantie"*
   - EN: *"99.9% uptime guarantee"*

2. **SLA with guaranteed response times**
   - NL: *"SLA met gegarandeerde reactietijden"*
   - EN: *"SLA with guaranteed response times"*
   *(No specific response-time number is on the page yet — the internal intent is
   something like ≤4 business hours. See Q2.)*

3. **Staging environment** — NL: *"Staging-omgeving"* / EN: *"Staging environment"*
   *(Operational claim, low legal risk — included for completeness.)*

4. **Security, compliance & data-processing agreement**
   - NL: *"Security, compliance & verwerkersovereenkomst"*
   - EN: *"Security, compliance & data-processing agreement"*

Also relevant, already live and unchanged but worth confirming still holds:

5. **No lock-in / cancellation** (FAQ): NL *"doorlopend en maandelijks opzegbaar met
   een opzegtermijn van één maand"* / EN *"ongoing and cancellable monthly, with a
   one-month notice period."*

6. **Ownership** (FAQ): NL *"De website en alle data blijven altijd uw eigendom"* /
   EN *"The website and all data always remain your property."*

7. **Build price** (FAQ): NL *"Een maatwerksite start vanaf €2.500 (excl. btw)…"* —
   confirm "vanaf/from" and "excl. btw" framing is sufficient to avoid this reading
   as a fixed/binding quote.

---

## What I need you to review

**Q1 — 99.9% uptime guarantee.**
- Is advertising "99,9% uptime-garantie" enforceable/safe as worded, and what does
  it legally commit me to? 99.9%/month ≈ 43 minutes of allowed downtime.
- The site is hosted on **Cloudflare (Workers/D1/R2)**. My guarantee cannot exceed
  what my own infrastructure provider gives me. Should the guarantee be explicitly
  scoped (exclude provider outages, scheduled maintenance, force majeure,
  client-caused issues, third-party integrations)?
- Do I need a **service-credit/remedy scheme** (e.g. X% monthly fee credited per
  breach) for this to be a lawful, bounded commitment rather than open-ended
  liability? What's a defensible cap on remedies?

**Q2 — "Guaranteed response times" SLA.**
- Before I publish a specific number (e.g. "reactietijd ≤ 4 werkuren"), what
  wording protects me — defining *response* vs *resolution*, business hours,
  scope, and exclusions?
- Should the public page stay qualitative ("gegarandeerde reactietijden") and push
  the actual numbers into the signed SLA/contract? Advise on the safer split.

**Q3 — Verwerkersovereenkomst / DPA (AVG/GDPR).**
- I already generate a verwerkersovereenkomst via an internal template (the
  `rinsly-offerte` tooling). **Please review that template** for AVG compliance:
  processor obligations (art. 28 AVG), sub-processors (Cloudflare, and where its
  data is processed / international-transfer basis), security measures (art. 32),
  breach notification, data return/deletion on termination.
- Is it accurate to advertise "compliance" as a feature, and does anything I say
  publicly need to be softened to avoid over-promising a certification I don't hold
  (e.g. it is *not* ISO 27001 / NEN 7510 certified)?

**Q4 — "Security" claim.**
- "Security" is listed as a plan feature. Is a bare "security" claim a
  misleading-advertising risk if not substantiated? What can I state safely given
  my actual measures (Cloudflare WAF/SSL, backups, updates, monitoring)?

**Q5 — General.**
- Do my **algemene voorwaarden (T&Cs)** need to exist / be linked from the site and
  referenced at checkout for any of the above to bind correctly?
- Consumer vs B2B: the "Op maat" tier targets larger organisations (B2B), but
  lower tiers may reach zzp'ers/consumers. Flag anything where consumer-protection
  rules change what I can promise or how I must word cancellation.
- Confirm the "vanaf" pricing and "excl. btw" statements are compliant for a Dutch
  audience (no incl.-BTW display obligation being triggered for consumer-facing
  prices).

---

## What I'd like back

1. A **go / no-go per claim** above (safe as-is / reword / remove until backed).
2. **Suggested wording** for the public page for anything that needs it (NL + EN).
3. A short list of **backing documents I must have in place before publishing**
   (SLA doc, service-credit schedule, T&Cs, reviewed verwerkersovereenkomst) and
   whether any must be linked from the page itself.
4. Any **liability cap** language you'd insist on for the uptime/SLA commitments.

## What is *not* in scope
Commercial pricing levels, market positioning, and tax filing — those are handled
separately. This review is strictly legal exposure, enforceability, and required
documentation.

---

*Source of the exact strings: `scripts/seed.ts` in the Rinsly repo (the seed is the
source of truth for site content). Happy to share the rendered page or the current
verwerkersovereenkomst/offerte template on request.*
