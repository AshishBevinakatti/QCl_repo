# Local reception demo data (Unit 3.10)

- Purpose: how to load, verify and remove the local-only receptionist demo fixture. Audience: developers, QA, demo presenters. Date: 2026-10-21. Owner: project team.
- Status: local development only. **Never** use in production/UAT, never convert to a Flyway migration, and never auto-load at application start.

## Why this exists

The dashboard needs realistic front-office state to demonstrate and test arrivals, in-house guests, departures, folios, billing, alerts and the room grid. Production data must not be used for this. The user approved a narrow exception to the 2026-10-10 "no guest seed data" rule: the fixture creates only fabricated `Demo ` guests with `+91-90000001xx` phones, and the scripts live under `scripts/dev/`.

## Commands

From `ERP_DEV/` with the local Postgres running:

```bash
export PGPASSWORD='change-me-locally-only'   # or use ~/.pgpass
ALLOW_DEMO_SEED=1 ./scripts/dev/reception-demo.sh load
ALLOW_DEMO_SEED=1 ./scripts/dev/reception-demo.sh verify
ALLOW_DEMO_SEED=1 ./scripts/dev/reception-demo.sh reset
```

The wrapper refuses to run unless:

- `ALLOW_DEMO_SEED=1` is set;
- `PGHOST` is loopback (`127.0.0.1`, `localhost`, or `::1`);
- `DB_NAME` is `resort_erp` (default).

`load` removes the previous fixture and reloads it. `reset` removes only the fixed fixture rows and restores its affected rooms where no non-fixture active stay remains. Existing `ashish`, the two expired reservations and `DEL-101` are deliberately untouched.

## Dataset

Six guests, six reservations, three checked-in stays, three folios, four captured payments and three open housekeeping tasks. Dates are relative to business today in `Asia/Kolkata`; reload if the fixture is stale after midnight.

| Guest | Story |
|---|---|
| Demo Aarav Mehta | Current arrival, Deluxe, advance captured |
| Demo Diya Shah | In-house Suite SUI-201, partial payment |
| Demo Kabir Rao | Departure today VIL-301, fully settled |
| Demo Meera Nair | Departure today DEL-103, pending balance 500000 |
| Demo Rohan Iyer | Future Suite hold |
| Demo Ananya Verma | Future confirmed Villa booking |

Rooms `DEL-102`, `SUI-203` and `VIL-302` are dirty with open tasks. The detailed scenario matrix, executed evidence and findings are in `docs/03-phases/phase-3/RECEPTION-E2E-TEST-REPORT.md`.

## Safety notes

- The fixture inserts business rows directly; it does not prove API validation. Use the live UI/API scenarios for that.
- Fixture rows are not business audit events; the test actions are audited normally.
- Do not edit the fixed UUID scheme unless reset SQL is updated in the same change.
- No client or real guest data may be copied into the fixture.
