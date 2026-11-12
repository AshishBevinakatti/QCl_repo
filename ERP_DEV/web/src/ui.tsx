import type { ComponentType, ReactNode } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BedDouble,
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clock,
  CreditCard,
  Crown,
  Database,
  ExternalLink,
  FileText,
  HeartPulse,
  Info,
  Mail,
  Pencil,
  Phone,
  DoorOpen,
  StickyNote,
  History,
  Hotel,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  Moon,
  ReceiptText,
  Rocket,
  Route,
  Search,
  Server,
  Settings,
  Sparkles,
  Sun,
  ToggleRight,
  TriangleAlert,
  User,
  UserPlus,
  UserSearch,
  Users,
  UsersRound,
  Wrench,
  X,
  type LucideProps,
} from 'lucide-react';

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
  children, onClick, ghost, type, disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  ghost?: boolean;
  type?: 'submit' | 'button';
  disabled?: boolean;
}) {
  return (
    <button
      type={type ?? 'button'}
      className={ghost ? 'btn ghost' : 'btn'}
      onClick={onClick}
      disabled={disabled}
    >
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

const MATERIAL_ICONS: Record<string, ComponentType<LucideProps>> = {
  home: LayoutDashboard,
  calendar_month: CalendarDays,
  group: Users,
  groups: UsersRound,
  bed: BedDouble,
  hotel: Hotel,
  swap_horiz: ArrowLeftRight,
  receipt_long: ReceiptText,
  build: Wrench,
  cleaning_services: Sparkles,
  bar_chart: BarChart3,
  monitoring: Activity,
  monitor_heart: HeartPulse,
  settings: Settings,
  logout: LogOut,
  login: LogIn,
  search: Search,
  notifications: Bell,
  arrow_forward: ArrowRight,
  arrow_back: ArrowLeft,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  close: X,
  error: CircleAlert,
  warning: TriangleAlert,
  event_available: CalendarCheck,
  event_busy: CalendarX,
  person: User,
  person_add: UserPlus,
  person_search: UserSearch,
  progress_activity: LoaderCircle,
  workspace_premium: Crown,
  badge_check: BadgeCheck,
  mail: Mail,
  call: Phone,
  edit: Pencil,
  credit_card: CreditCard,
  open_in_new: ExternalLink,
  info: Info,
  door_open: DoorOpen,
  note: StickyNote,
  toggle_on: ToggleRight,
  description: FileText,
  dns: Server,
  database: Database,
  history: History,
  route: Route,
  schedule: Clock,
  rocket_launch: Rocket,
  menu: Menu,
  sun: Sun,
  moon: Moon,
};

/** Material-name compatible icon wrapper backed by Lucide (local SVG, no CDN). */
export function Icon({ name, size }: { name: string; size?: number }) {
  const Component = MATERIAL_ICONS[name] ?? CircleHelp;
  return <Component className="icon" size={size ?? 20} strokeWidth={2} aria-hidden data-icon={name} />;
}

/** Honest placeholder where no backend endpoint exists yet (never fake rows). */
export function EmptyState({ icon, title, description, action }: {
  icon?: string; title: string; description?: ReactNode; action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state__icon"><Icon name={icon} size={22} /></span>}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export function Soon({ icon, title, why }: { icon: string; title: string; why: string }) {
  return <EmptyState icon={icon} title={title} description={why} />;
}

export type KpiTone = 'brand' | 'gold' | 'info' | 'danger' | 'neutral';

/** KPI stat card with a tinted icon tile (theme palette only). */
export function Kpi({ icon, tone = 'brand', tint, num, lbl, sub }: {
  icon: string; tone?: KpiTone; tint?: string; num: ReactNode; lbl: string; sub: string;
}) {
  return (
    <div className="kpi">
      <span
        className={`ic ic--${tone}`}
        style={tint ? { background: tint, color: 'var(--ink)' } : undefined}
      >
        <Icon name={icon} size={18} />
      </span>
      <span className="kpi-copy">
        <span className="num">{num}</span>
        <div className="lbl">{lbl}</div>
        <div className="sub">{sub}</div>
      </span>
    </div>
  );
}

/** Page heading used consistently across every screen. */
export function PageHeader({ title, subtitle, actions }: {
  title: string; subtitle?: ReactNode; actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-header__copy">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
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
      <div className="donut-center">
        <strong>{total}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}
