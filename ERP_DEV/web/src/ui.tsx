import type { ReactNode } from 'react';

/** Shared building blocks so every desk screen looks and behaves alike. */
export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function Alert({ kind, children }: { kind: 'err' | 'ok' | 'info'; children: ReactNode }) {
  return <p className={`alert ${kind}`}>{children}</p>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}

export function Btn({
  children, onClick, ghost, type,
}: {
  children: ReactNode;
  onClick?: () => void;
  ghost?: boolean;
  type?: 'submit' | 'button';
}) {
  return (
    <button type={type ?? 'button'} className={ghost ? 'btn ghost' : 'btn'} onClick={onClick}>
      {children}
    </button>
  );
}

export function Stat({ num, lbl }: { num: ReactNode; lbl: string }) {
  return (
    <div className="card stat">
      <div className="num">{num}</div>
      <div className="lbl">{lbl}</div>
    </div>
  );
}

export function Badge({ tone, children }: { tone?: 'green' | 'amber' | 'red'; children: ReactNode }) {
  return <span className={tone ? `badge ${tone}` : 'badge'}>{children}</span>;
}

export function statusTone(status: string): 'green' | 'amber' | 'red' | undefined {
  if (['confirmed', 'checked-in', 'active', 'ready', 'captured', 'processed'].includes(status)) return 'green';
  if (['hold', 'todo', 'doing', 'inspect', 'pending', 'requested', 'approved'].includes(status)) return 'amber';
  if (['cancelled', 'expired', 'failed', 'dirty', 'rejected'].includes(status)) return 'red';
  return undefined;
}
