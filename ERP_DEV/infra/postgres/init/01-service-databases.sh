#!/bin/bash
# Runs once, on the first start of an empty volume.
# One database plus one least-privilege login per owner (Blueprint §6; ARCHITECTURE §4).
# Increment 2 adds guest_db and lead_db the same way.
set -euo pipefail
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
     -v kc_pw="$KC_DB_PASSWORD" -v access_pw="$ACCESS_DB_PASSWORD" <<'SQL'
CREATE ROLE keycloak   LOGIN PASSWORD :'kc_pw';
CREATE ROLE access_svc LOGIN PASSWORD :'access_pw';
CREATE DATABASE keycloak  OWNER keycloak;
CREATE DATABASE access_db OWNER access_svc;
REVOKE ALL ON DATABASE keycloak  FROM PUBLIC;
REVOKE ALL ON DATABASE access_db FROM PUBLIC;
SQL
