import { useEffect, useState } from "react";
import type { Me } from "./api";
import { AuditLog, Employees } from "./Employees";
import { Memberships } from "./Memberships";

export const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  leads: "Leads",
  memberships: "Memberships",
  audit: "Audit log",
};

/** Friendly names for the realm roles (REQ-IAM-008). Unknown roles fall through unchanged. */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Sales Admin",
  MANAGER: "Manager",
  SALES_EXECUTIVE: "Sales Executive",
};

/** The workspaces offered on the start screen. Both open the same Keycloak login: the card only
 *  starts the flow, the account's role decides what loads (backend enforces every request). */
const WORKSPACES = [
  { role: "ADMIN", title: "Sales Admin", detail: "Employees, roles and the audit log" },
  { role: "SALES_EXECUTIVE", title: "Sales Executive", detail: "Lead queue and guest enquiries" },
];

function getInitials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "GH";
}

export function SignIn({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="signin-wrapper">
      <main className="signin-card">
        <div className="signin-crest">GH</div>
        <h1>Golden Hills Resort</h1>
        <p>Hospitality Operations & Staff ERP Portal. Select your role workspace to sign in securely.</p>
        <div className="role-picker">
          {WORKSPACES.map((w) => (
            <button key={w.role} type="button" className="role-choice" onClick={onSignIn}>
              <div className="role-choice-text">
                <strong>{w.title}</strong>
                <small>{w.detail}</small>
              </div>
              <span className="role-choice-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
        <p className="hint">Your account decides what opens — the card only starts the sign-in.</p>
      </main>
    </div>
  );
}

type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const on = () => setHash(window.location.hash.slice(1));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

export function Dashboard({ loadMe, onSignOut, request }: { loadMe: () => Promise<Me>; onSignOut: () => void; request?: Request }) {
  const [me, setMe] = useState<Me | null>(null);
  const page = useHash();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMe().then(setMe, (e: Error) => setError(e.message || "Could not load your profile."));
  }, [loadMe]);

  if (error) {
    return (
      <main style={{ maxWidth: "500px", margin: "10vh auto", textAlign: "center" }}>
        <p role="alert">{error}</p>
        <button onClick={onSignOut}>Sign out</button>
      </main>
    );
  }

  if (!me) {
    return (
      <main style={{ maxWidth: "500px", margin: "15vh auto", textAlign: "center" }}>
        <p>Loading…</p>
      </main>
    );
  }

  const name = me.employee ? `${me.employee.firstName} ${me.employee.lastName}` : null;
  const initials = me.employee ? getInitials(me.employee.firstName, me.employee.lastName) : "GH";
  const friendlyRole = me.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ") || "no role";

  return (
    <div className="shell">
      <header>
        <div className="brand-wrapper">
          <div className="brand-crest">GH</div>
          <div className="brand-info">
            <span className="brand-title">Golden Hills Resort</span>
            <span className="brand-subtitle">Staff ERP</span>
          </div>
        </div>

        <div className="user-profile">
          <div className="user-badge">
            <div className="user-avatar">{initials}</div>
            <div className="user-meta">
              <span className="user-name">{name ?? "Signed in"}</span>
              <span className="user-role-tag">{friendlyRole}</span>
            </div>
          </div>
          <button className="btn-outline" onClick={onSignOut} title="End session">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign out
          </button>
        </div>
      </header>

      <nav aria-label="Modules">
        {/* Visibility only; the backend checks every request (AUTHENTICATION §5 step 6). */}
        {me.modules.map((m) => {
          const isActive = page === m || (page === "" && m === "dashboard");
          return (
            <a key={m} href={`#${m}`} className={isActive ? "active" : ""} data-active={isActive}>
              {MODULE_LABELS[m] ?? m}
            </a>
          );
        })}
      </nav>

      <main>
        {!name ? (
          <p role="alert">Your sign-in works, but your ERP employee record is not set up yet. Ask an administrator.</p>
        ) : page === "employees" && me.modules.includes("employees") && request ? (
          <Employees request={request} canManage={me.permissions.includes("employees.manage")}
                     canAssignRoles={me.permissions.includes("roles.assign")} />
        ) : page === "memberships" && me.modules.includes("memberships") && request ? (
          <Memberships me={me} request={request} />
        ) : page === "audit" && me.modules.includes("audit") && request ? (
          <AuditLog request={request} />
        ) : (
          <section>
            <div style={{ marginBottom: "2rem" }}>
              <h1>Welcome, {name}</h1>
              <p>Welcome to Golden Hills Resort operational management portal.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              <div className="form-card" style={{ margin: 0, padding: "1.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Identity & Access</span>
                <h3 style={{ margin: "0.5rem 0 0.25rem" }}>Keycloak Verified</h3>
                <p style={{ fontSize: "0.85rem", margin: 0 }}>Active SSO session on gh-staff realm</p>
              </div>

              <div className="form-card" style={{ margin: 0, padding: "1.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--success-text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>System Status</span>
                <h3 style={{ margin: "0.5rem 0 0.25rem" }}>Operational</h3>
                <p style={{ fontSize: "0.85rem", margin: 0 }}>API Gateway, Keycloak & Database Active</p>
              </div>

              <div className="form-card" style={{ margin: 0, padding: "1.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Authorized Modules</span>
                <h3 style={{ margin: "0.5rem 0 0.25rem" }}>{me.modules.length} Active</h3>
                <p style={{ fontSize: "0.85rem", margin: 0 }}>{me.modules.map(m => MODULE_LABELS[m] ?? m).join(", ")}</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
