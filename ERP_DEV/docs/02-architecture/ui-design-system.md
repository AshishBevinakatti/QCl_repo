# UI design system — Golden Hills ERP

- Purpose: one reference for the ERP shell, theme tokens, shared components, icon mapping and responsive rules, so new screens stay consistent.
- Audience: frontend developers, reviewers and future maintainers. Owner: project team. Last verified: 2026-10-21. Status: implemented in Unit 3.12; visual review pending user click-through.
- Sources: `03-phases/phase-3/PLAN-3.12-ui-design-system.md`, `02-architecture/adr/ADR-002-ui-design-system.md`, and the user-designated visual reference `billzova-web` (structure only; no Billzova content, logo, purple palette or product data copied).

## Principles

- Keep the Golden Hills text mark and the green/gold palette; Billzova supplies layout language, not brand identity.
- Keep the existing React/CSS architecture. There is no Tailwind, no CSS-in-JS and no component library dependency.
- Use semantic tokens for all presentation colours. Only structural translucency/photo gradients use literal `rgba()` values.
- Preserve functionality, API calls, permissions, labels, table columns, preview honesty and honest empty states.
- Self-host assets: Inter comes from `@fontsource-variable/inter`; icons are local Lucide SVGs. No icon-font CDN.
- Ship both themes from the same component tree; dark mode is a warm neutral variant of the same palette.

## Files and cascade

| File | Responsibility |
|---|---|
| `web/index.html` | `color-scheme` meta and the pre-render theme boot script (`gh-theme`) |
| `web/src/main.tsx` | Imports Inter before the stylesheet, then `index.css` |
| `web/src/index.css` | Entry point that imports the five CSS layers in order |
| `web/src/styles/tokens.css` | Light/dark design tokens, font stack, radii, shell widths, chart colours |
| `web/src/styles/base.css` | Reset, typography, focus, scrollbars, native-control theme details |
| `web/src/styles/layout.css` | App shell, sidebar, header, search, page stack/header and desk grids |
| `web/src/styles/components.css` | Cards/panels, KPI, tables, buttons, forms, badges, alerts, empty states, donut |
| `web/src/styles/screens.css` | Dashboard, rooms, Guests and Ops composition plus screen breakpoints |
| `web/src/theme.ts` | `Theme`, `THEME_KEY`, `storedTheme`, `currentTheme`, `applyTheme`, `toggleTheme` |
| `web/src/ui.tsx` | Shared presentational primitives and the Material-name → Lucide icon wrapper |

`index.css` must import layers in this order: tokens → base → layout → components → screens. Do not re-add legacy CSS below the imports.

## Theme rules

- Theme is selected by `data-theme="light|dark"` on `<html>`. Tokens switch through `:root[data-theme='dark']`.
- Default is **light** unless `localStorage['gh-theme']` is exactly `dark`. There is no system-preference auto-switch.
- `index.html` sets the attribute before React renders to avoid a flash of the wrong theme. `applyTheme()` updates the attribute and persists the choice; `toggleTheme()` reads the current attribute and returns the next theme.
- The header theme button is labelled "Switch to light theme" / "Switch to dark theme" and exposes `aria-pressed`.
- `color-scheme` is set on the root and in the meta tag, so native date pickers, scrollbars and form controls follow the theme.
- Dark mode keeps the same semantic token names. Never branch a component on the theme; use tokens.
- The dashboard hero and promo photos are retained. Their overlay gradients (`--hero-shade`, `--promo-shade`) and `--on-photo` text are theme tokens.

### Token groups

| Group | Examples |
|---|---|
| Surfaces | `--bg`, `--surface`, `--surface-raised`, `--surface-soft`, `--surface-hover`, `--surface-active`, `--input-bg` |
| Text and lines | `--ink`, `--ink-strong`, `--muted`, `--muted-strong`, `--line`, `--line-strong` |
| Brand | `--brand`, `--brand-dark`, `--brand-soft`, `--brand-ink`, `--gold`, `--gold-soft`, `--gold-ink`, `--on-gold` |
| Status | `--danger`, `--ok`, `--info`, `--neutral` and their `-soft` backgrounds |
| Sidebar | `--sidebar-bg`, `--sidebar-ink`, `--sidebar-muted`, `--sidebar-hover`, `--sidebar-active-bg`, `--sidebar-active-ink`, `--sidebar-border` |
| Feedback | `--focus`, `--ring`, `--overlay`, `--shadow-overlay`, `--scrollbar` |
| Charts | `--chart-available`, `--chart-occupied`, `--chart-maintenance`, `--chart-reserved` |
| Geometry | `--radius-card`, `--radius-control`, `--radius-sm`, `--sidebar-w`, `--sidebar-w-collapsed` |

## Shell

- Desktop sidebar: 264px expanded, 76px collapsed (`--sidebar-w` / `--sidebar-w-collapsed`). The choice persists in `localStorage['gh-sidebar-collapsed']` (`1`/`0`).
- Collapsed sidebar shows the gold `GH` mark, icon-only nav with `title` tooltips, and the mode control in one column.
- Sidebar contains the text mark, Live/Preview segmented control, role-gated nav, user block, Settings and Login/Logout.
- At `≤900px` the sidebar becomes a fixed drawer (max 300px). Opening it locks body scroll, focuses the close button, closes on Escape/backdrop/nav selection and restores focus to the trigger. There is no full focus trap yet.
- Header: mobile menu, static context title "Resort operations", date/time, global search, API status, theme toggle and a notification placeholder.
- Screen titles live in `PageHeader`, not in the header. This avoids two competing page titles.
- Global search keeps its debounce/stale-response guard. `Ctrl+K` / `⌘K` focuses it; `Escape` clears and blurs. Results open the existing jump targets.

## Shared components and CSS

- `Card` renders `.card` with an `h3` title; `Panel` styling is `.panel`. Both use a 1px border, 16px radius, surface background and no shadow. Modals are the only strong overlay shadow.
- `PageHeader` renders `.page-header` with an `h1`, optional subtitle and actions. Use it once per screen view.
- `Kpi` renders `.kpi` with a 38px icon tile. Use `tone="brand|gold|info|danger|neutral"`; do not pass hex colours. The legacy optional `tint` prop remains for source compatibility but is not used by current screens.
- `Btn` renders `button.btn`; `ghost` for secondary actions. Height is 40px, radius 12px.
- `Field` wraps `.field`; raw `input`/`select` controls are 40px tall with a focus ring.
- `Badge` uses `.badge` plus `green|amber|red`; `statusTone()` maps the existing backend statuses.
- `Alert` uses `.alert` plus `err|ok|info`.
- `EmptyState` renders `.empty-state` (dashed border, icon chip, title, description, optional action); `Soon` is the honest placeholder built on it.
- `Donut` is dependency-free SVG and accepts token CSS variables as slice colours.
- Table classes: `.tbl` for standard tables, `.dtbl` for dashboard tables, `.tbl-wrap`/`.dtbl-wrap` for overflow. Below 1100px `.dtbl` becomes labelled cards using `data-label`.
- Guest workspace uses the `.guests-*` classes in `screens.css`: page header, search card, master list, sticky profile and modal/bottom sheet.

## Icon mapping

`Icon` keeps the old Material Symbol names at call sites and maps them to Lucide. Unknown names render `CircleHelp` with the requested `data-icon`, so a missing mapping is visible in tests/inspection rather than crashing.

| Material name | Lucide |
|---|---|
| `home` | `LayoutDashboard` |
| `calendar_month` | `CalendarDays` |
| `group` / `groups` | `Users` / `UsersRound` |
| `bed` / `hotel` | `BedDouble` / `Hotel` |
| `swap_horiz` | `ArrowLeftRight` |
| `receipt_long` | `ReceiptText` |
| `build` / `cleaning_services` | `Wrench` / `Sparkles` |
| `bar_chart` / `monitoring` / `monitor_heart` | `BarChart3` / `Activity` / `HeartPulse` |
| `settings` / `logout` / `login` | `Settings` / `LogOut` / `LogIn` |
| `search` / `notifications` | `Search` / `Bell` |
| `arrow_forward` / `arrow_back` | `ArrowRight` / `ArrowLeft` |
| `chevron_left` / `chevron_right` | `ChevronLeft` / `ChevronRight` |
| `close` / `error` / `warning` | `X` / `CircleAlert` / `TriangleAlert` |
| `event_available` / `event_busy` | `CalendarCheck` / `CalendarX` |
| `person` / `person_add` / `person_search` | `User` / `UserPlus` / `UserSearch` |
| `progress_activity` | `LoaderCircle` |
| `workspace_premium` / `badge_check` | `Crown` / `BadgeCheck` |
| `toggle_on` | `ToggleRight` |
| `description` / `dns` / `database` | `FileText` / `Server` / `Database` |
| `history` / `route` / `schedule` | `History` / `Route` / `Clock` |
| `rocket_launch` | `Rocket` |
| `menu` / `sun` / `moon` | `Menu` / `Sun` / `Moon` |

To add an icon: add the Lucide import and mapping entry in `ui.tsx`, use the existing Material-style name at the call site, and extend `ui.test.tsx`. Prefer `size={16}` in dense controls, `18–20` in normal controls, `24` in empty-state/avatar treatments.

## Responsive rules

| Width | Behaviour |
|---|---|
| `>1320px` | Dashboard two columns: main panels + 320px side rail |
| `≤1320px` | Dashboard panels flow in one ordered sequence; rail panels interleave after main panels |
| `≤1200px` | KPI grid 3 columns; header search narrows to 240px |
| `≤1100px` | Guest workspace becomes one column; selected profile comes first; dashboard `.dtbl` tables become labelled cards; empty guest profile is hidden |
| `≤900px` | Sidebar becomes a drawer; menu button appears; search moves to its own header row; banner tag hides |
| `≤760px` | KPI grid 2 columns; guest search button hides (Enter submits); guest rows collapse to two lines |
| `≤640px` | Page header actions can fill the row; mobile title 20px |
| `≤560px` | Guest modal becomes a bottom sheet |
| `≤480px` | KPI grid 1 column |

## Screen structure (3.12)

| View | Page header | Notes |
|---|---|---|
| Dashboard | Dashboard / Today at a glance | Preview note, hero, 5 KPIs, ordered panels, donut, alerts, promo |
| Reservations | Book a room / Check availability and create a booking | Two desk cards |
| Guests | Guests / Find guests… | Search card, results list, sticky profile, create modal |
| Room Management | Rooms / Live room status and availability | Search-inline and room tiles |
| Check-in / Check-out | Front office / Check-in, check-out… | Four desk cards |
| Billing & Payments | Billing / Folios, payments and refunds | Folio and refund cards |
| Service Requests | Service requests / Guest and maintenance requests | Honest "coming soon" empty state |
| Housekeeping | Housekeeping / Room readiness and cleaning tasks | Board table |
| Reports | Reports / Occupancy and revenue reporting | Honest "coming soon" empty state |
| Settings | Settings / Property configuration | Honest "coming soon" empty state |
| Ops Console | Operations console / Read-only Phase 1 | Status pill, tabs, role/Live gates unchanged |

The `page-stack` container is keyed by mode, so switching Live/Preview remounts the views and clears sample data. This preserves the existing signed-out login hints; demo counts must never remain visible in Live.

## Accessibility and verification

- Use real buttons, labels and `aria-*` attributes; do not remove existing labels or table semantics.
- Focus-visible uses `--brand` with a 2px outline; inputs add a 3px `--ring`.
- Active nav uses `aria-current="page"`. The drawer focuses its close control and restores focus on close.
- Verify `scrollWidth <= clientWidth` at 1440/1366/1024/768/390, in both themes.
- Keep tests for theme persistence/toggle and icon mapping; run `npm test -- --run`, `npm run lint`, `npm run build` and `git diff --check`.

## Known limits

- The drawer has no full focus trap (Escape/close/backdrop/focus-return only).
- Theme follows the stored choice, not OS changes after load; there is no cross-tab `storage` listener.
- Ops data/actions remain Live-only and role-gated; preview never invents telemetry.
- Guest stay history, reservations-by-guest filtering and guest email/address remain backend gaps and are not fabricated by the UI.
- External Keycloak login pages are not styled by this system.

## Change history

- 2026-10-21 — Unit 3.12: initial design system, tokens, light/dark themes, shell, Lucide icon layer, all-screen restyle, mode-reset fix, verification.
