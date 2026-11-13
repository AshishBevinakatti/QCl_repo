import bannerImg from './assets/banner.jpg';
import logoLight from './assets/logo-light.png';
import { authReachable, login } from './auth';
import { Alert, Btn, Icon } from './ui';

/** Dev-only shortcuts: they pre-fill the Keycloak username; the password is still typed on Keycloak's page. */
const DEV_ACCOUNTS = [
  { username: 'sales-staff', label: 'Sales' },
  { username: 'reception-staff', label: 'Front office' },
  { username: 'housekeeping-staff', label: 'Housekeeping' },
  { username: 'accounts-staff', label: 'Accounts' },
  { username: 'membership-staff', label: 'Membership' },
  { username: 'manager-staff', label: 'Management' },
  { username: 'admin-staff', label: 'Administrator' },
];

/** What the workspace actually covers today. Each line is a shipped screen. */
const COVERS = [
  'Reservations, arrivals and departures',
  'Room board, keys and housekeeping',
  'Folios, payments and refunds',
];

/**
 * Staff sign-in (unit 3.15), composed like the public guest portal: the
 * property on the left, the door on the right.
 *
 * The right panel deliberately carries no email or password field. Staff
 * authenticate through Keycloak with PKCE, so the password is only ever typed
 * on the identity provider's own page — that is what gives the property
 * lockout, password reset and MFA. A local form here would either be
 * decorative or would undo that.
 */
export function SignIn({ onPreview }: { onPreview?: () => void }) {
  const reachable = authReachable();

  return (
    <div className="signin-screen">
      {/* ---- The property ---- */}
      <aside className="signin-hero">
        <img className="signin-hero-img" src={bannerImg} alt="" />
        <div className="signin-hero-scrim" />

        <div className="signin-hero-content">
          <img className="signin-hero-logo" src={logoLight} alt="Golden Hills Resort" width={180} />

          <div className="signin-hero-message">
            <span className="signin-hero-kicker">Staff workspace</span>
            <h1 className="signin-hero-title">
              The desk, the rooms and the books in one place
            </h1>
            <p className="signin-hero-desc">
              Golden Hills runs its day here — who is arriving, which rooms are ready,
              what each stay owes and which inquiries are still waiting on a call.
            </p>

            <ul className="signin-hero-covers">
              {COVERS.map((line) => (
                <li key={line}>
                  <span className="dot" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mirrors the guest portal's footer position, but reports something
            * real instead of a security claim: whether the IdP is answering. */}
          <div className="signin-hero-footer">
            <span className={`signin-status${reachable ? '' : ' is-down'}`}>
              <span className="dot" />
              {reachable ? 'Single sign-on is reachable' : 'Single sign-on is not answering'}
            </span>
          </div>
        </div>
      </aside>

      {/* ---- The door ---- */}
      <main className="signin-panel">
        <div className="signin-card" aria-labelledby="signin-title">
          <div className="signin-brand">
            <span className="signin-mark" aria-hidden="true">GH</span>
            <span className="signin-brand-copy">
              <strong>Golden Hills</strong>
              <small>Resort ERP</small>
            </span>
          </div>

          <div className="signin-copy">
            <h2 id="signin-title">Sign in</h2>
            <p className="signin-sub">
              Use the staff account your manager issued you
            </p>
          </div>

          {!reachable && (
            <Alert kind="err">The sign-in service is not reachable. Try again in a minute, or contact IT.</Alert>
          )}

          <Btn onClick={() => login()}>
            Continue to single sign-on
            <Icon name="arrow_forward" size={16} />
          </Btn>
          <p className="signin-note">
            Your password is only ever typed on the Golden Hills sign-on page, which also
            handles password resets and two-factor
          </p>

          {import.meta.env.DEV && (
            <div className="signin-dev" aria-label="Development shortcuts">
              {onPreview && (
                <Btn ghost onClick={onPreview}>Explore with sample data</Btn>
              )}
              {/* Seven role tiles would otherwise be most of this card, so they
                * stay folded away until someone wants a specific role. */}
              <details className="signin-personas">
                <summary>Sign in as a test account</summary>
                <div className="signin-tiles">
                  {DEV_ACCOUNTS.map((a) => (
                    <button
                      key={a.username}
                      type="button"
                      onClick={() => login(a.username)}
                    >
                      <strong>{a.label}</strong>
                      <small>{a.username}</small>
                    </button>
                  ))}
                </div>
              </details>
            </div>
          )}

          <p className="signin-help">
            Locked out or no account yet? Ask your manager, or the front office on extension 100
          </p>
        </div>
      </main>
    </div>
  );
}

export function AccessDenied({ what }: { what: string }) {
  return (
    <div className="panel" role="alert">
      <h3>Restricted section</h3>
      <p>Your account cannot open {what}. Ask a manager if you need access.</p>
    </div>
  );
}
