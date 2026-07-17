# Legal review — response to the pricing-page handoff

**To:** Rinsly
**From:** Legal analyst
**Date:** 2026-07-17
**Re:** `legal-review-handoff.md` — new commitments on the pricing page
**Scope:** legal exposure, enforceability, required backing documents (NL law; AVG/GDPR).

> **Not formal legal advice.** This is a structured analysis to make the page and
> the backing documents defensible and internally consistent. Have the *binding*
> documents (algemene voorwaarden, SLA, verwerkersovereenkomst, liability caps)
> signed off by qualified Dutch counsel before they go live — the wording below is
> a solid market-standard starting point, not a substitute for that sign-off.

---

## 0. The one finding that matters most — page vs. contract contradicted each other

The page advertised a **"99,9% uptime-garantie"**. The standing contract that Rinsly
actually signs with clients (`rinsly-offerte` → deel 2, art. 7.1) says the opposite:

> *"Opdrachtnemer spant zich in voor een goede beschikbaarheid … Het betreft een
> inspanningsverplichting; een specifieke ononderbroken beschikbaarheid wordt niet
> gegarandeerd."*

A public "garantie" that your own binding document expressly disclaims is the worst
of both worlds: it exposes you to a misleading-advertising / non-conformity claim
**and** it isn't backed by anything you can honour. This is now fixed on the page
(see §1) and the two documents are consistent again. **Do not re-introduce the word
"garantie" for uptime unless you also build the SLA machinery in §1.**

---

## 1. Go / no-go per claim

| # | Claim (as handed off) | Verdict | Action taken |
|---|---|---|---|
| 1 | `99,9% uptime-garantie` | **NO-GO as worded** | Reworded to a non-binding target (done) |
| 2 | `SLA met gegarandeerde reactietijden` (no number) | **GO** — *conditional on a signed SLA that actually defines the numbers* | Kept on page; numbers stay in the SLA |
| 3 | `Staging-omgeving` | **GO** | Kept |
| 4 | `Security, compliance & verwerkersovereenkomst` | **REWORD** — bare "compliance"/"security" implies a certification you don't hold | Reworded to concrete deliverables (done) |
| 5 | No lock-in / monthly cancellable (FAQ) | **GO** | Matches contract art. 3 — unchanged |
| 6 | Ownership: site + data always the client's (FAQ) | **GO** | Matches contract art. 9 — unchanged |
| 7 | Build "vanaf €2.500 (excl. btw)" (FAQ) | **GO** | "vanaf" + "excl. btw" keeps it an indication, not a binding quote — unchanged |

### Content changes made to `scripts/seed.ts`

| Was | Now (NL / EN) |
|---|---|
| `99,9% uptime-garantie` / `99.9% uptime guarantee` | `Streven naar 99,9% uptime` / `Targeting 99.9% uptime` |
| `Security, compliance & verwerkersovereenkomst` / `… data-processing agreement` | `Verwerkersovereenkomst (AVG) & beveiligingsmaatregelen` / `Data-processing agreement (GDPR) & security measures` |
| `Alle bedragen zijn exclusief 21% btw.` / `All prices exclude 21% VAT.` | `Onze tarieven zijn zakelijk en exclusief 21% btw.` / `Our rates are for business customers and exclude 21% VAT.` |

*(The uptime line was already softened to "Streven naar / Targeting" in the working
tree; that framing is safe and I've kept it. If you prefer signalling the SLA to
enterprise buyers, `99,9% uptime-doelstelling (vastgelegd in SLA)` /
`99.9% uptime target (defined in SLA)` is equally defensible.)*

---

## Q1 — The 99.9% uptime commitment (detail)

Why the bare guarantee was unsafe, and what a lawful version needs:

1. **You cannot guarantee more than your infrastructure gives you.** Cloudflare's
   standard plans and Workers/D1/R2 on non-Enterprise carry **no contractual uptime
   SLA** — a contractual uptime SLA with service credits exists only on Cloudflare
   **Enterprise**. A 99.9% guarantee to your client therefore has no upstream
   backstop. *(Verify against Cloudflare's current terms for your account tier.)*
2. **An unbounded guarantee = open-ended liability.** Without a defined remedy, a
   breach is measured in the client's damages, not in a capped credit.
3. **Under Dutch law the words bind.** A public commitment can be pulled into the
   agreement / read as a conformity promise (B2B: misleading advertising, art. 6:194
   BW; consumers: oneerlijke handelspraktijk, art. 6:193c BW). "Garantie" is a strong
   term and will be read strictly.

**A non-binding target ("streven naar 99,9%") avoids all three and is honest.**

**If you ever want to sell a real guarantee** (enterprise deals), don't put it on the
open page — put it in the signed **SLA annex**, and it must:
- **Scope the measurement window** (e.g. 99.9% measured monthly ≈ ≤ ~43 min/month).
- **Exclude** what you don't control: Cloudflare/provider outages, announced
  scheduled maintenance, force majeure, client-caused issues, third-party
  integrations, DNS/domain problems outside your management.
- **Define a service-credit schedule** as the *sole and exclusive remedy*, with a
  hard cap (see §Liability). Then this annex must **override art. 7.1** for that
  client (art. 7.1 stays the default for everyone else).

---

## Q2 — "Guaranteed response times" (detail)

**Keep it qualitative on the page; keep the numbers in the signed SLA.** That split is
correct and is what's now in place. Response time is defensible to *call* guaranteed
because — unlike uptime — it is entirely within your control and you already commit to
it in the contract (art. 7.3: response within 2 business days; Partner tier ≤ 1
business day).

The signed **SLA must** define:
- **Response ≠ resolution.** Guarantee a *response/acknowledgement* time only; never a
  fix/resolution time.
- **Business hours** (werkuren/werkdagen) and time zone; what counts as "received".
- **Severity levels** (a full outage vs. a cosmetic tweak shouldn't share one SLA).
- **Exclusions** — mirror contract art. 7.4 (announced absence), force majeure.
- **Remedy** if a response target is missed (a credit, not damages).

Keeping the actual minutes/hours off the public page means you can tune them per deal
without changing a published promise.

---

## Q3 — Verwerkersovereenkomst / DPA + the "compliance" claim (detail)

**The template (deel 3) is solid and structurally AVG art. 28-compliant.** It is safe
to advertise that you provide a verwerkersovereenkomst, because you genuinely do.
Coverage check:

| AVG art. 28 requirement | Template |
|---|---|
| Process on documented instructions only | art. 2 ✓ |
| Confidentiality of authorised persons | art. 3 ✓ |
| Security measures (art. 32) | art. 4 ✓ (generic — see fix 2) |
| Sub-processors: authorisation + flow-down + notice | art. 5 ✓ (see fix 1) |
| International transfer basis | art. 6 ✓ (DPF / SCCs) |
| Assist with data-subject rights | art. 7 ✓ |
| Breach notification | art. 8 ✓ (48h — stricter than required) |
| Audit / demonstrate compliance | art. 9 ✓ |
| Return / delete on termination | art. 10 ✓ |
| Description of processing (annex) | Bijlage A ✓ |

**Two improvements before you lean on it with larger buyers:**

1. **Sub-processor objection has no teeth (art. 5.3).** It says you inform the
   controller "so they can object," but sets no notice period and no consequence.
   Art. 28(2) requires a *real* opportunity to object. Suggested replacement:
   > *"Verwerker informeert verwerkingsverantwoordelijke ten minste dertig (30) dagen
   > vóór het inschakelen van een nieuwe subverwerker. Maakt verwerkingsverantwoordelijke
   > binnen die termijn op redelijke gronden schriftelijk bezwaar en kunnen partijen daar
   > niet gezamenlijk uitkomen, dan mag verwerkingsverantwoordelijke de betrokken dienst
   > opzeggen."*
2. **Security measures are generic (art. 4).** For enterprise procurement, reference a
   concrete measures list (encryption in transit; access control + 2FA; logging;
   patch cadence; backup retention + restore testing). Turns art. 32 from an
   assertion into something demonstrable.
3. **Confirm the transfer basis is live.** Keep the "DPF **or** SCCs" fallback (DPF
   has litigation risk); confirm Cloudflare's current DPF certification and that SCCs
   sit in Cloudflare's own DPA as backstop. Note EU-localisation options where a client
   asks for them.

**On advertising "compliance":** NO-GO to imply a certification. You are **not** ISO
27001 / NEN 7510 certified — never state or imply otherwise (misleading advertising).
The feature is now the concrete, truthful `Verwerkersovereenkomst (AVG) &
beveiligingsmaatregelen`.

---

## Q4 — The "security" claim (detail)

Bare "Security" as a feature is a substantiation risk. Reworded. State only what you
actually do: Cloudflare WAF/SSL/TLS, weekly backups, security & CMS updates, uptime
monitoring. Marketing adjectives elsewhere ("snelle, veilige websites") are acceptable
puffery — just don't pair "veilig/secure" with guarantee wording or an unheld
certification.

---

## Q5 — General

- **Algemene voorwaarden — MUST exist and be made available.** Your signed contract
  (deel 2) is good, but for the terms — especially the liability cap — to bind, they
  must be offered *before/at* contracting (terhandstelling, art. 6:233 sub b + 6:234
  BW). Publish an **Algemene Voorwaarden** page and reference it at signing.
- **Privacyverklaring — MISSING and legally required *now*.** The site currently has
  **no privacy policy** (verified across the repo). Your own contact form collects
  name/e-mail/message = personal data, which triggers a mandatory privacy notice at
  collection (art. 13 AVG). This gap exists independently of the pricing changes and
  should be closed before launch. Add a **Privacyverklaring** page, linked from the
  footer and near the contact form.
- **Cookies/analytics.** If the site loads anything beyond strictly-necessary cookies,
  you need consent (Telecommunicatiewet art. 11.7a). Confirm what the frontend loads.
- **Consumer vs B2B.**
  - Op maat = B2B, fine.
  - Lower tiers can reach zzp'ers/consumers. For **consumers**: prices must be shown
    **incl. BTW**; distance contracts carry a **14-day herroepingsrecht** (art. 6:230o
    BW); and the liability cap + exclusive-forum clause are more vulnerable to the
    grijze/zwarte lijst (art. 6:236/6:237 BW). **Mitigation applied:** the pricing
    intro now frames the tariffs as *zakelijk* (B2B), which keeps ex-BTW display and
    the B2B terms appropriate. If you truly want to sell to consumers, show incl-BTW
    and add the consumer disclosures.
- **"vanaf" + "excl. btw"** — compliant for a business audience. "vanaf/from" keeps the
  price an invitation to treat, not a binding quote; fine for both the €499 tier and
  the €2.500 build figure.

---

## Backing documents needed before publishing

| # | Document | Status | Link from the page? |
|---|---|---|---|
| 1 | **Privacyverklaring** | ❌ missing — required now | **Yes** — footer + contact form |
| 2 | **Algemene Voorwaarden** | Contract exists; no public AV | **Yes** — footer (terhandstelling) |
| 3 | **Cookie/consent notice** | Conditional on analytics | If non-essential cookies load |
| 4 | **SLA document** (Op maat) — response numbers, definitions, hours, exclusions | ❌ to draft before selling Op maat SLA | No — provided at contracting |
| 5 | **Service-credit schedule** | Only if a real uptime guarantee is sold | No — SLA annex |
| 6 | **Verwerkersovereenkomst** | ✅ solid; apply the 2 redlines in Q3 | No — provided at contracting |

---

## Liability cap language

Your existing contract art. 11 is a **solid, defensible B2B cap** — keep it: direct
damage only; capped at fees paid in the prior 12 months; excludes indirect/
consequential/lost-revenue and data loss beyond the last backup; carve-out for opzet /
bewuste roekeloosheid. Nothing to change.

**If you add an uptime guarantee**, bound it with a sole-remedy clause in the SLA annex:

> *"Servicecredits vormen de enige en uitsluitende remedie voor het niet halen van de
> uptime-doelstelling. De credits bedragen [X]% van de maandvergoeding per [0,1%] onder
> de doelstelling en bedragen in totaal per maand nooit meer dan [Y]% van de
> maandvergoeding over die maand."*

This converts an open-ended guarantee into a capped, predictable one.

---

## Bottom line

- **Page:** safe to publish **after** the Privacyverklaring and Algemene Voorwaarden
  exist and are linked. The claim wording itself is now defensible.
- **Do not** re-introduce "uptime-garantie" or bare "compliance/security".
- **DPA:** advertisable today; apply the two art. 5 / art. 4 redlines before enterprise
  deals.
- **Before selling the Op maat SLA:** draft the SLA doc (response numbers, exclusions)
  and — only if you guarantee uptime — the service-credit schedule.
