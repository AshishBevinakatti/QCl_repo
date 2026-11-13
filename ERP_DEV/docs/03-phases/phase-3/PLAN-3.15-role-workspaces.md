# Work Unit Plan 3.15 — Role-based staff workspaces + staff sign-in
**Status:** Approved by user on 2026-11-13 | Implemented 2026-11-13 (see DEVLOG)


## Context
Today every staff member sees all 11 menu tabs, and a housekeeper who clicks Billing gets 403 errors. There is no proper sign-in screen: just a small "Staff log in" button in the sidebar.

You drafted a plan (department cards, an in-app password form, hard-coded role lists in the menu). This is a stronger version, built on what the code already has.

### What the code shows (why the first draft needs changing)
1. **The backend does not protect most screens yet.**
   - Reservations, room categories and the whole front office (check-in/out, arrivals, dashboard) have no role check; any logged-in user can call them (`ReservationController`, `StayController`, `RoomCategoryController`).
   - Many reads have no check either: guest profile, folios, invoices, the housekeeping board.
   - So hiding menu tabs alone is only cosmetic. "Defense in depth" is not true yet.
2. **A role → permission matrix already exists** (`role_permission` table, seeded in V2 + V9, SOW ERP-08), but only the Ops console uses it (`ops/OpsAuthorization.java`). The other controllers use hard-coded `hasAnyAuthority(...)` lists, and the two disagree: the table gives MANAGER no `guests:view`, yet the controllers let MANAGER in everywhere.
3. **The first draft would add a third copy of the rules** (role lists in `NAV`), and it already disagrees with the backend: it shows Sales a "Guest 360" screen, but the backend only lets RECEPTION, MANAGER and SUPERADMIN search guests, so Sales would get 403.
4. **The client never gave a roles matrix.** It is open question Q-003, so by project Rule 2 the matrix must be *configuration with placeholder defaults*, not hard-coded. The `role_permission` table is that configuration.
5. **Roles the draft missed:** MEMBERSHIP (members are enrolled inside the Guests screen); `OPS` vs `OPS_*`; users with more than one role.
6. **No URL router:** screens switch through `go()` / `onJump()` in `App.tsx`. Cross-screen jumps exist (Dashboard → Billing, Guests → Front office, Leads → Guests). The top-bar search calls the guest and reservation APIs, so it needs a guard too.

### Decisions (user, 2026-11-13)
1. Permissions end-to-end: the server enforces `role_permission`, and the UI reads `/api/v1/me`.
2. Sales get view-only Guests (`guests:view`, not `guests:edit`).
3. Sign-in uses Keycloak's hosted page plus dev-only department tiles (`loginHint`). No in-app password form.
4. The "Preview as" persona switcher exists in dev builds only; production always requires sign-in.

## The plan in simple words

### Slice A — One permission list, enforced by the server (erp-app)
- **Problem:** the rules live in 3 places (DB table, controller annotations, UI), and the backend leaves many screens open.
- **Fix:**
  1. Make `auth/Permissions` (bean `perm`) out of today's `OpsAuthorization` logic (roles from token → permissions from `role_permission`; SUPERADMIN = `*`). Ops annotations switch to `@perm.has(...)`.
  2. Add `GET /api/v1/me` → `{ username, roles, permissions }`.
  3. Migration `V11__workspace_permissions.sql` adds screen permissions and sales and manager rows, marked `[ASSUMED] Q-003` (placeholder until the client confirms).
  4. Every erp-app endpoint gets `@PreAuthorize("@perm.has('...')")`, including the ones open today.
- **Permission per screen (placeholder defaults):**

  | Screen | Permission | Roles holding it |
  |---|---|---|
  | Dashboard, Rooms, arrivals/departures/alerts | `frontdesk:view` | RECEPTION, MANAGER |
  | Reservations (view / create) | `bookings:view` / `bookings:create` | RECEPTION, MANAGER |
  | Check-in / out, walk-in, transfer | `stays:checkin` | RECEPTION, MANAGER |
  | Guests (view / edit) | `guests:view` / `guests:edit` | RECEPTION, MEMBERSHIP, SALES_EXEC, SALES_SUPERVISOR, MANAGER / RECEPTION, MANAGER |
  | Membership actions | existing `members:*` | MEMBERSHIP, RECEPTION (as today), MANAGER |
  | Sales leads | `leads:manage` | SALES_EXEC, SALES_SUPERVISOR, MANAGER |
  | Billing | `payments:collect`, `invoices:manage`, `refunds:manage` | ACCOUNTS, MANAGER (RECEPTION collects payments) |
  | Housekeeping board / tasks | `housekeeping:tasks` | HOUSEKEEPING, MANAGER |
  | Reports | `reports:view` / `reports:financial` | MANAGER / ACCOUNTS |
  | Ops console | `ops.read` (existing) | OPS_* |
  | Settings | `config:manage` | SUPERADMIN |

- **Why:** one matrix, in the database, that an admin can change without a code change. The server enforces it, and the UI just reads it.
- **Why not the alternatives:** role lists in the UI drift from the backend (they already have). Keeping `hasAnyAuthority` in each controller means two sources of truth.
- **Real-world practice:** permission-based access control. Roles are bundles of permissions, the server is the only authority, and the UI asks "what may I do?" (`/me`).
- **Note:** lead-service keeps its Keycloak role check (separate service, own data). `leads:manage` in `/me` only controls the menu.

### Slice B — Each department sees only its workspace (web)
- **Problem:** the sidebar shows everything, and clicks lead to 403.
- **Fix:**
  - **New `web/src/access.ts`**, the single map from screen to permission:
    - `canSee(view, perms)`
    - `landingView(perms)`, which picks the first allowed screen by priority: leads → housekeeping → billing → ops → dashboard
    - `departmentLabel(roles)`
  - **`App.tsx`:** after login, load `/me`; start on `landingView`; `go()` and `onJump()` check `canSee`, and a blocked jump shows an `AccessDenied` panel ("Your role cannot open Billing").
  - **`dashboard.tsx`:**
    - The sidebar filters `NAV` with `canSee`, replacing the one-off `canOps` check.
    - The footer shows the department label ("Sales"), not the raw role list.
    - The top-bar search is hidden without `guests:view` / `bookings:view`.
    - Dashboard links (View folio, Room status) only render when allowed.
  - **Several roles:** a user with several roles sees the union of their screens.
- **Why:** the same permissions the server enforces drive the UI, so a visible button never leads to a 403.
- **Why not the alternatives:** a single "primary role" breaks multi-role users. Guarding only the sidebar leaves the jump links open.

### Slice C — Staff sign-in screen (web)
- **Problem:** there is no sign-in page, and Preview mode is the default even in production.
- **Fix:**
  - New `SignIn.tsx`, branded Golden Hills, shown when no one is signed in. It has one button, "Sign in", which opens the Keycloak login page (PKCE, the same flow as today).
  - **Dev builds only** (`import.meta.env.DEV`): department tiles (Sales, Front office, Housekeeping, Accounts, Ops, Manager) call `kc.login({ loginHint: 'sales-staff' })`, so the username is pre-filled. No password lives in the app.
  - Logout returns to the sign-in screen.
  - Preview mode exists only in dev builds. There, a "Preview as" dropdown (Sales / Front office / Housekeeping / Accounts / Ops / Manager) applies a sample permission set from `PREVIEW_PERSONAS` in `access.ts`. The dropdown is labelled "sample", and the real rules still come only from the server.
- **Why:** passwords are typed only on the identity provider's page, so MFA, lockout, password reset and the login audit come free from Keycloak.
- **Why not the alternatives:**
  - An in-app username/password form (Direct Access Grants) is deprecated in OAuth 2.1, skips brute-force protection and MFA, and handles passwords in our JavaScript.
  - Choosing a department on a card cannot grant anything (the role comes from Keycloak), and confuses multi-role staff.
  - 1-click demo logins with built-in passwords would ship credentials in the bundle.
- **Real-world practice:** hotel and ERP systems use hosted single sign-on (SSO). Brand the Keycloak login page with a Keycloak theme (a later small task).

### Slice D — Tests and docs
- **erp-app** (tests first, Rule 3 for RBAC): a MockMvc table test where each role × each key endpoint expects allowed or 403, including the endpoints that are open today. Plus `/me` returns permissions from the table.
- **web** (Vitest):
  - Sales sees only Sales Leads (+ Guests) and lands on Leads.
  - Housekeeping lands on Housekeeping and cannot jump to Billing (AccessDenied).
  - Reception sees front-office screens and no Leads.
  - Multi-role users get the union.
  - The search is hidden for Housekeeping.
  - The sign-in screen shows when logged out; dev tiles pass `loginHint`.
- **Docs:**
  - `docs/03-phases/phase-3/PLAN-3.15-role-workspaces.md` (this plan)
  - `security.md`: permission matrix + `/me`
  - `api.md`: `/me`
  - `OPEN_QUESTIONS.md`: Q-003 note that the role matrix defaults are `[ASSUMED]`
  - `DEVLOG.md`, `STATE.md`, `TRACEABILITY.md` (ERP-08)

## Files
- **erp-app:**
  - New `auth/Permissions.java`, `auth/MeController.java`, `db/migration/V11__workspace_permissions.sql`
  - Annotations in `erp02/*Controller`, `erp03/StayController`, `erp04/GuestController`, `erp05/MemberController`, `erp07/PaymentController`, `hsk/HskController`, `config/ConfigController`, `ops/OpsController`
  - Delete `ops/OpsAuthorization.java`
  - Test fixtures that use `jwt()` roles
- **web:**
  - New `access.ts`, `SignIn.tsx`, `access.test.tsx`
  - Changed `auth.ts` (`login(hint?)`), `api.ts` (`me()`), `App.tsx`, `dashboard.tsx`

## Out of scope
- A Keycloak login theme.
- A role-admin UI. The matrix is edited in the DB or a later settings screen.
- Changing lead-service authorization.
- Slices 2–4 of 3.14.

## Verification
1. `mvn -B verify`: the role × endpoint test passes; existing tests are updated, not deleted.
2. `cd web && npm test && npm run build && npm run lint`.
3. Live: sign in as `sales-staff`, `housekeeping-staff`, `reception-staff`, `accounts-staff` and `manager-staff`. Check the landing screen, the visible tabs, and that no 403 appears anywhere while clicking through.
4. Without a token, `curl` to `/api/v1/reservations` returns 401. With a HOUSEKEEPING token it returns 403 (today: 200).
5. No commit without approval (Rule 7).
