# Unit 3.12 Plan — Billzova-aligned UI/UX design system

- Purpose: align the Golden Hills ERP shell, components and screens with the visual system of the user-supplied `billzova-web` project while retaining the Golden Hills logo/text mark and green/gold palette. Audience: user (approver), developers. Last verified: 2026-10-21. Owner: project team.
- Entry: branch `feature/3.12-ui-design-system`, stacked on `feature/3.9-observability-ops-console` because Unit 3.11 is committed but unmerged. No backend, schema, auth, route or data changes.
- Approval: user approved this plan on 2026-10-21 ("approved"), with choices: dark-green collapsible sidebar, Inter + Lucide (no Tailwind), keep and restyle both dashboard images, all screens, light + dark themes.
- Reference: `/run/media/ash_63/DATA/dev/billzova-web` (user-designated visual reference; no Billzova content, logo, purple palette, product features or client data copied). Logged as a user-approved reference in `docs/logs/RESOURCES_LOG.md`.

## Goal
Every ERP screen uses one coherent, responsive visual system: Inter typography, Lucide icons, border-only 16px cards, 40px controls, a 4px spacing rhythm, consistent page headers, tables, badges, empty states and modals. Staff can switch between light and dark themes. All existing functionality, permissions, flows and honest preview/empty states remain unchanged.

## Visual system
| Token/component | Decision |
|---|---|
| Typography | Self-hosted Inter Variable (`@fontsource-variable/inter`); page titles 24px desktop / 20px mobile, card titles 16px, body 14px, labels 12px, hints 11px; tabular numbers |
| Spacing | 4px rhythm; page padding 16px mobile / 24px desktop; stack gap 16px; card padding 20px |
| Grid | KPI 1 / 2 / 5 columns; desk cards 1 / 2 columns; tables become labelled cards below 1100px; guest workspace 1 column below 1100px |
| Cards | 16px radius, 1px border, no shadow, background surface; modal is the only strong shadow |
| Controls | 40px height, 12px radius, green primary, bordered secondary, danger treatment, visible focus ring |
| Tables | 12px uppercase muted headers, 52px rows, row hover, no heavy header fill |
| Badges | Soft tinted pills using green/amber/red/info tokens |
| Icons | `lucide-react` behind the existing `Icon` component, mapping all current Material names; unknown names fall back safely |
| States | Dashed `EmptyState`, honest loading/error/role states, modal bottom sheet at 390px |
| Shell | Dark-green sidebar 264px / 76px collapsed, persistent collapse state, mobile drawer; 64px light header |
| Theme | `data-theme="light|dark"` on `<html>`, persisted in localStorage, pre-render boot script, accessible toggle, `color-scheme` |

## Colour and theme
- Keep the existing light palette: `--bg #f6f4ee`, `--surface #fffdf8`, `--ink #22301f`, `--muted #6b7263`, `--line #e4ddcd`, `--brand #2e5d3a`, `--brand-dark #1f4228`, `--gold #b98a2f`, `--danger #b3261e`, `--ok #2e7d32`.
- Add derived semantic tokens for hover/selected/soft tints, focus rings, overlays, chart slices and modal shadows; no hardcoded colours remain in CSS or TSX presentation values.
- Dark mode uses warm near-black surfaces with lighter green/gold accents. It is a derived variant of the same palette, not a new brand palette. Native controls declare `color-scheme`.
- Dashboard banner and promo photographs are retained; their gradient overlays and text colours become theme tokens.
- Default theme is light unless a stored preference exists. The toggle stores `light`/`dark` and updates the root attribute; an inline boot script prevents a flash of the wrong theme.

## In scope
1. **Foundation**: add Inter + Lucide; split CSS into tokens/base/layout/components/screens layers while preserving existing class names; extend `ui.tsx` with `PageHeader`, `EmptyState`, icon-chip and card-head helpers; rebuild `Icon` as a Lucide mapping; remove the Material Symbols link after full mapping.
2. **Theme system**: semantic light/dark tokens, all hardcoded colours tokenised, persisted theme helper, header toggle, pre-render boot script.
3. **Shell**: collapsible dark-green sidebar with nav icons, soft-gold active state, Live/Preview segmented control, user block, Settings/Logout, mobile drawer; header with page title, search results, API status, date/time, notification placeholder and theme toggle.
4. **Dashboard**: restyle the retained banner and promo; 5-KPI responsive grid with icon tiles; consistent panels; arrivals/departures/recent/in-house tables; donut and legend; alerts and quick actions. All check-in/out, advance and folio behaviour unchanged.
5. **Guests**: page header, search card, master/detail workspace, rows/avatars/selected state, profile and membership cards, modal and bottom sheet. All search/create/duplicate/enrol/redeem/global-jump behaviour unchanged.
6. **Reservations, Front office, Billing, Housekeeping, Rooms**: page headers, standard card/table/form/badge styles, room status tiles. No handler or data changes.
7. **Ops console**: page header and status, segmented tabs, KPI/table/JSON styling; role gates unchanged.
8. **Placeholders**: PageHeader + honest dashed EmptyState; no invented data.

## Out of scope
- Backend, schema, migrations, API contracts, auth, roles, routes, state machines, business rules and fixtures.
- New product features, screens, fake rows, invented copy or telemetry.
- Tailwind CSS; the existing CSS architecture is retained to reduce regression risk.
- Copying Billzova's logo, purple palette, POS/desktop links, notifications data, support FAB, charts or product content.
- Styling the external Keycloak login page.
- Committing, merging, tagging or pushing without explicit approval.

## Functionality-preservation contract
- `web/src/api.ts`, `auth.ts`, `demo.ts`, backend and all data flows are not edited.
- Event handlers, request payloads, debounce/stale guards, `disabled` states, `aria-*`, labels, table column order and conditional rendering remain intact.
- Shared export signatures (`Card`, `Alert`, `Field`, `Btn`, `Stat`, `Badge`, `Icon`, `Soon`, `Kpi`, `Donut`) remain compatible.
- UI changes are limited to presentation wrappers, classes, icons, theme attributes and new shared presentational helpers.
- Existing 12 tests remain unchanged and must pass. Add focused tests for theme persistence and icon mapping coverage.
- Preview mode stays honest; Ops remains read-only and role-gated.

## Screens and states
- **Shell**: expanded/collapsed, mobile drawer open/closed, search idle/loading/results/no-results/error, API up/down, authenticated/unauthenticated, light/dark.
- **Dashboard**: loading/denied/error, preview, empty arrivals/departures/bookings/in-house/alerts, action-in-progress and result messages.
- **Guests**: initial load, debounced search, pagination, no results, selected/unselected, profile/member loading/error, role-restricted actions, create duplicate/success, modal keyboard/overlay close.
- **Desk screens**: preview/live, loading/error/denied, empty tables/lists, success/error alerts.
- **Ops**: preview-only notice, signed-out, forbidden, loading, empty and populated tabs.
- **Placeholders**: unchanged honest "coming soon" copy in the new state component.

## Tests and verification
- `npm test -- --run`, `npm run lint`, `npm run build`, `git diff --check`.
- New tests: theme default/persistence/toggle; icon-name mapping and fallback.
- Live verification at 1440 / 1366 / 1024 / 768 / 390 in light and dark: every nav view, preview and live, global search jump, guest modal (Escape/backdrop/focus), Ops role gate, theme persistence.
- Automated overflow checks (`scrollWidth <= clientWidth`) and console-error checks; screenshots for review.
- Controlled demo actions only where needed; reset the reception fixture afterwards.
- Restart the Vite stack after edits because `/run/media` HMR is unreliable.

## Docs to update
- This plan and `docs/02-architecture/adr/ADR-002-ui-design-system.md`.
- New `docs/02-architecture/ui-design-system.md` (purpose, tokens, components, theme rules, icon mapping, responsive rules, usage guidance).
- `docs/02-architecture/screens.md` if screen structure/headings change materially.
- ERP-03/04/05 module docs only for visible structure changes; no business rules change.
- `docs/logs/RESOURCES_LOG.md`, `DECISIONS.md`, `DEVLOG.md`, `STATE.md`; `docs/README.md` index.

## Risks
- Broad CSS changes can regress dense dashboard/table layouts; verify every breakpoint and keep old selectors.
- Inter changes text metrics and may wrap the dashboard status badge or table columns; recheck at 1366 and adjust widths.
- Dark mode can expose hardcoded colours and contrast failures; tokenise all colours and check both themes.
- Icon mapping can omit a used Material name; add coverage test and fallback.
- Collapsible/mobile navigation can hide controls; keyboard/ARIA checks and drawer focus handling required.
- Stacked branch has unmerged 3.11 work; no rebase or merge, and no interference with its commits.

## Delivery slices
1. Plan/ADR/branch and dependency install.
2. Tokens, Inter, Lucide mapping, shared primitives, theme boot/helper.
3. Shell and navigation.
4. Dashboard.
5. Guests.
6. Reservations, Front office, Billing, Housekeeping, Rooms.
7. Ops console and placeholders.
8. Full tests, live verification, docs/logs, present for commit.

## Definition of done
- All screens use the new visual system in light and dark themes without horizontal overflow at the verified widths.
- Existing functions, permissions, API calls, preview honesty and tests still work.
- Tests, lint and build are green; screenshots and evidence captured.
- Docs, ADR, logs and STATE updated.
- Commit awaits explicit user approval; no merge or push.
