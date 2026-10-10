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

/** Material Symbol (Google icons CDN; degrades to ligature text offline). */
export function Icon({ name, size }: { name: string; size?: number }) {
  return (
    <span className="material-symbols-outlined" style={size ? { fontSize: size } : undefined} aria-hidden>
      {name}
    </span>
  );
}

/** Honest placeholder where no backend endpoint exists yet (never fake rows). */
export function Soon({ icon, title, why }: { icon: string; title: string; why: string }) {
  return (
    <div className="soon">
      <Icon name={icon} />
      <strong>{title}</strong>
      <div style={{ marginTop: 4 }}>{why}</div>
    </div>
  );
}

/** KPI stat card with a tinted icon chip (theme palette only). */
export function Kpi({ icon, tint, num, lbl, sub }: {
  icon: string; tint: string; num: ReactNode; lbl: string; sub: string;
}) {
  return (
    <div className="kpi">
      <span className="ic" style={{ background: tint }}><Icon name={icon} /></span>
      <span>
        <span className="num">{num}</span>
        <div className="lbl">{lbl}</div>
        <div className="sub">{sub}</div>
      </span>
    </div>
  );
}

/** Room-status donut (pure SVG, no chart dependency). */
export function Donut({ slices, total, label }: {
  slices: { value: number; color: string }[]; total: number; label: string;
}) {
  const R = 54;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segs = slices.map((s, i) => {
    const frac = total === 0 ? 0 : s.value / total;
    const el = (
      <circle
        key={i} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth="18"
        strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acc * C}
        transform="rotate(-90 70 70)"
      />
    );
    acc += frac;
    return el;
  });
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flex: 'none' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">{segs}</svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <strong style={{ fontSize: '1.5rem', lineHeight: 1 }}>{total}</strong>
        <small style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{label}</small>
      </div>
    </div>
  );
}
