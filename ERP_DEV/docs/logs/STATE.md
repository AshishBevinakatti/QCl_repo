# Project State
Updated: 2026-10-21T16:50:21+05:30
Phase: 3 – Core Development      Work unit: 3.11 Guests reception workspace + dashboard correction (3.10 fixture/docs included) — committed, awaiting user click-through
Status: three feature commits created on the branch; no merge/push. This DEVLOG/STATE record is committed as a docs follow-up.
Branch: feature/3.9-observability-ops-console. Remote: `origin` = https://github.com/AshishBevinakatti/QCl_repo.git (added 2026-10-21; never pushed/fetched).
Commits: `9285648` test(erp-03) local reception fixture + E2E evidence; `6555387` fix(erp-03) dashboard rebalance; `f8f719c` feat(erp-04) Guests reception workspace.
Last approved by user: 2026-10-21 — three-commit sequence; remote addition instruction. No approval to merge or push.
Demo fixture: 6 Demo guests, 6 reservations (3 in-house, 1 arrival, 1 hold, 1 future), 3 folios/4 captured payments, 3 dirty rooms + open tasks; loaded and verified after removing the enrolment test membership. Local-only; production/UAT remain seed-free.
Live data note: locally created `QA Workspace Guest` (+91-9000000199, no membership/reservations) remains; the user said they will say when to remove it.
Live dashboard (1366): 23 available / 4 occupied / 3 maintenance, 1 arrival, 2 departures, 3 in-house, 3 alerts. Page height 1345px, Recent table 710px, `checked-in` badge 83px in a 99px cell (single line), no horizontal overflow.
Guests workspace: search/select/profile/create/duplicate/enrol/global-jump verified live; responsive screenshots at 1366/1024/390; no horizontal overflow; Escape closes the 390 bottom-sheet modal; no console errors in the create/jump runs.
Verification: web **12/12**, lint exit 0 with pre-existing warnings, build 308 modules green, `git diff --check` clean. Backend unchanged from the 3.10 baseline (71/71).
Key limits: `GET /guests/{id}/stays` is an empty hook; reservations have no guest filter; guest DTO has no email/address. UI shows real fields only.
Next action: user click-through; decide QA-guest removal. Push/merge only on explicit instruction naming the remote/branch.
Servers: RUNNING — backend :8080, management :9091, web :5173, Keycloak :8081 (`infra-keycloak-1`). Launcher PID 210880; log /tmp/opencode/erp-live.log.
Open items: Q-002…Q-004, Q-007…Q-009, Q-012; 3.8 browser click-through; delete stale branch `fix/hide-table-scrollbar` (approval pending); production observability credentials/infra + Sentry DSN absent; springdoc spec lag; audit-retention job pending.
