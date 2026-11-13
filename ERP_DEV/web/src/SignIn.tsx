import bannerImg from './assets/banner.jpg';
import { authReachable, login } from './auth';
import { Alert, Btn } from './ui';

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

/**
 * Staff sign-in (unit 3.15). Passwords are only ever typed on the Keycloak page
 * (PKCE), so lockout, password reset and MFA come from the identity provider.
 */
export function SignIn({ onPreview }: { onPreview?: () => void }) {
  return (
    <main className="signin signin-split">
      <aside className="signin-photo" aria-hidden="true">
        <img src={bannerImg} alt="" />
        <div className="signin-photo-txt">
          <strong>Golden Hills Resort</strong>
          <span>Reservations, guests, billing and operations in one place.</span>
        </div>
      </aside>
      <section className="signin-card" aria-labelledby="signin-title">
        <span className="signin-mark" aria-hidden="true">GH</span>
        <h1 id="signin-title">Golden Hills Resort</h1>
        <p className="signin-sub">Staff workspace</p>
        {!authReachable() && (
          <Alert kind="err">The sign-in service is not reachable. Try again in a minute or contact IT.</Alert>
        )}
        <Btn onClick={() => login()}>Sign in</Btn>
        <p className="signin-note">You will sign in on the Golden Hills single sign-on page.</p>

        {import.meta.env.DEV && (
          <div className="signin-dev" aria-label="Development shortcuts">
            <h2>Development: sign in as</h2>
            <div className="signin-tiles">
              {DEV_ACCOUNTS.map((a) => (
                <button key={a.username} type="button" onClick={() => login(a.username)}>
                  <strong>{a.label}</strong>
                  <small>{a.username}</small>
                </button>
              ))}
            </div>
            {onPreview && (
              <Btn ghost onClick={onPreview}>Explore with sample data</Btn>
            )}
          </div>
        )}
      </section>
    </main>
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
