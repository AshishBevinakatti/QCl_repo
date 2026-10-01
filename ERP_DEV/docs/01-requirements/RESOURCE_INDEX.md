# Resource Index — what is in the resource folder and who needs it

- Purpose: inventory of `/run/media/ash_63/DATA/ERP_Resouce` (read-only; spelling is the real folder name).
- Audience: user, analysts (Phase 1), designers (Phase 2). Last verified: 2026-10-01. Owner: project team.
- Rule: the folder is the source of truth. Extracts in `source-extracts/` are conveniences; if they differ, the original wins.

## Files present (inventoried 2026-10-01T09:41:03+05:30)

| File | Size | sha256 | What it is | Needed by |
|---|---|---|---|---|
| `QuantumCLK_Resort_ERP_SOW.docx` | 23410 | `2adc277b…e9ceda04` | SOW & functional requirements: modules ERP-01…ERP-14, facilities, housekeeping, RFID quantities, roles, reports, integrations, 9 phases, exclusions | Phase 1 (requirements baseline), all build phases |
| `Golden_Hills_Resort_Landing_Page_Client_Requirements_Updated.docx` | 36161 | `3e8a6ac9…03ff10` | Landing-page content checklist (all items unanswered; notes catalogue + logo reference received) | Phase 1 (website content requirements), ERP-01 |
| `Resort_ERP_Engineering_Playbook.md` | 23466 | `b07c0841…34e8671` | Internal engineering playbook: proposed stack, repo strategy, git workflow (trunk-based), testing, 5 delivery phases, contractual rules | Phase 2 (ADRs, ways of working); conflicts with skill rules logged as Q-001 |
| `resort_erp_tech_stack_proposal.pdf` | 238465 | `2d55dffd…f3556d5c` | Proposed stack: Java 21/Spring Boot, React+TS, PostgreSQL, Kafka, Redis, K8s, Keycloak | Phase 2 (stack ADR — proposal, not a decision) |

(Full hashes in `docs/logs/RESOURCES_LOG.md`. Extracts in `source-extracts/` with matching hashes.)

## Missing — requested, not in the folder (see OPEN_QUESTIONS.md)

| # | Missing item | Why it matters | Asked |
|---|---|---|---|
| M-001 | Client's completed Decision Pack answers (rates, tax treatment, cancellation tiers, roles matrix, DOTW/offer confirmations) | Phase 1 baseline; without it we build on placeholder config | Q-003 |
| M-002 | Resort catalogue + logo reference (landing doc says received, but no copy in folder) | ERP-01 website content | Q-004 |
| M-003 | Branding assets: original logo PNG, brand colors/HEX, fonts, photos, menus, maps links | ERP-01 website/CMS | Q-004 |
| M-004 | `QuantumClk_Freelance_Consultancy_Agreement` (playbook cites Clauses 3.5, 6.5, 7, 12, Annexures A/B) | Contractual obligations, NDA, handover rules | Q-002 |
| M-005 | Sample data, forms/invoices, hardware sheets, OTA/payment/WhatsApp API docs | Phases 1–4 design and integration | Q-003 |
| M-006 | Confirmation of optional add-ons ERP-10…ERP-14 (client wants them or not) | Scope guard (Rule 2) | Q-005 |

## User approval of this inventory
- Status: **approved by user on 2026-10-01** (Phase 0 exit requirement met for the inventory item).
