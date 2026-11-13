# Project State
Updated: 2026-11-14T02:40:00+05:30
Phase: 3 – Core Development      Work unit: 3.16 ERP web frontend redesign (presentation only)
Branch: `ashish/backend_phase_1`. Remote `origin` = https://github.com/AshishBevinakatti/QCl_repo.git.
Approval: user asked to "redesign the whole erp_dev frontend ... preserving all the backend logics and connections" on 2026-11-14, and approved the two substantive calls before work began (list-first front office/billing; room board replaces the dashboard's photo band).

State:
1. Units 3.14 and 3.15 remain committed and pushed to `origin/ashish/backend_phase_1`.
2. Unit 3.16 redesigns `ERP_DEV/web` presentation only. Five stylesheets rebuilt on one warm neutral ramp with a single brass accent; `ui.tsx` primitives reworked (`Stat`, `KeyTag`, `ShareBar`, `statusLabel` replace `Kpi` and `Donut`); copy, markup and layout updated in `dashboard.tsx`, `App.tsx`, `leads.tsx`, `guests.tsx`, `SignIn.tsx`, `ops/OpsView.tsx`.
3. Backend untouched: no change to any `services/` module, and none to `auth.ts`, `access.ts`, `observability.ts`, `theme.ts` or `demo.ts`. Every fetch, permission gate, idempotency key and error path in `api.ts` is unchanged; the only edit there is the display formatter `rupees()`, which now renders a credit as `-₹3,000` instead of `₹-3,000`.
4. Verified: `tsc -b` clean, `vitest run` 43/43 across 6 files, `vite build` succeeds, `oxlint` 0 errors (9 pre-existing warnings). Rendered at 1440x980 light and dark and at 390px via Playwright against the dev server in Preview mode.
5. Four test assertions were updated to the new copy; they pinned old strings and are listed in the DEVLOG entry for 2026-11-14.
6. Palette and type now come from the public site: cream/chalk/limestone/garden/forest/brass/ink from `landing-page/src/app/tokens.css`, and General Sans self-hosted in `web/public/fonts/general-sans/` (400/500/600) for headings, with Inter for all body text, labels, tables and figures.
7. The staff sign-in is composed like the public guest portal — property on the left, door on the right — with the real light wordmark, a brass kicker, a display headline and three lines naming shipped screens. It carries **no credential fields**: staff auth is Keycloak PKCE, so the password is only ever typed on the identity provider, and the panel's action is "Continue to single sign-on". Google/Apple were omitted as instructed. The hero footer reports the real `authReachable()` state rather than a security claim. The seven dev role tiles fold away behind a disclosure. `banner.jpg` (1.76 MB) is in use again as the hero and now sits on the first-paint path — resize before go-live.
8. Three dark/light theme bugs fixed: `--muted` failed WCAG AA at small sizes in light mode (18 measured failures, 3.63-4.32:1 against 4.5:1); the selected filter/tab segment was 1.03:1 against its track in dark mode; and first visit ignored the device's `prefers-color-scheme`. Contrast re-measured across 8 screens in both themes — 0 failures. Test count is now 45/45.

Not verified:
- Live mode. There is no database or backend on this machine, so only Preview (sample data) was exercised.
- The Ops console screen. No preview persona carries the `ops` permission, so it could not be rendered; it is covered by `OpsView.test.tsx` only.

Next action:
1. Ask the user to confirm Q-018 (brand values taken from `landing-page/src/app/tokens.css`, since the resource drive was not mounted) and Q-019 (no marketing copy or hero photo on the staff dashboard).
2. Review the diff with the user and ask before committing (Rule 7). Nothing from unit 3.16 is committed.
3. On a machine with the backend up, re-check every redesigned screen in Live mode, and render the Ops console with a persona that has `ops`.
