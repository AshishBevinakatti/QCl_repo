import { useEffect, useState } from "react";
import type { Me } from "./api";

export const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  leads: "Leads",
  audit: "Audit log",
};

export function SignIn({ onSignIn }: { onSignIn: () => void }) {
  return (
    <main className="signin">
      <h1>Golden Hills Resort ERP</h1>
      <p>Staff sign-in. You will enter your email or username and password on the secure Golden Hills sign-in page.</p>
      <button onClick={onSignIn}>Sign in</button>
    </main>
  );
}

export function Dashboard({ loadMe, onSignOut }: { loadMe: () => Promise<Me>; onSignOut: () => void }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMe().then(setMe, (e: Error) => setError(e.message || "Could not load your profile."));
  }, [loadMe]);

  if (error) return <main><p role="alert">{error}</p><button onClick={onSignOut}>Sign out</button></main>;
  if (!me) return <main><p>Loading…</p></main>;

  const name = me.employee ? `${me.employee.firstName} ${me.employee.lastName}` : null;
  return (
    <div className="shell">
      <header>
        <strong>Golden Hills ERP</strong>
        <span>{name ?? "Signed in"} · {me.roles.join(", ") || "no role"}</span>
        <button onClick={onSignOut}>Sign out</button>
      </header>
      <nav aria-label="Modules">
        {/* Visibility only; the backend checks every request (AUTHENTICATION §5 step 6). */}
        {me.modules.map((m) => <a key={m} href={`#${m}`}>{MODULE_LABELS[m] ?? m}</a>)}
      </nav>
      <main>
        {name ? <h1>Welcome, {name}</h1> : (
          <p role="alert">Your sign-in works, but your ERP employee record is not set up yet. Ask an administrator.</p>
        )}
      </main>
    </div>
  );
}
