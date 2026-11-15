# Development Log (append-only)

History before 2026-11-15 is in `archive/hotel-draft:ERP_DEV/docs/logs/DEVLOG.md`.

## 2026-11-15 — Audit of phase1_plan.md v1.0 and fresh start
- Ashish asked for an audit of his `phase1_plan.md`. The findings (custom OTP brute-force risk, plain-text OTP, account enumeration, the hard-coded JWT fallback secret in the archived `JwtTokenService`, double-booking, IDOR on proofs, claim race, plain-text Aadhaar, revenue double count, main-branch cleanup risk) were given in chat and in the session plan file.
- Q: login choice → A (Ashish): keep custom OTP *(later reversed, see below)*. Q: old modules → A: archive on a separate branch and clean main. Q: payment check → A: keep observatory. Q: booking store → A: lead-service + DB guard.
- Ashish then decided to restart: everything archived on a unique branch, a fresh Phase 1 with new docs, the landing page unchanged, the backend rebuilt with the same portal API, the web app rebuilt, merged through a branch. Same tech stack (asked separately).
- Q: push archive? → A: yes. Q: where to commit the WIP? → A: "pull first, then fresh branch only".
- Commands: `git branch archive/hotel-draft 825f3fe`; `git tag -a archive-hotel-draft-2026-11-15`; `git fetch` (origin/main = 825f3fe); `git pull --ff-only` (already up to date); `git push origin archive/hotel-draft archive-hotel-draft-2026-11-15`; checked with `git ls-remote` (825f3fe). `git switch -c feature/phase1-fresh-start`.
- Commit `a40defe` (approved): landing view-on-map icon fix + phase1_plan.md v1.0 + .gitignore for the symlinked node_modules and LibreOffice lock files.
- Q: remove list → A: approved as listed. `git rm` of 322 files; commit `5d220ab` (approved).

## 2026-11-15 — Milestone 1 (docs + skeleton) started
- Ashish's conditions: docs and skeleton only, no app code; review the SOW and requirements first; don't delete local files or `.env`; update CI; show everything before committing or pushing; if the resource drive is missing, say what to mount and wait.
- The resource folder is not at the rule path `/run/media/ash_63/DATA/ERP_Resouce`. It was found at `/run/media/ash_63/DATA/Intership wrok/ERP_Resouce` (same name, 21 files) and used read-only (Q-001).
- Read: Phase 1 Blueprint (all of it), SOW sections §3–§12, §22–§26, discovery call summary, the questionnaire (blank form), and greps of the call transcript. Extracts with matching sha256 were restored from the archive.
- Conflicts between plan v1.0 and the Blueprint were shown to Ashish (staff login, booking/payment, service shape, roles, missing lead features).
- Q: staff login → A: **Keycloak for employee authentication and account management; follow the Blueprint** (detailed onboarding/login/logout/deactivation spec given). Q: booking/payment → A: **follow the Blueprint** (none in Phase 1). Q: backend shape → A: **Blueprint microservices**. Q: extra Blueprint features → A: **"we will add new feature later"**.
- Checks run: `npm run typecheck` in landing-page → exit 0. `npm run lint` → 4 errors / 7 warnings already present (Q-004). `npm run build` → fails locally only because `landing-page/node_modules` is a symlink outside the project root (Turbopack refuses it); not reproducible in CI with `npm ci`.
- SRS reviewed after the first draft. Added: SMS excluded (Q-007), event enquiry form (Q-008), 8 h shift (Q-019), client designations for the sales role (Q-027), who manages employees (new Q-029), delete reserved for Owner/MD (AUTHENTICATION §7).
- Docs written (uncommitted, for review): see STATE.md item 2.

## 2026-11-15T11:23:40+05:30 — Resource path rule updated (answers Q-001)
- Ashish: "/run/media/ash_63/DATA/Intership wrok/ERP_Resouce: update the rule and read the resources from here, and commit it".
- Updated the path in `AGENTS.md`, `opencode.json` (permission allow-list), `.opencode/skills/erp-prp/SKILL.md`, `references/docs-and-records.md`, `references/phases.md`. The source-extract headers still show the old path, because they record where each file was read at the time; the sha256 values are unchanged.
- Ashish approved the commit of Milestone 1 docs + CI + rule update in the same message. Push not approved.
