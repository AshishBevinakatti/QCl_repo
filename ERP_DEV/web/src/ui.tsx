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
  KeyRound,
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
  SprayCan,
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
  children, onClick, ghost, type, disabled, title,
}: {
  children: ReactNode;
  onClick?: () => void;
  ghost?: boolean;
  type?: 'submit' | 'button';
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type={type ?? 'button'}
      className={ghost ? 'btn ghost' : 'btn'}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

/**
 * A figure, what it is, and what it is out of. Deliberately only those three —
 * icons, sparklines and mini bars in a stat card read as decoration.
 * `lead` marks the single figure that matters most on a screen.
 */
export function Stat({ label, num, sub, lead }: {
  label: string; num: ReactNode; sub?: string; lead?: boolean;
}) {
  return (
    <div className={lead ? 'stat is-lead' : 'stat'}>
      <span className="stat-label">{label}</span>
      <span className="stat-num">{num}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export function Badge({ tone, children }: { tone?: 'green' | 'amber' | 'red'; children: ReactNode }) {
  return <span className={tone ? `badge ${tone}` : 'badge'}>{children}</span>;
}

/**
 * Backend statuses are lowercase tokens (`checked-in`, `out_of_order`). They are
 * the API contract, so they stay as they are in the data and read as words here.
 */
export function statusLabel(status: string): string {
  const words = status.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function statusTone(status: string): 'green' | 'amber' | 'red' | undefined {
  if (['confirmed', 'checked-in', 'active', 'ready', 'captured', 'processed'].includes(status)) return 'green';
  if (['hold', 'todo', 'doing', 'inspect', 'pending', 'requested', 'approved'].includes(status)) return 'amber';
  if (['cancelled', 'expired', 'failed', 'dirty', 'rejected'].includes(status)) return 'red';
  return undefined;
}

/**
 * The signature detail: a room number is always a brass key tag, and a room
 * number is never set any other way.
 */
export function KeyTag({ no, large }: { no: string; large?: boolean }) {
  return <span className={large ? 'keytag keytag--lg' : 'keytag'}>{no}</span>;
}

/**
 * A share of a whole as one stacked bar. Replaces a donut whose slices each
 * shouted equally: here one series leads and the rest are steps of the ramp.
 */
export function ShareBar({ parts, total }: {
  parts: { label: string; value: number; color: string }[]; total: number;
}) {
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  return (
    <div>
      <div className="sharebar">
        {parts.map((p) => (
          <span
            key={p.label}
            style={{ width: `${total === 0 ? 0 : (p.value / total) * 100}%`, background: p.color }}
          />
        ))}
      </div>
      <div className="sharebar-legend">
        {parts.map((p) => (
          <span className="rowline" key={p.label}>
            <span className="dot" style={{ background: p.color }} />
            {p.label}
            <span className="n">{p.value} · {pct(p.value)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* One icon set, one size, one stroke. Icons take the colour of their text
 * role and never carry a colour of their own. The Material-style keys are kept
 * so call sites and tests stay valid. */
const MATERIAL_ICONS: Record<string, ComponentType<LucideProps>> = {
  home: LayoutDashboard,
  calendar_month: CalendarDays,
  group: Users,
  groups: UsersRound,
  bed: BedDouble,
  hotel: Hotel,
  key: KeyRound,
  swap_horiz: ArrowLeftRight,
  receipt_long: ReceiptText,
  build: Wrench,
  /* Housekeeping is cleaning, not sparkle. */
  cleaning_services: SprayCan,
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
  return <Component className="icon" size={size ?? 18} strokeWidth={1.5} aria-hidden data-icon={name} />;
}

/** Honest placeholder where no backend endpoint exists yet (never fake rows). */
export function EmptyState({ icon, title, description, action }: {
  icon?: string; title: string; description?: ReactNode; action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state__icon"><Icon name={icon} size={18} /></span>}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}

export function Soon({ icon, title, why }: { icon: string; title: string; why: string }) {
  return <EmptyState icon={icon} title={title} description={why} />;
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
