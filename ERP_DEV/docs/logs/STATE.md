# Project State
Updated: 2026-11-16T18:52:00+05:30
Phase: 1. Work unit: **Gold Membership increment (SOW ERP-05)**, plan approved 2026-11-16 (`docs/03-phases/phase-1/inc-membership-PLAN.md`, D-116…D-125, Q-030…Q-037). Runs before increment 2 (leads).
Branch: `feature/phase1-membership` (from `feature/phase1-fresh-start` @ f22f828). Pushing to origin/feature/phase1-membership upon user approval.

Done:
1. S0 housekeeping: commits 9a58edb (mobile/HTTPS), 4dee064 (role cards + Employees UI), 4772b89 (landing page = Ritvik 2c164d9 + local map fix; an unfinished merge from 16 Nov 00:04 was dropped with `git merge --quit`), f22f828 (logs). Hard delete reverted (D-125).
2. S0b one public origin split by path (D-124): committed 97c5e0c; ngrok now → :8088.
3. S1 membership core + S2 gateway routes/upload limit + live realm permissions: committed 4267d1b (V2 migration applied to dev DB).
4. S5 staff ERP Memberships screen: committed 4da643a.
5. S3 committed (f9be13b, 6044e6b) and LIVE: gh-guests imported with the extension, guests.provision on live gh-staff, guest_db created, guest-service running on :8092.
6. S4 committed (dff8b5c).
7. S6 committed (7b8da30).
8. Stack restart & runner scripts created: `run-access-service.ps1`, `run-api-gateway.ps1`, `run-landing-page.ps1`. All backend and frontend services live and verified healthy behind Caddy (:8088) and ngrok tunnel.
9. Increment report drafted: `docs/03-phases/phase-1/inc-membership-REPORT.md`.

Next action:
1. Ashish: run live S7 checklist in `inc-membership-REPORT.md` §3 on phone with own inbox.
2. Record results in DEVLOG + TRACEABILITY (REQ-MEM-008/009), close increment, and ask whether to continue with increment 2 (leads).

Running locally: compose postgres (5433), keycloak (8081 with gh-guests + extension), redis, mailpit, proxy (:8088); guest-service :8092; access-service :8091; api-gateway :8082; web :5173; landing :3000; ngrok → :8088 (`https://weaponless-bertie-hyperorganically.ngrok-free.dev`).
Caveats: `skills-lock.json` is untracked on purpose.
