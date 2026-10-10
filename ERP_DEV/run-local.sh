#!/usr/bin/env bash
# Golden Hills ERP — one-command local backend.
# Lesson 2026-10-10: hand-typed env vars lose KEYCLOAK_ISSUER_URL and every
# login then fails with a misleading message. This script owns the vars.
#
# Usage: ./run-local.sh [postgres|h2]   (default: postgres = global resort_erp)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
export JAVA_HOME=$(echo ~/.local/java/*/ | head -1)
export PATH="$JAVA_HOME/bin:$HOME/.local/maven/bin:$PATH"

MODE=${1:-postgres}
if [ "$MODE" = postgres ]; then
  export DB_URL="jdbc:postgresql://localhost:5432/resort_erp"
  export DB_USER=resort_user
  export DB_PASSWORD='change-me-locally-only'
else
  export DB_URL="jdbc:h2:mem:local;MODE=PostgreSQL;DB_CLOSE_DELAY=-1"
  export DB_USER=sa
  export DB_PASSWORD=
fi
export KEYCLOAK_ISSUER_URL="${KEYCLOAK_ISSUER_URL:-http://localhost:8081/realms/resort}"

# Fail-fast pre-login check (runbook: docs/05-operations/keycloak.md).
if ! curl -sf --max-time 5 "$KEYCLOAK_ISSUER_URL/.well-known/openid-configuration" > /dev/null; then
  echo "WARNING: Keycloak unreachable at $KEYCLOAK_ISSUER_URL — logins will fail."
  echo "Start it first: sg docker -c \"docker compose -f $HERE/infra/docker-compose.local.yml up -d keycloak\""
fi

mkdir -p /tmp/opencode
if [ ! -f "$HERE/services/erp-app/target/classes/com/quantumclk/erp/ErpApplication.class" ]; then
  echo "First run: compiling backend..."
  (cd "$HERE" && mvn -B -q compile)
fi
if [ ! -f /tmp/opencode/cp.txt ]; then
  echo "First run: resolving classpath..."
  (cd "$HERE/services/erp-app" && mvn -B -q dependency:build-classpath \
    -Dmdep.outputFile=/tmp/opencode/cp.txt -Dmdep.includeScope=test)
fi
echo "Backend on :8080 — DB=$MODE — issuer=$KEYCLOAK_ISSUER_URL"
exec java -cp "$HERE/services/erp-app/target/classes:$(cat /tmp/opencode/cp.txt)" \
  com.quantumclk.erp.ErpApplication
