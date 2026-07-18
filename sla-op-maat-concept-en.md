# Service Level Agreement (SLA) — Rinsly "Op maat" — DRAFT

> **Draft / starting point, not final legal text.** This SLA belongs to the "Op maat"
> plan and is signed as an annex to the agreement. Have the binding text — in
> particular the service credits and the liability relationship — confirmed by Dutch
> counsel before use. Response times and exclusions are aligned with the general terms
> (art. 7) and the data-processing agreement in the Rinsly offer stack. This English
> version is a courtesy translation; the Dutch text (`sla-op-maat-concept.md`) is the
> one that is signed and prevails in case of conflict.
>
> Do **not** publish these figures on the website — the pricing page stays qualitative
> ("SLA with guaranteed response times", "targeting 99.9% uptime"). The concrete
> numbers belong only here, in the signed document.

**Parties:** Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden, KvK 85578835
("Contractor") and `[Client]` ("Client").
**Belongs to:** the hosting and maintenance agreement concluded between the parties,
"Op maat" plan. In case of conflict the agreement prevails, except where this SLA
expressly departs from it (art. 9).

---

## 1. Definitions

- **Business day / business hours:** Monday–Friday, 09:00–17:00 (Europe/Amsterdam),
  excluding public holidays.
- **Incident received:** the moment an incident report arrives by email
  (`contact@rinsly.com`) or via the agreed channel during business hours; outside
  business hours the next business day at 09:00 counts as the moment received.
- **Response time:** the time between "incident received" and Contractor's first
  substantive reply/acknowledgement. **This is expressly not a resolution time** —
  Contractor guarantees a response, not a fix within the same period.
- **Availability (uptime):** the percentage of the measured period during which the
  production website is reachable, outside the exclusions in article 4.

## 2. Priority levels and response times

| Priority | Description | Guaranteed response time |
|---|---|---|
| **P1 — Critical** | Website fully unreachable or unusable in production | **≤ 4 business hours** |
| **P2 — High** | Major function broken; no reasonable workaround | ≤ 1 business day |
| **P3 — Normal** | Limited impact or workaround available | ≤ 2 business days |
| **P4 — Low** | Cosmetic, question or change request | ≤ 3 business days |

Contractor sets the priority reasonably based on the reported impact and confirms it
with Client where needed. Response times run during business hours only (§1).

## 3. Changes and additional work

Development and change hours within the plan are as agreed in the contract. Work
beyond that is additional work and is carried out under art. 8 of the general terms at
**€ 95 per hour (excl. VAT)**, agreed in advance.

## 4. Availability (uptime)

Contractor **targets 99.9% availability** per calendar month, measured via
Contractor's uptime monitoring.

> **Choice — record what applies to this client:**
>
> **Variant A (standard, best-efforts).** 99.9% is a target. If it is not met,
> Contractor uses reasonable efforts to restore service; there are no service credits.
> *(Consistent with art. 7.1 of the general terms.)*
>
> **Variant B (hard guarantee with credits).** Only include if you actually want to
> sell the guarantee. The service-credit scheme in article 5 then applies and **this
> SLA prevails over art. 7.1** for this client. Make sure your upstream infrastructure
> (Cloudflare plan) supports the guarantee before signing Variant B.

99.9% per month equates to a maximum of roughly **43 minutes** of downtime per month
outside the exclusions.

## 5. Exclusions

The response times and availability do **not** apply to unavailability or delay
resulting from:

- outages, changes or downtime at Cloudflare or other suppliers (art. 6 and 13 of the
  general terms);
- pre-announced scheduled maintenance (§7);
- force majeure;
- acts or omissions of Client or third parties it engages, improper use, or content or
  code supplied by Client;
- integrations with or services of third parties outside Contractor's control;
- domain-registration or DNS problems outside Contractor's control.

## 6. Service credits *(Variant B only)*

- Service credits are the **sole and exclusive remedy** for failing to meet the uptime
  target; they replace damages.
- Credits amount to **`[X]`% of the monthly fee per `[0.1]`%** that measured
  availability falls below 99.9%.
- Credits never exceed **`[Y]`% of the monthly fee** for that month in total.
- On Client's request, credits are set off against a subsequent invoice within `[30]`
  days of the month in question and are not paid out in cash.

## 7. Maintenance

- **Scheduled maintenance** is announced at least `[24]` hours in advance and carried
  out outside business hours where possible; it does not count as downtime.
- **Emergency maintenance** (e.g. a critical security update) may be carried out
  immediately; Contractor informs Client as soon as possible.

## 8. Escalation, reporting and staging

- **Contact / escalation:** `contact@rinsly.com`; escalation contact `[name/phone]`.
- **Staging environment:** changes are tested on a staging environment first where
  meaningful, before going live.
- **Reporting:** on request, or quarterly, Contractor provides an overview of
  incidents, response times and availability.

## 9. Relationship to the agreement and liability

This SLA forms part of the agreement. The **liability limitation in art. 12 of the
general terms remains fully applicable**: total liability is limited to direct damage
and to at most the fee paid in the preceding twelve months, and under Variant B
service credits are the exclusive remedy for uptime within that limit.

## 10. Term

This SLA follows the term and notice period of the underlying agreement (indefinite
term, cancellable monthly with one month's notice — art. 9 of the general terms).

---

### Annex — to complete per client

| Parameter | Value |
|---|---|
| Uptime variant | A (target) / B (guarantee with credits) |
| P1 response time | ≤ 4 business hours |
| Service window | Mon–Fri 09:00–17:00 (Europe/Amsterdam) |
| Uptime target | 99.9% per month |
| Credit per 0.1% below target *(Variant B)* | `[X]` % |
| Maximum credit per month *(Variant B)* | `[Y]` % |
| Scheduled-maintenance notice | `[24]` hours |
| Escalation contact | `[name / phone]` |
| Additional-work rate | € 95 / hour (excl. VAT) |
