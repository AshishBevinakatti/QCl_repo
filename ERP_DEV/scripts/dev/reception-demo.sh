#!/usr/bin/env bash
set -euo pipefail

# Local-only reception demo fixture. Never run against production/UAT.
# Requires ALLOW_DEMO_SEED=1 and a loopback Postgres host.
# Connection: PGHOST (default 127.0.0.1), PGPORT (5432), PGUSER (resort_user),
# PGPASSWORD or ~/.pgpass, DB_NAME (resort_erp).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="${DB_NAME:-resort_erp}"
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-resort_user}"
export PGHOST PGPORT PGUSER

usage() {
  cat <<'EOF'
Usage: ALLOW_DEMO_SEED=1 ./scripts/dev/reception-demo.sh <load|reset|verify>

  load    Remove the fixture, then load the 6-guest reception demo and assert it.
  reset   Remove only the fixture rows and restore its affected rooms.
  verify  Assert the fixture is present and print the demo summary.

Pre-existing guests/reservations and room DEL-101 are never touched.
This is local development data only — no Flyway migration or startup seed.
EOF
}

refuse() {
  printf 'Refusing: %s\n' "$1" >&2
  exit 1
}

[[ $# -eq 1 ]] || { usage; exit 2; }
COMMAND="$1"
case "$COMMAND" in
  load|reset|verify) ;;
  -h|--help|help) usage; exit 0 ;;
  *) usage; exit 2 ;;
esac

[[ "${ALLOW_DEMO_SEED:-}" == "1" ]] || refuse "set ALLOW_DEMO_SEED=1 for this local fixture"
case "$PGHOST" in
  127.0.0.1|localhost|::1) ;;
  *) refuse "PGHOST must be loopback (got $PGHOST)" ;;
esac
[[ "$DB_NAME" == "resort_erp" ]] || refuse "unexpected DB_NAME '$DB_NAME' (expected resort_erp)"

PSQL=(psql -X -q -v ON_ERROR_STOP=1 -v allow_demo=1 -d "$DB_NAME")

printf 'Reception demo: database=%s host=%s:%s user=%s\n' "$DB_NAME" "$PGHOST" "$PGPORT" "$PGUSER"

"${PSQL[@]}" -tAc 'SELECT 1' >/dev/null || refuse "cannot connect to the local database"

case "$COMMAND" in
  load)
    printf 'Removing any previous fixture...\n'
    "${PSQL[@]}" -f "$SCRIPT_DIR/reception-demo-reset.sql"
    printf 'Loading demo fixture...\n'
    "${PSQL[@]}" -f "$SCRIPT_DIR/reception-demo-load.sql"
    printf 'Verifying fixture...\n'
    "${PSQL[@]}" -f "$SCRIPT_DIR/reception-demo-verify.sql"
    ;;
  reset)
    "${PSQL[@]}" -f "$SCRIPT_DIR/reception-demo-reset.sql"
    ;;
  verify)
    "${PSQL[@]}" -f "$SCRIPT_DIR/reception-demo-verify.sql"
    ;;
esac
