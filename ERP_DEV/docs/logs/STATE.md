# Project State
Updated: 2026-11-16T20:30:00+05:30
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

10. Returning sign-in fix (D-127…D-130), UNCOMMITTED. Root cause (D-130): guest-web refused `/silent-check-sso.html`, so keycloak-js hung on every page load and "Sign in" never opened Keycloak. Fixed in realm JSON + LIVE (guest-web redirect URIs; remember-me idle 30 d), `guest-auth.ts` (8 s init timeout, sign-in independent of the check). Also: remember-me on the welcome link, guest_db sign-in record (V2, applied live), clearer sign-in copy, `check-stack.ps1`, `run-guest-service.ps1`. Tests: ActivationFlowIT 6/6, guest-service 12/12, CI realm checks 18/18, landing typecheck/lint/build ✅.

Next action:
1. Ashish: retest on phone/desktop (reload /profile → email → Sign in → password page → card; refresh; sign out and in again), then the rest of `inc-membership-REPORT.md` §3.
2. Claude: ask before commit (proposed: fix(identity) Keycloak/guest-auth D-130 + feat(guest) sign-in record D-128 + chore(dev) scripts/docs); record S7 results; close increment; ask about increment 2.

Running locally: compose postgres (5433), keycloak (8081 with gh-guests + extension), redis, mailpit, proxy (:8088); guest-service :8092; access-service :8091; api-gateway :8082; web :5173; landing :3000; ngrok → 127.0.0.1:8088 (`https://weaponless-bertie-hyperorganically.ngrok-free.dev`).
Caveats: `skills-lock.json` is untracked on purpose.
