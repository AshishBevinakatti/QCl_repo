# ADR-002: UI design-system alignment and light/dark theming

Status: accepted (2026-10-21, approved by user as part of the Unit 3.12 plan)
Context: The ERP frontend had grown organically across dashboard, reception and Ops work: five radii, inconsistent shadows, three header patterns, Material Symbols from a CDN and hardcoded colours. The user asked for the grid, cards, icons, fonts and styling of the supplied `billzova-web` project while retaining the Golden Hills logo/text mark and green/gold palette. The app must keep its custom CSS architecture, all existing functionality and its live/preview honesty.

Options considered:
- A. Add Tailwind CSS 4 and port Billzova utilities wholesale. Pros: closest source parity. Cons: second styling system, build/config churn, high regression risk across dense existing screens.
- B. Port the visual rules into the existing CSS with design tokens, keep class names, add only the font/icon dependencies and implement a theme token layer. Pros: minimal structural churn, safe incremental slices, existing selectors/tests preserved. Cons: manual translation of Billzova utilities.
- C. Restyle only the dashboard. Pros: smallest change. Cons: inconsistent product, fails the all-screens requirement.

Decision:
- Option B. Adopt Billzova's visual language (Inter, Lucide, 16px border-only cards, 40px controls, 4px spacing, muted table headers, dashed empty states, responsive grids, collapsible shell) through tokenised CSS.
- Add `@fontsource-variable/inter` for self-hosted Inter and `lucide-react` for icons. No Tailwind.
- Keep existing shared component exports and class names; rebuild only their presentation. Map the existing Material Symbol names to Lucide inside `Icon` so call sites do not change.
- Add a light/dark theme layer keyed by `data-theme` on `<html>`, persisted in localStorage, with a pre-render boot script to avoid flashes. Dark mode is a derived warm neutral variant of the same green/gold palette, not a second brand.
- Keep billzova-web as a visual reference only; copy no product content, logo, colours or data.

Consequences:
- Good: one coherent design system, safe incremental rollout, no backend/API impact, both themes, existing tests and flows preserved.
- Bad/accepted: manual CSS translation and broad visual QA; two dependencies added; a persisted theme introduces a small client-side boot script.
- Follow-ups: document tokens/components in `docs/02-architecture/ui-design-system.md`; re-verify screenshots at 1440/1366/1024/768/390 in both themes. Reversal: remove the theme attribute/helper and the two dependencies; CSS tokens remain valid for a light-only build.
