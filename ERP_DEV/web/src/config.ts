// Public, non-secret settings (the browser client is public; see KEYCLOAK-SETUP §5.1).
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8082",
  keycloakUrl: import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8081",
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "gh-staff",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "erp-web",
};
