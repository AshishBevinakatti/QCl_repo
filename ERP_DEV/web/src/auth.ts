// Keycloak login for employees: Authorization Code + PKCE, tokens kept in memory only (AUTHENTICATION.md §5).
import Keycloak from "keycloak-js";
import { config } from "./config";

export interface Session {
  /** Returns a fresh access token (refreshed if it expires within 30 s), or throws if the session ended. */
  token(): Promise<string>;
  /** Forces a refresh, e.g. after the API said 401. */
  refresh(): Promise<string>;
  login(): Promise<void>;
  logout(): Promise<void>;
}

const keycloak = new Keycloak({ url: config.keycloakUrl, realm: config.realm, clientId: config.clientId });

/** Completes a login redirect if there is one; does not force a login, so the ERP can show its own sign-in page. */
export async function initAuth(): Promise<boolean> {
  return keycloak.init({ pkceMethod: "S256", checkLoginIframe: false });
}

export const session: Session = {
  async token() {
    await keycloak.updateToken(30);
    return keycloak.token!;
  },
  async refresh() {
    await keycloak.updateToken(-1);
    return keycloak.token!;
  },
  login: () => keycloak.login(),
  // Ends the Keycloak SSO session (end-session endpoint with id_token_hint), then comes back to the sign-in page.
  logout: () => keycloak.logout({ redirectUri: window.location.origin + "/" }),
};
