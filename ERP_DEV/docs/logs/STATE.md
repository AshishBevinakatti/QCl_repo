# Project State
Updated: 2026-11-12T14:30:21+05:30
Phase: 3 – Core Development      Work unit: 3.13 Guest 360° profile — verified, approved for commit by user
Branch: `feature/3.13-guest-360-profile` (stacked on `feature/3.12-ui-design-system` at `59c2f35`). Remote `origin` = https://github.com/AshishBevinakatti/QCl_repo.git (never pushed).
Commits: `9285648` 3.10 fixture; `6555387` dashboard correction; `f8f719c` 3.11 Guests; `7f2d82d` 3.11 docs; `fb286e9` 3.12 design system; `59c2f35` 3.12 docs. Committing 3.13 per explicit user approval.
Approval: user approved committing 3.13 ("yes commit it") on 2026-11-12. User also confirmed architecture directions for the Landing Page / Lead microservice (microservice model, mock adapters first, guest portal auth on landing page, same ERP webapp for Sales Exec).
Blueprint: consulted `/home/ash_63/Downloads/QuantumCLK_Resort_ERP_Architecture_and_Phase_1_Blueprint.md` per direct user instruction; logged in `RESOURCES_LOG.md` (sha256 `314f7c8e93a25b64a123ae399f1a49420e90f732ab9c51ea87bdf053ca02c6ca`).
Implemented in 3.13: nullable `guest.email` via `V10__guest_email.sql`; bounded `GET /api/v1/guests/{id}/profile` (`GuestProfileDto`/`GuestProfileService`) with membership, active stay, next reservation, latest-20 history, canonical `FolioService.outstanding`, invoice, pending/failed payment indicators, derived alerts/state; guest writes restricted to RECEPTION/MANAGER/SUPERADMIN. Frontend Guest 360 identity header, operational summary, tabs, Front Office/Billing deep links, responsive rows.
Verification: backend 16/16 tests pass (`GuestApiTest` 11 + `GuestProfileApiTest` 5); frontend 26/26 tests pass; `git diff --check` clean.
Data: PostgreSQL Flyway version 10, `guest.email` present, 8 guest rows preserved.
Open items after commit: create new work unit branch for Lead / Guest Portal microservice (`feature/3.14-lead-portal-microservice`); merge 3.13 into develop when user requests.
Next: stage and commit 3.13, then proceed with the lead capture microservice plan implementation.
