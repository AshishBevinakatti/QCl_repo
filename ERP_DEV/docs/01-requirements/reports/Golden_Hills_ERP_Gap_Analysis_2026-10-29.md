# Golden Hills Resort ERP — Client Requirements & Gap Analysis

- **Version:** 0.1 — internal draft for review
- **Date:** 29 October 2026
- **Prepared for:** Internal review — project owner
- **Prepared by:** QuantumCLK Technologies — project team
- **Basis:** SOW, landing-page checklist, discovery call summary and transcript, derived SRS, current project baseline and build
- **Companion PDF:** `Golden_Hills_ERP_Gap_Analysis_2026-10-29.pdf` (9 pages)

> Internal draft — for review. This is not a substitute for the SOW or an approved Change Request. Commercial terms are not confirmed.

---

## 1. Executive summary

The 28 October discovery call gives us a much clearer picture of the resort and what the client wants. It is a strong input, but it is **not yet an approved requirements baseline**. Several commercial rules are unclear or contradictory, and the requested scope is significantly larger than the current CORE-only plan.

> **Bottom line:** Keep the CORE baseline, formalise the new asks as Change Requests, and ask the client for the P0 decisions before building any schema-heavy feature. Do not treat the discovery call as approval.

### Six things to take away

1. **The property facts are clear.** 36 keys in four categories, including a 10–12 bed dormitory, about 90 staff, a full F&B and facilities list, 1 RFID terminal and 100 cards, check-in 12:00, no overbooking and a GM override.
2. **The commercial rules are not.** Rates are indicative only. GST, advance, cancellation, promos, membership points and the RFID deposit need written confirmation before they become business rules.
3. **The scope is bigger than the current plan.** Website, dining, HRMS, WhatsApp, events, day-out and a guest QR portal are outside the CORE baseline. Each needs a decision, a Change Request and a quote.
4. **The current build is partial, not wasted.** Booking, front office, guest CRM, membership and billing have a working core; housekeeping and reporting are partial. Website, OTA, RFID, facilities, maintenance, dining, HR and WhatsApp are not built.
5. **The biggest technical gaps are billing and product modelling.** Per-line GST, split/department invoices, cashier day-close, rate and meal-plan rules, room content, guest ID and events/day-out are not in the current schema.
6. **The next step is a written re-baseline, not more code.** Confirm scope, collect the P0 inputs, update requirements and Change Requests, then re-plan Phase 3/4 and the timeline.

---

## 2. What the client told us — and how sure we are

Use the confidence level, not just the statement. The transcript is the primary text source; the summary is a guide. A 13-page derived SRS dated 29 October is also in the resource folder; it is treated as a draft interpretation, not client approval.

| Use now — high confidence | Confirm before use — medium | Do not build yet — low / conflicting |
|---|---|---|
| 36 keys: 19 Premium (14 queen, 5 twin), 1 Suite, 12 Wooden Cottages, 4 Private Pool Cottages | Indicative tariffs: Premium ~Rs 5,000; Suite ~Rs 7,000; Wooden ~Rs 6,000; Private Pool ~Rs 12,000 | Cancellation/no-show tiers |
| Dormitory: 10–12 bunk beds within the wooden-cottage zone (purpose to confirm) | Extra bed/person: Rs 500–600 | GST mapping (5 / 12 / 18) |
| About 90 employees | Meal plans: room-only / +breakfast / +breakfast+lunch | Promo/agent policy (“not allowed” vs “applicable”) |
| Restaurant, resto-bar, courtyard café, room service | Occupancy: 2, some 2+1 | Day-out package |
| Party/banquet hall, conference hall, open lawn; capacities 100 / 300 / 500 | Advance: 100% mentioned; 50% unclear | Inspection rule (“no need” vs “yes, GM”) |
| Spa, gym, pool/kids pool, rain dance, indoor games, zip line, sky cycling, river walk, kids garden, sightseeing | Event capacities and packages | WhatsApp enquiry |
| 1 RFID terminal + 100 cards | Membership points examples | Accounting integration |
| Check-in 12:00; check-out 11:00 (confirm AM) | Opening: Dec–Jan or Apr–May | RFID door scope and card deposit |
| No overbooking; GM override | Brand direction: gold/green discussed, not approved | Waitlist |
| ID: Aadhaar or driving licence | | Dormitory purpose; check-out AM/PM |

> **A note on the supplied summary:** The summary is a useful agenda, but it overstates waitlist, promo codes, 50% advance, 0–100% cancellation, inspection, day-out, WhatsApp enquiry and accounting integration. Where the summary and transcript disagree, the transcript wins; where the transcript is garbled, we ask.

> **New input — a derived SRS:** A 13-page SRS dated 29 October is in the resource folder. It claims 100% grounding in the same audio and proposes GST (12/5/0), cancellation (>48h / 24–48h / <24h), January go-live, Ozone RFID and no Tally/Zoho. It is not client-signed and conflicts with the transcript on go-live. Treat it as a draft, not approval.

---

## 3. Where we are against the SOW

The SOW defines 14 modules plus facilities, housekeeping and maintenance. The current baseline covers ERP-02…09 plus lite operations.

| Module | What it covers | Status |
|---|---|---|
| ERP-01 Website & CMS | Luxury site, CMS, room/package content, enquiry, direct booking | Not started |
| ERP-02 Booking | Availability, rates, holds, bookings, cancellation, advance | Built — core |
| ERP-03 Front Office | Check-in/out, walk-in, room transfer, arrivals/departures | Built — core |
| ERP-04 Guest CRM | Profiles, history, search, merge, Guest 360 | Built — core |
| ERP-05 Membership | Tiers, points, renewal, adjustments | Built — core |
| ERP-06 RFID | Cards, access verification, terminal, logs | Not built |
| ERP-07 Billing | Folio, payments, invoices, refunds, reconciliation | Built — core |
| ERP-08 Admin & Reporting | Roles, config, audit, dashboards, reports, exports | Partial |
| ERP-09 OTA | Channel inventory push and reservation import | Not built |
| ERP-10 Guest Portal | QR compendium, information, assistance requests | Not built |
| ERP-11 Dining | Menu, table, order, kitchen, room service, folio posting | Not built |
| ERP-12 WhatsApp | Confirmations, reminders, campaigns, templates | Not built |
| ERP-13 Review | Feedback, ratings, coupons, promotions | Not built |
| ERP-14 HRMS | Employees, departments, attendance, shifts, leave | Not built |
| Facilities (SOW §18) | Spa, pool, gym, activities, eligibility, usage, charges | Not built |
| Housekeeping (SOW §19) | Tasks, room readiness, supervisor view, reports | Partial |
| Maintenance (SOW §20) | Requests, priority, assignment, SLA, history | Not built |

**Read this honestly:** 5 of 14 modules have a working core, ERP-08 is partial, and 8 modules have no build. Housekeeping is partial; facilities and maintenance are not built. The current demo data is placeholder: 30 rooms, 3 categories (Deluxe/Suite/Villa), 12% tax, an assumed role set and the WELCOME10 promo.

---

## 4. The six gaps that matter most

### 4.1 Website decision

The SOW lists ERP-01 as CORE. The landing checklist says website requirements are separate from the ERP. You previously said the website is ready (Q-008). The call treats it as to-be-built. We cannot plan booking integration until this is resolved.

**What we need:** Decide: build, integrate, or leave out of this contract. If it exists, provide the URL, code, hosting, domain and booking handoff.

### 4.2 Commercial rules

Rates, GST, advance, cancellation, promos, membership points and the RFID deposit are all unclear or contradictory. We can only ship placeholders until the client confirms them in writing.

**What we need:** Get a signed rate card, tax treatment, payment terms, cancellation policy, promo/agent policy and membership rules.

### 4.3 Billing and GST

The current invoice stores one tax amount at 12%. The client needs per-service GST (5/12/18), GSTIN and invoice fields, department-wise invoices, cashier shift handover and day-close reconciliation.

**What we need:** Confirm the GST mapping and invoice format. Then extend the schema and invoice PDF.

### 4.4 Rate and meal-plan engine

The current model is a base price plus a weekend multiplier. The client needs seasons, weekday/weekend, occupancy, extra bed, meal plans and segment rates (member/corporate/agent/OTA).

**What we need:** Get the rate card and rules. Redesign the rate model before expanding booking.

### 4.5 Add-on modules

Dining, HRMS, WhatsApp, events, day-out and the guest QR portal are outside the CORE baseline. They are real asks, but they are not approved scope and not quoted.

**What we need:** Decide which are in the MVP. Create CRs, feature flags and separate estimates. Do not build them inside CORE.

### 4.6 Operations and reporting

Reports are partial; maintenance, facilities, RFID and OTA are not built. The client also asked for a parking report, lost & found, minibar, VIP handling and maintenance SLAs.

**What we need:** Finish the CORE operations gaps before adding new modules. Confirm the report list and KPIs.

---

## 5. What we need from the client — P0

These decisions block the baseline, the commercial quote or the data model. We should not guess them.

P0 is deliberately short. If we get these thirteen answers and the supporting documents, we can re-baseline the project and quote the new work honestly. Everything else can follow in P1/P2.

| # | Decision or input | Why it blocks us |
|---|---|---|
| 1 | **Scope and go-live.** Which modules are in the MVP, which are later, and what is the fixed opening/UAT date? | Baseline, quote and timeline. The current baseline is CORE-only; the call asks for much more. |
| 2 | **Website.** Build new, or integrate an existing site? If it exists, provide URL, code, hosting, domain and booking handoff. | ERP-01 has no requirements or traceability. The current “website is ready” assumption is unverified. |
| 3 | **Rate card.** Category, season, weekday/weekend, occupancy, extra bed, meal plans, child policy, taxes inclusive/exclusive. | Pricing engine, booking, invoices and website. Current data is 30 rooms, 3 categories, base + 20% weekend. |
| 4 | **GST and invoice.** Rate per service, GSTIN, invoice format, place of supply, service charge, e-invoice. | Billing schema and compliant invoices. The SRS proposes 12/5/0; current model is one 12% tax amount. |
| 5 | **Advance and payment.** 100% or 50%, by channel/segment; gateway/merchant; deposit rules. | Booking confirmation and payment flow. Current default is 30%. |
| 6 | **Cancellation and refund.** Exact tiers by window/channel/segment, no-show, modification, early/late charges. | Booking, billing, refunds and website T&Cs. The SRS proposes >48h / 24–48h / <24h; current default is free ≥48h, else one night. |
| 7 | **Promo, agent and OTA policy.** Allowed or not? Agent logins/commission? Which OTAs and credentials? | Booking, OTA and website. Current promo is WELCOME10; the call says promos/agents may not be allowed. |
| 8 | **Membership.** Plan names/fees/validity/benefits, points earn/redeem, tiers, family/gifting, card deposit. | ERP-05 and RFID. Current tiers and points are assumed. |
| 9 | **RFID.** Room doors or membership/facility only? Lock vendor/model/API, zones, card allocation, deposit, offline behaviour. | ERP-06 and Phase 4. The SRS says Ozone door locks; hardware is not procured. Current design is membership/facility access. |
| 10 | **Events and banquet.** In scope? Venue names/capacities, packages, pricing, enquiry/booking, catering, cancellation. | New module/CR. SOW only lists banquet spaces as facilities, not event management. |
| 11 | **Day-out.** Does a day-out product exist? Price, inclusions, timing, capacity, booking and cancellation. | New module/CR. The call says “we don't have” and then describes Rs 1,000 inclusions. |
| 12 | **Accounting.** Is integration required? Which software and export format? (The SOW excludes it.) | Billing/export scope. The SRS excludes Tally/Zoho; the call says “existing accounting” and then “no”. |
| 13 | **Opening date and brand.** Fixed opening date; logo, colours, fonts and guidelines. | Timeline, UI and website. The SRS says January (from December); the call says Dec–Jan or Apr–May. No approved palette. |

### Ten quick confirmations

- Check-out is **11:00 AM**, not 11:00 PM?
- The dormitory is for **guests** or **staff**?
- The property is **Golden Hills Resort**?
- Is **waitlist** actually required?
- Is **room inspection** mandatory before “ready”, and who inspects?
- Does a **day-out** product exist?
- Is **WhatsApp enquiry** required, or booking only?
- Are **promo codes / agent rates** allowed?
- Is **pool access** controlled, or open to all guests?
- Is **accounting integration** required?

---

## 6. What we need — P1, P2 and P3

P1 unblocks design and build. P2 is content and configuration. P3 is later or optional.

### P1 — design and build inputs

| # | Input | Area |
|---|---|---|
| 1 | Room inventory and content: room numbers, category mapping, bed types, capacity, size, view, amenities, images, accessible/interconnecting, dorm purpose. | Booking / website |
| 2 | F&B outlets and menus: names, cuisines, hours, prices/tax, breakfast/buffet, room service, laundry price list. | Dining / website |
| 3 | Facilities catalogue: spa menu/prices/therapists, gym, pool, rain dance, games, zip line, sky cycling, river walk, kids garden, sightseeing; hours, capacity, charges, eligibility, cancellation. | Facilities |
| 4 | Housekeeping rules: inspection, statuses, readiness SLA, assignment, lost & found, minibar, VIP, out-of-order, linen. | Housekeeping |
| 5 | Maintenance SLA: priority matrix, response/resolution targets, escalation, vendors, reopen, preventive, asset register. | Maintenance |
| 6 | Front office policies: early/late, upgrades, walk-in deposit, no-show, day-use, visitor, key issuance, overbooking override limits. | Front office |
| 7 | Guest ID and privacy: which IDs, number/scan, verification, retention, consent, access restrictions. | Guest CRM |
| 8 | Billing operations: split/department invoices, company/agent billing, deposits, payment modes, cashier shifts, day close, refund approvals, invoice numbering. | Billing |
| 9 | Roles and approvals: departments/designations, view/create/edit/approve/export, GM/MD/owner limits, segregation. | Admin / RBAC |
| 10 | Reports and KPIs: exact list, definitions, daily/weekly, parking, formats, scheduled delivery. | Reporting |
| 11 | Notifications: triggers, templates, channels, language, sender IDs, WhatsApp number/provider, SMS/email. | Notifications |
| 12 | OTA: channels, credentials, rate/inventory push, cancellation sync, commission. | OTA |
| 13 | Data migration: existing guest/booking/member/employee data, format, volumes, owner. | Go-live |
| 14 | Devices and infrastructure: desktops/tablets/phones, printers/KOT, cash drawer, scanners, network, power, hosting preference. | Deployment |
| 15 | UAT and training: representatives, dates, batches, language, location. | Phase 6/8 |

### P2 — content and assets before website/go-live

- Brand assets: original logo PNG, light/dark variants, favicon, HEX colours, fonts, guidelines.
- Website content: tagline, 50–100-word description, About, USPs, address, attractions/distances, pages, CTAs, SEO keywords, analytics, Maps/social links.
- Photos and videos: every room category, facilities, dining, events, spa; high-resolution and usage rights.
- Offers: active list, validity, eligibility, T&Cs, blackout, stacking, online applicability, redemption process.
- Policies and legal: cancellation, refund, booking T&Cs, privacy, child, pet, extra bed, ID, payment terms.
- Contact details: phone, WhatsApp, email, postal address, Google Maps/Business, Instagram/Facebook/YouTube.
- Event collateral: venue names/capacities/layouts, packages, decoration/catering options, contact.
- Menu PDFs, F&B photos, restaurant/interior photos, bar/lounge details.
- Parking: capacity, valet, charges, report requirement.
- Staff list/departments for RBAC/HRMS (names/roles only, no passwords).
- Membership card design/artwork; RFID card branding.
- Sample forms: registration card, invoice, HK status sheet, maintenance register, event contract.

### P3 — later or optional

- Review/feedback (ERP-13): in scope? rating, categories, coupons?
- Guest portal content (ERP-10): compendium, attractions, contacts, assistance categories.
- WhatsApp campaigns/templates (ERP-12): triggers, opt-in, language, provider.
- HRMS (ERP-14): attendance method/biometric, shift rules, leave policy, overtime.
- Multi-property/expansion plans; AMC/support SLA expectations.

> **Ask for these documents with the questionnaire:** Tariff/rate card and seasonal calendar · cancellation/refund/no-show policy · booking T&Cs and privacy policy · sample GST invoice and GSTIN · guest registration form · HK status sheet and maintenance register · event/banquet brochure · menu PDFs and laundry price list · membership plan brochure and card artwork · RFID door-lock model/API · OTA/payment/WhatsApp contracts and credentials · brand guidelines, logo and photo library · org chart/roles matrix · sample reports · existing data extracts.

---

## 7. Conflicts we must not guess

These are the places where the documents or the call disagree. We should log them as questions, not silently choose.

| Topic | What we heard | Why it matters |
|---|---|---|
| Website | SOW says CORE; landing checklist says separate; you said ready; the call says to-be-built. | Build vs integrate; booking handoff. |
| Scope | SOW covers ERP-01…14; the confirmed baseline is CORE-only; the call asks for the full platform. | Baseline, quote and timeline. |
| Promos / agents | “Promotion codes are not allowed” vs “OTA corporate agent rates are applicable”. | Remove or build the promo/agent engine. |
| Inspection | “Inspection, no need” vs “yes … GM”. | Housekeeping ready rule. |
| Day-out | “We don't have a day out package” vs Rs 1,000 inclusions. | New product or not. |
| Advance | Baseline 30%; call says 100%; 50% is unclear. | Booking confirmation and payment. |
| Cancellation | Baseline free ≥48h; call mentions 24/48/72h and 0–100%. | Policy, refunds and website T&Cs. |
| GST | Baseline 12%; call mentions 5/12/18. | Invoice schema and compliance. |
| RFID | SOW says membership/facility access; call says doors. | Hardware, vendor/API and access model. |
| Accounting | SOW excludes it; call says “existing accounting” then “no”. | Integration/export scope. |
| Opening date | Dec–Jan vs Apr–May. | Delivery schedule and UAT. |
| 3-month plan | The summary references Golden_Hills_ERP_3-Month_Plan.md; the file is missing. | Provenance of the plan we are measured against. |
| SRS vs transcript | The SRS says January (postponed from December), GST 12/5/0 and exact cancellation slabs; the transcript says Dec–Jan or Apr–May and is garbled on tax/cancellation. | Do not treat the SRS as client approval. |

---

## 8. Impact and recommended path

### What stays

- 3.13 Guest 360 is valid. Email aligns with the client’s email requirement; ID number/verification is still missing.
- The core booking, front office, guest CRM, membership, billing and housekeeping flows are a sound base.
- Auth, RBAC, audit, the design system and the ops console remain useful.

### What changes

- Seed data: 30 rooms / 3 categories / 12% tax / assumed roles become 36 keys / 4 categories + dorm / confirmed rules.
- Billing: per-line GST, GSTIN/invoice fields, split/department invoices, cashier shift and day close.
- Booking: rate/meal-plan engine, occupancy/extra bed, segment rates, real advance/cancellation and promo policy.
- Roles: the assumed set expands to the client’s departments and approval matrix.
- Phase 4: RFID doors, OTA, gateway and notifications depend on client/vendor inputs.

### Recommended path

| # | Action | Why |
|---|---|---|
| 1 | **Commit 3.13.** | Clean the tree before the re-baseline. This needs your explicit approval. |
| 2 | **Re-baseline the docs.** | Update requirements, decisions, traceability, questions, CRs, risks and resources log; add cleaned extracts. |
| 3 | **Send the P0 questionnaire.** | Ask for the rate card, policies, brand assets and the thirteen decisions. Do not guess. |
| 4 | **Update config/seed (3.14).** | Use confirmed facts only. Keep unresolved values clearly marked as placeholders. |
| 5 | **Finish the CORE gaps.** | Reports/exports, maintenance, facilities, RFID simulator, OTA mock, config UI. |
| 6 | **Quote the add-ons separately.** | Website, dining, HRMS, WhatsApp, events, day-out, guest portal, review. |
| 7 | **Re-plan Phase 3/4 and the timeline.** | After the client answers. Then run the phase gate honestly. |

> **Timeline warning:** A December–January opening against the current CORE-only two-month plan plus the new asks is not credible without re-planning. Confirm the date before committing to a schedule or a fixed price.

---

## 9. Decisions needed from you

These are internal decisions for the project owner, separate from the client questionnaire.

1. **Commit 3.13?** The unit is verified but uncommitted: 29 modified and 5 new files. A clean tree makes the re-baseline safer.
2. **Scope path.** A) Keep CORE and formalise CRs (recommended). B) Expand the MVP and re-plan timeline/commercials. C) Website-first.
3. **Website.** Is ERP-01 ours to build now, or is there an existing site we integrate with?
4. **Re-baseline approval.** Do you approve producing the v2 requirements, CRs and client questionnaire in build mode, docs only?
5. **Client-facing format.** Do you want the P0 questionnaire as a polished one-page document you can send, or internal notes first?
6. **Transcript confidence.** Do you want a re-transcription with a larger model and diarization before treating any commercial detail as settled?

---

## Document control

| Field | Value |
|---|---|
| Document | Golden Hills Resort ERP — Client Requirements & Gap Analysis |
| Version | 0.1 — internal draft for review |
| Date | 29 October 2026 |
| Prepared by | QuantumCLK Technologies — project team |
| Basis | SOW; landing-page checklist; discovery summary and transcript; derived SRS; current requirements, architecture, module docs and build |
| Status | Not approved. Commercial terms are not confirmed. This report does not replace the SOW or an approved Change Request. |

## Sources and confidence

| Source | Use | Confidence / note |
|---|---|---|
| SOW (QuantumCLK_Resort_ERP_SOW.docx) | Module map ERP-01…14, §18–§30, exclusions, phases | Source of truth; §21 tax/posting deliberately left to requirements analysis. |
| Landing-page checklist | Website content and asset requirements | Still unanswered; says website is separate from ERP. |
| Discovery call summary | Agenda/index | Secondary; overstates several points; references a missing 3-month plan. |
| Derived SRS (13 pp, 29 Oct) | Specification of the same call | Claims 100% grounding; not client-signed; conflicts with transcript on go-live and specifics. |
| Transcript (1,060 segments) | Primary text evidence for the call | Auto-transcribed Indian-English, code-switching, no diarization; garbled in places. |
| Audio (61:58 claimed) | Original recording | Hash verified; not listened to; duration/codec not independently verified. |
| Current baseline and build | Requirements, architecture, migrations, code, tests | Describes what is built, not what the client approved. |

> This is an internal draft. It is intended to make the next conversation with the client easier and to prevent us from building commercial rules or scope that the client has not approved. Every unresolved item should become an entry in the open-questions register, and every new scope item should become a Change Request before build.
