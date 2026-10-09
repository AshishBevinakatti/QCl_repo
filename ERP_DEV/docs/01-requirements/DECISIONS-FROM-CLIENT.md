# Decisions from client (Phase 1 register)

- Purpose: every Decision Pack / open question → confirmed / pending / †out-of-scope. Audience: user, architects. Last verified: 2026-10-09. Owner: project team.
- No completed Decision Pack exists in the resource folder (Q-003 open) — so pending items carry `[ASSUMED]` placeholder defaults per Rule 2. A client answer replaces the default (config change, no code change).

## Confirmed (user, chat)
- CORE only for 2-month MVP (ERP-02…ERP-09 + lite facilities/housekeeping/maintenance); ERP-10…14 excluded unless later confirmed + flagged + Change Request. (2026-10-09; closes Q-005 scope part.)
- Team shape 2–4 BE + 2 FE + 1 DevOps + 1 QA (indicative, matches proposal).
- Hosting undecided; RFID hardware not procured → simulator/sandbox path confirmed as interim.

## Pending with assumed defaults (client to confirm via user)
| # | Question | Assumed default used in REQUIREMENTS | SOW ref |
|---|---|---|---|
| D-101 | Room types/count/prices? | Deluxe/Suite/Villa, 30 rooms, base + 20% weekend | §5 |
| D-102 | Hold duration? | 15 min, auto-release | §5 |
| D-103 | Advance to confirm? | 30% | §5 |
| D-104 | Cancellation/refund tiers? | Free ≥48h, else 1-night charge | §5 |
| D-105 | Promo policy? | WELCOME10 10% one-per-booking | §5 |
| D-106 | Check-in/out times? | 12:00 in / 11:00 out | §6 |
| D-107 | Guest identity key? | Phone unique, merge on duplicate | §7 |
| D-108 | Membership tiers/earn/redeem/validity? | Silver/Gold/Platinum; 1pt/Rs100; 100pts=Rs100; 1-yr | §8 |
| D-109 | Tax treatment? | GST 12% single-rate engine, rate-table configurable (SOW §21 final pending) | §21 |
| D-110 | Roles matrix? | SuperAdmin full; Manager approve; Reception bookings/check-in; Membership RFID; Accounts money; Housekeeping tasks (§22 verbs) | §22 |
| D-111 | OTA channels first? | 1 mock + 1 real-style adapter; push every 5 min + on-event, 3 retries | §12 |
| D-112 | Facility hours/capacity/charges? | Config master, closed-blocks, charge-or-benefit per config | §18 |
| D-113 | Gateway provider? | Sandbox adapter now; hosted/tokenised flow; real keys later (client provides) | §10/§24/§29 |
| D-114 | Notification providers/templates? | Adapter + templates + retry/dead-letter; credentials later | §24 |

## † Out of scope (SOW §30 — do not build)
Payroll/statutory HR; accounting-software integration; standalone POS; advanced scheduling; major facility automation; extra RFID terminals/cards beyond 1+100; networking/cabling; domain/hosting/third-party charges unless expressly included. New asks → `CHANGE_REQUESTS.md` entry first.
