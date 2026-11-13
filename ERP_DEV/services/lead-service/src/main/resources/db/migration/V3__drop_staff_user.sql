-- V3__drop_staff_user.sql: Drop standalone staff_user table in favor of Keycloak SSO

DROP TABLE IF EXISTS staff_user CASCADE;
