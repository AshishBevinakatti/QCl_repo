/**
 * Staff SSO via Keycloak (PKCE public client — no secret in the browser).
 * One instance, initialized once (StrictMode-safe). Tokens attach to every
 * API call through apiFetch(); the server (not the UI) enforces roles.
 */
import Keycloak from 'keycloak-js';

function cfg() {
  return {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'resort',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'erp-web',
  };
}

let kc: Keycloak | null = null;
let initPromise: Promise<boolean> | null = null;
let reachable = false;

export async function initAuthOnce(): Promise<boolean> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      kc = new Keycloak(cfg());
      const authed = await kc.init({ onLoad: 'check-sso', pkceMethod: 'S256', checkLoginIframe: false });
      reachable = true;
      return authed;
    } catch {
      return false; // Keycloak down: shell stays usable in Preview mode.
    }
  })();
  return initPromise;
}

/** Opens the Keycloak sign-in page; loginHint only pre-fills the username (dev shortcuts). */
export function login(loginHint?: string) {
  if (kc) void kc.login(loginHint ? { loginHint } : undefined);
}

/** False when Keycloak could not be reached at startup. */
export function authReachable(): boolean {
  return reachable;
}

export function logout() {
  if (kc) void kc.logout({ redirectUri: window.location.origin });
}

export function isAuthenticated(): boolean {
  return kc?.authenticated ?? false;
}

export function username(): string {
  return (kc?.tokenParsed?.preferred_username as string | undefined) ?? '';
}

export function roles(): string[] {
  const parsed = kc?.tokenParsed as { realm_access?: { roles?: string[] } } | undefined;
  return parsed?.realm_access?.roles ?? [];
}

export function hasRole(...wanted: string[]): boolean {
  const have = new Set(roles());
  return wanted.some((r) => have.has(r));
}

/** Fresh token (refreshes when under 30s left); null when logged out/unreachable. */
export async function getToken(): Promise<string | null> {
  if (!kc?.authenticated) return null;
  try {
    await kc.updateToken(30);
  } catch {
    return null;
  }
  return kc.token ?? null;
}
