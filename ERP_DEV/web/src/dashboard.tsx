import { useEffect, useRef, useState } from 'react';
import {
  alerts, board, businessToday, checkIn, checkOut, confirmPayment, confirmReservation, dashboard, departures,
  enrichSummaries, guestById, inHouseGuests, initiatePayment, isAuthError, listCategories, listReservations,
  rupees, searchGuests, searchReservationsByRef,
  type AlertDto, type DashboardDto, type DepartureDto, type EnrichedReservation, type InHouseDto,
} from './api';
import { isAuthenticated, login, logout, username } from './auth';
import { can, canSee, PREVIEW_PERSONAS, type Perms } from './access';
import { demoBoard, demoDashboard } from './demo';
import { currentTheme, toggleTheme, type Theme } from './theme';
import { Badge, Btn, Icon, KeyTag, ShareBar, Stat, statusLabel, statusTone } from './ui';

export type View =
  | 'dashboard' | 'reservations' | 'guests' | 'rooms' | 'check'
  | 'billing' | 'requests' | 'housekeeping' | 'reports' | 'ops' | 'settings' | 'leads';
export type Mode = 'live' | 'preview';

export interface Jump {
  view: View;
  q?: string;
  reservationId?: string;
  roomFilter?: string;
  /** 3.8: preload the check desk's bookings list for today, filtered ('' = all). */
  bookingStatus?: string;
}

/* Room-status → board bucket. Backend stores free-form lowercase strings;
 * anything unknown counts as ready — mapping is documented in
 * docs/04-modules/erp-03-front-office.md, not hidden. */
const MAINT = new Set(['dirty', 'cleaning', 'inspect', 'out_of_order', 'maintenance']);
function bucket(status: string): 'ready' | 'occupied' | 'attention' {
  if (status === 'occupied') return 'occupied';
  if (MAINT.has(status)) return 'attention';
  return 'ready';
}

/* What the board says about a room, in the words the desk would use. */
const SLOT_STATE: Record<'ready' | 'occupied' | 'attention', string> = {
  ready: 'Ready',
  occupied: 'With guest',
  attention: 'Needs work',
};

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'leads', label: 'Sales leads', icon: 'call' },
  { id: 'reservations', label: 'Reservations', icon: 'calendar_month' },
  { id: 'guests', label: 'Guests', icon: 'group' },
  { id: 'rooms', label: 'Room management', icon: 'bed' },
  { id: 'check', label: 'Front office', icon: 'swap_horiz' },
  { id: 'billing', label: 'Billing & payments', icon: 'receipt_long' },
  { id: 'requests', label: 'Service requests', icon: 'build' },
  { id: 'housekeeping', label: 'Housekeeping', icon: 'cleaning_services' },
  { id: 'reports', label: 'Reports', icon: 'bar_chart' },
  { id: 'ops', label: 'Ops console', icon: 'monitoring' },
];

export function viewLabel(v: View): string {
  return NAV.find((n) => n.id === v)?.label ?? 'Settings';
}

/* The keycap shows the modifier this machine actually has. The desk runs
 * Windows; showing ⌘ there is a shortcut nobody can press. */
function shortcutKey(): string {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
  return mac ? '⌘K' : 'Ctrl K';
}

/* ---------------- Sidebar ---------------- */
const SIDEBAR_KEY = 'gh-sidebar-collapsed';

export function Sidebar({ view, go, mode, setMode, mobileOpen, onClose, perms, who, persona, setPersona }: {
  view: View; go: (v: View) => void; mode: Mode; setMode: (m: Mode) => void;
  mobileOpen: boolean; onClose: () => void;
  perms: Perms; who: { name: string; dept: string } | null;
  persona: string; setPersona: (id: string) => void;
}) {
  const authed = isAuthenticated();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const focusBefore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      focusBefore?.focus();
    };
  }, [mobileOpen, onClose]);

  function toggleCollapsed() {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      } catch {
        /* ignore unavailable storage */
      }
      return next;
    });
  }

  function choose(next: View) {
    go(next);
    onClose();
  }

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        id="erp-sidebar"
        className={`sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-copy"><strong>Golden Hills</strong><small>Resort ERP</small></span>
            <span className="brand-mark" aria-hidden="true">GH</span>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={18} />
          </button>
          <button
            ref={closeRef}
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {import.meta.env.DEV && (
        <div className="mode-toggle" role="group" aria-label="Data mode">
          <button
            className={mode === 'live' ? 'active' : ''}
            onClick={() => setMode('live')}
            title="Live data"
          >
            Live
          </button>
          <button
            className={mode === 'preview' ? 'active' : ''}
            onClick={() => setMode('preview')}
            title="Preview layout"
          >
            Preview
          </button>
        </div>
        )}
        {import.meta.env.DEV && mode === 'preview' && (
          <label className="persona-select">
            Preview as
            <select value={persona} onChange={(e) => setPersona(e.target.value)}>
              {PREVIEW_PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
        )}

        <nav className="nav nav--primary">
          {NAV.filter((n) => canSee(n.id, perms)).map((n) => (
            <button
              key={n.id}
              className={view === n.id ? 'active' : ''}
              onClick={() => choose(n.id)}
              title={collapsed ? n.label : undefined}
              aria-current={view === n.id ? 'page' : undefined}
            >
              <Icon name={n.icon} size={18} />
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="side-foot">
          {who ? (
            <div className="usercard">
              <span className="avatar">{(who.name || '?').slice(0, 1).toUpperCase()}</span>
              <span className="who"><strong>{who.name}</strong><small>{who.dept}</small></span>
            </div>
          ) : (
            <div className="usercard">
              <span className="avatar">?</span>
              <span className="who"><strong>Not signed in</strong><small>{mode === 'preview' ? 'Sample data' : 'Live needs sign-in'}</small></span>
            </div>
          )}
          <nav className="nav nav--utility">
            {canSee('settings', perms) && (
            <button
              className={view === 'settings' ? 'active' : ''}
              onClick={() => choose('settings')}
              title={collapsed ? 'Settings' : undefined}
              aria-current={view === 'settings' ? 'page' : undefined}
            >
              <Icon name="settings" size={18} />
              <span className="nav-label">Settings</span>
            </button>
            )}
            {authed ? (
              <button onClick={logout} title={collapsed ? 'Logout' : undefined}>
                <Icon name="logout" size={18} />
                <span className="nav-label">Logout</span>
              </button>
            ) : (
              <button onClick={() => login()} title={collapsed ? 'Staff sign-in' : undefined}>
                <Icon name="login" size={18} />
                <span className="nav-label">Staff sign-in</span>
              </button>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Topbar ---------------- */
export function Topbar({ onJump, api, onMenu, perms }: {
  onJump: (j: Jump) => void; api: string; onMenu: () => void; perms: Perms;
}) {
  const searchGuestsOk = can(perms, 'guests:view');
  const searchBookingsOk = can(perms, 'bookings:view');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ kind: string; label: string; sub: string; jump: Jump }[]>([]);
  const [msg, setMsg] = useState('');
  const [now, setNow] = useState(new Date());
  const [theme, setTheme] = useState<Theme>(() => currentTheme());
  const seq = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Debounced as-you-type search; Enter runs it immediately (see submit).
  useEffect(() => {
    window.clearTimeout(timer.current);
    const query = q.trim();
    if (!query) {
      seq.current++;
      setHits([]);
      setMsg('');
      return;
    }
    timer.current = window.setTimeout(() => void run(query), 300);
    return () => window.clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    window.clearTimeout(timer.current);
    void run(query);
  }

  async function run(query: string) {
    const my = ++seq.current;
    setMsg('Searching…');
    setHits([]);
    const out: { kind: string; label: string; sub: string; jump: Jump }[] = [];
    let anyOk = false;
    let anyErr = false;
    if (searchGuestsOk) {
      try {
        const g = await searchGuests(query);
        anyOk = true;
        for (const item of g.items.slice(0, 5)) {
          out.push({
            kind: 'Guest', label: item.name, sub: item.phone,
            jump: { view: 'guests', q: item.phone },
          });
        }
      } catch { anyErr = true; }
    }
    if (searchBookingsOk && /^[0-9a-f-]{8,}$/i.test(query)) {
      try {
        const found = await searchReservationsByRef(query);
        anyOk = true;
        for (const r of found.slice(0, 3)) {
          let name = r.guestId;
          try { name = (await guestById(r.guestId)).name; } catch { /* id fallback */ }
          out.push({
            kind: 'Booking', label: `${r.id.slice(0, 8).toUpperCase()} — ${name}`,
            sub: `${r.checkinDate} → ${r.checkoutDate} · ${r.status}`,
            jump: { view: 'check', reservationId: r.id },
          });
        }
      } catch { anyErr = true; }
    }
    try {
      const d = await dashboard(businessToday());
      anyOk = true;
      for (const r of d.rooms.filter((rm) => rm.roomNo.toLowerCase().includes(query.toLowerCase())).slice(0, 5)) {
        out.push({
          kind: 'Room', label: `Room ${r.roomNo}`, sub: r.status,
          jump: { view: 'rooms', roomFilter: r.roomNo },
        });
      }
    } catch { anyErr = true; }
    if (my !== seq.current) return; // superseded by a newer search/clear — never overwrite
    setHits(out);
    setMsg(
      out.length > 0
        ? ''
        : anyErr && !anyOk
          ? 'Search unavailable — log in, or check the backend is up.'
          : 'No matches — try a guest name, phone, booking ID, or room number.',
    );
  }

  const dateStr = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(now);
  const timeStr = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(now);
  const apiUp = api === 'UP';

  function clearSearch() {
    setHits([]);
    setMsg('');
    setQ('');
    searchRef.current?.blur();
  }

  return (
    <div className="topbar-wrap">
      <header className="topbar">
        <button type="button" className="menu-btn" onClick={onMenu} aria-label="Open navigation" aria-controls="erp-sidebar">
          <Icon name="menu" size={20} />
        </button>
        <div className="topbar-title">
          <strong>Golden Hills Resort</strong>
          <span className="sub">{dateStr} · {timeStr}</span>
        </div>
        {(searchGuestsOk || searchBookingsOk) && (
        <form className="searchbox" onSubmit={submit}>
          <Icon name="search" size={18} />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') clearSearch();
            }}
            placeholder="Search"
            aria-label="Search guests, bookings and rooms"
          />
          <kbd>{shortcutKey()}</kbd>
        </form>
        )}
        <span className={`api-pill${apiUp ? '' : ' is-down'}`} title={`API ${api}`}>
          <span className="api-dot" />
          {apiUp ? 'Online' : api}
        </span>
        <button
          type="button"
          className="iconbtn"
          onClick={() => setTheme(toggleTheme())}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-pressed={theme === 'dark'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
        <button
          type="button"
          className="iconbtn"
          title="Notifications — no notification system yet; live alerts are on the dashboard"
          aria-label="Notifications"
        >
          <Icon name="notifications" size={18} />
        </button>
      </header>

      {msg && (
        <div className="search-panel">
          <p className="search-note" role="status">{msg}</p>
        </div>
      )}
      {hits.length > 0 && (
        <div className="search-panel">
          {hits.map((h, i) => (
            <div key={i} className="search-hit">
              <Badge>{h.kind}</Badge>
              <span className="search-hit-copy">
                <strong>{h.label}</strong>
                <small>{h.sub}</small>
              </span>
              <Btn ghost onClick={() => { onJump(h.jump); setHits([]); setQ(''); }}>Open</Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
export function DashboardView({ mode, go, viewFolio, onJump = () => {} }: {
  mode: Mode; go: (v: View) => void; viewFolio: (stayId: string) => void;
  onJump?: (j: Jump) => void;
}) {
  const today = businessToday();
  const [dash, setDash] = useState<DashboardDto | null>(mode === 'preview' ? demoDashboard : null);
  const [arrivals, setArrivals] = useState<EnrichedReservation[]>([]);
  const [bookings, setBookings] = useState<EnrichedReservation[]>([]);
  const [departuresList, setDeparturesList] = useState<DepartureDto[]>([]);
  const [inhouseList, setInhouseList] = useState<InHouseDto[]>([]);
  const [alertList, setAlertList] = useState<AlertDto[]>([]);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(mode !== 'preview');
  const [msg, setMsg] = useState('');
  const [acting, setActing] = useState<string | null>(null);
  const [ok, setOk] = useState('');
  /* Captured advance refs per booking id (this session). The collect call uses a
   * stable idempotency key, so re-collecting after a reload replays — never charges twice. */
  const [receipts, setReceipts] = useState<Record<string, string>>({});

  async function load() {
    if (mode === 'preview') {
      setDash(demoDashboard);
      setArrivals([]); setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const [d, c] = await Promise.all([dashboard(today), listCategories()]);
      setDash(d); setDenied(false); setMsg('');
      setArrivals(d.arrivals.slice(0, 25).map((a) => ({ ...a, ref: a.id.slice(0, 8) })));
      const recent = await listReservations(today);
      setBookings(await enrichSummaries(recent.slice(0, 8), c.items));
      const [dep, inh, al] = await Promise.all([
        departures(today), inHouseGuests(), alerts(),
      ]);
      setDeparturesList(dep); setInhouseList(inh); setAlertList(al);
    } catch (err) {
      if (isAuthError(err)) setDenied(true);
      else setMsg(err instanceof Error ? err.message : 'Dashboard failed.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [mode]);

  async function doCheckIn(id: string) {
    setActing(id); setOk(''); setMsg('');
    try {
      await checkIn(id);
      setOk('Checked in — room auto-assigned by the front office.');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Check-in failed.');
    } finally {
      setActing(null);
    }
  }

  async function doCheckOut(stayId: string) {
    setActing(stayId); setOk(''); setMsg('');
    try {
      await checkOut(stayId);
      setOk('Checked out — room flagged dirty, cleaning task opened.');
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Check-out failed.');
    } finally {
      setActing(null);
    }
  }

  async function collectAdvance(b: EnrichedReservation) {
    setActing(b.id); setOk(''); setMsg('');
    try {
      const init = await initiatePayment({
        reservationId: b.id, idempotencyKey: `advance-${b.id}`,
      });
      const paid = await confirmPayment(init.gatewayRef, init.signature);
      setReceipts((m) => ({ ...m, [b.id]: paid.gatewayRef }));
      setOk(
        `Advance ${rupees(paid.amountPaise)} captured (sandbox ref ${paid.gatewayRef}) — ` +
        `press Confirm to confirm booking ${b.ref}.`,
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Advance capture failed.');
    } finally {
      setActing(null);
    }
  }

  async function doConfirm(id: string) {
    setActing(id); setOk(''); setMsg('');
    try {
      await confirmReservation(id);
      setOk('Booking confirmed.');
      await load();
    } catch (err) {
      // Backend gate wording (422: advance not collected / only holds can be confirmed) shown as-is.
      setMsg(err instanceof Error ? err.message : 'Confirm failed.');
    } finally {
      setActing(null);
    }
  }

  if (mode === 'live' && !dash && denied) {
    return (
      <div className="panel">
        <p>This dashboard needs sign-in — use Staff sign-in in the sidebar.</p>
        <p className="muted">To look at the layout without a backend, switch to Preview.</p>
      </div>
    );
  }
  if (mode === 'live' && !dash && loading) {
    return <div className="panel"><p className="muted">Loading dashboard…</p></div>;
  }
  if (mode === 'live' && !dash && msg) return <div className="panel"><p>{msg}</p></div>;
  if (!dash) return null;

  const total = dash.rooms.length;
  const avail = dash.rooms.filter((r) => bucket(r.status) === 'ready').length;
  const occ = dash.rooms.filter((r) => bucket(r.status) === 'occupied').length;
  const attention = total - avail - occ;

  const dayStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(`${today}T00:00:00`));

  return (
    <>
      {/* The date names the shift. No greeting, no tagline. */}
      <div className="day-head">
        <div>
          <h1>{dayStr}</h1>
          <p>
            {isAuthenticated() ? `Signed in as ${username()}` : 'Preview — no live data'} · business date {today}
          </p>
        </div>
      </div>

      {/* A label, a figure, what it is out of. Nothing else. */}
      <div className="stats">
        <Stat label="Arriving" num={dash.arrivals.length} sub="expected today" />
        <Stat label="Leaving" num={departuresList.length} sub="expected today" />
        <Stat label="In house" num={dash.inHouse.length} sub="guests staying now" />
        <Stat label="Ready to let" num={avail} sub={`of ${total} rooms`} lead />
        <Stat label="Needs work" num={attention} sub="before it can be let" />
      </div>

      {ok && <p className="alert ok">{ok}</p>}
      {msg && <p className="alert err">{msg}</p>}

      {/* The board and what needs a person: the one wide object, and a narrow
        * list of a different kind beside it. */}
      <div className="dash-board-row">
      {/* The key rack — every room as a tag on the board behind reception.
        * A hung tag is a room you can let; a tag that is out is with a guest. */}
      <div className="keyrack">
        <div className="phead">
          <h3>Key rack</h3>
          <span className="phead-count">{total} rooms</span>
          <button type="button" className="phead-link" onClick={() => go('rooms')}>
            Open rooms <Icon name="arrow_forward" size={14} />
          </button>
        </div>
        {total === 0 ? (
          <p className="keyrack-empty">No rooms configured for this property yet.</p>
        ) : (
          <>
            <div className="keyrack-board">
              {dash.rooms.map((r) => {
                const b = bucket(r.status);
                return (
                  <div
                    key={r.id}
                    className={`keytag-slot is-${b}${b === 'occupied' ? ' is-out' : ''}`}
                    title={`Room ${r.roomNo} — ${r.status}`}
                  >
                    <KeyTag no={r.roomNo} large />
                    <span className="keytag-state">{SLOT_STATE[b]}</span>
                  </div>
                );
              })}
            </div>
            <div className="keyrack-share">
              <ShareBar
                total={total}
                parts={[
                  { label: 'Ready', value: avail, color: 'var(--room-ready)' },
                  { label: 'With guest', value: occ, color: 'var(--room-occupied)' },
                  { label: 'Needs work', value: attention, color: 'var(--room-attention)' },
                ]}
              />
            </div>
          </>
        )}
        <p className="keyrack-foot">
          Rooms carry no reserved state — a reservation holds a category, not a room, so a
          room shows as ready until someone is checked into it.
        </p>
      </div>

      <div className="panel dash-panel dash-panel--alerts">
        <div className="phead"><h3>Needs attention</h3></div>
        {alertList.length === 0 ? (
          <p className="muted">Nothing outstanding.</p>
        ) : (
          <ul className="alert-list">
            {alertList.map((a) => (
              <li key={a.ref + a.text} className={`is-${a.severity}`}>
                <span className="dot" />
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="panel-foot">
          Guest requests and maintenance issues arrive in a later unit — no source system yet.
        </p>
      </div>
      </div>

      <div className="dash-columns">
        <div className="dash-column">
          {/* Columns the backend cannot fill (arrival time, party size) are not
            * shipped as a column of dashes — they are simply not columns. */}
          <div className="panel dash-panel dash-panel--arrivals">
            <div className="phead">
              <h3>Arriving today</h3>
              <span className="phead-count">{dash.arrivals.length}</span>
              <button type="button" className="phead-link" onClick={() => onJump({ view: 'check', bookingStatus: 'confirmed' })}>
                Open front office <Icon name="arrow_forward" size={14} />
              </button>
            </div>
            {arrivals.length === 0 ? (
              <p className="muted">No arrivals expected today.</p>
            ) : (
              <div className="tbl-wrap dtbl-wrap"><table className="dtbl dtbl-arrivals">
                <thead><tr><th>Guest</th><th>Booking</th><th>Room type</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {arrivals.map((a) => (
                    <tr key={a.id}>
                      <td data-label="Guest" title={a.guestName}>{a.guestName}</td>
                      <td data-label="Booking" className="ref" title={a.id}>{a.ref}</td>
                      <td data-label="Room type">{a.category}</td>
                      <td data-label="Status"><Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge></td>
                      <td data-label="Action">
                        <span className="row-actions">
                          <button className="mini-btn primary" disabled={acting === a.id} onClick={() => doCheckIn(a.id)}>
                            {acting === a.id ? 'Checking in' : 'Check in'}
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>

          <div className="panel dash-panel dash-panel--departures">
            <div className="phead">
              <h3>Leaving today</h3>
              <span className="phead-count">{departuresList.length}</span>
              <button type="button" className="phead-link" onClick={() => onJump({ view: 'check', bookingStatus: 'checked-in' })}>
                Open front office <Icon name="arrow_forward" size={14} />
              </button>
            </div>
            {departuresList.length === 0 ? (
              <p className="muted">No departures expected today.</p>
            ) : (
              <div className="tbl-wrap dtbl-wrap"><table className="dtbl dtbl-departures">
                <thead><tr><th>Guest</th><th>Room</th><th>Nights</th><th className="num">Outstanding</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {departuresList.map((d) => (
                    <tr key={d.stayId}>
                      <td data-label="Guest" title={d.guestName}>{d.guestName}</td>
                      <td data-label="Room"><KeyTag no={d.roomNo} /></td>
                      <td data-label="Nights">{d.nights}</td>
                      <td data-label="Outstanding" className="num">{rupees(d.outstandingPaise)}</td>
                      <td data-label="Status"><Badge tone={d.status === 'Ready' ? 'green' : 'amber'}>{d.status === 'Ready' ? 'Settled' : d.status}</Badge></td>
                      <td data-label="Action">
                        <span className="row-actions">
                          {d.status === 'Ready' ? (
                            <button className="mini-btn primary" disabled={acting === d.stayId} onClick={() => doCheckOut(d.stayId)}>
                              {acting === d.stayId ? 'Checking out' : 'Check out'}
                            </button>
                          ) : (
                            <button className="mini-btn" onClick={() => viewFolio(d.stayId)}>Open folio</button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>

          <div className="panel dash-panel dash-panel--recent">
            <div className="phead">
              <h3>Booked today</h3>
              <span className="phead-count">{bookings.length}</span>
              <button type="button" className="phead-link" onClick={() => onJump({ view: 'check', bookingStatus: '' })}>
                Open front office <Icon name="arrow_forward" size={14} />
              </button>
            </div>
            {bookings.length === 0 ? (
              <p className="muted">No bookings on this date.</p>
            ) : (
              <div className="tbl-wrap dtbl-wrap"><table className="dtbl dtbl-bookings">
                <thead><tr><th>Guest</th><th>Booking</th><th>Stay</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td data-label="Guest" title={b.guestName}>{b.guestName}</td>
                      <td data-label="Booking" className="ref" title={b.id}>{b.ref}</td>
                      <td data-label="Stay">{b.checkinDate} → {b.checkoutDate}</td>
                      <td data-label="Status"><Badge tone={statusTone(b.status)}>{statusLabel(b.status)}</Badge></td>
                      <td data-label="Action">
                        <span className="row-actions">
                          {b.status === 'hold' ? (
                            b.advanceDuePaise > 0 && !receipts[b.id] ? (
                              <>
                                <button className="mini-btn primary" disabled={acting === b.id} onClick={() => collectAdvance(b)}>
                                  {acting === b.id ? 'Collecting' : `Collect ${rupees(b.advanceDuePaise)}`}
                                </button>
                                <button className="mini-btn" disabled title="The advance has to be collected before a hold can be confirmed">Confirm</button>
                              </>
                            ) : (
                              <>
                                {receipts[b.id] && <span className="muted" title={receipts[b.id]}>Advance captured</span>}
                                <button className="mini-btn primary" disabled={acting === b.id} onClick={() => doConfirm(b.id)}>
                                  {acting === b.id ? 'Confirming' : 'Confirm'}
                                </button>
                              </>
                            )
                          ) : b.status === 'expired' ? (
                            <button
                              type="button"
                              className="mini-btn"
                              title="This hold expired before the advance was collected, and an expired hold cannot be revived"
                              onClick={() => go('reservations')}
                            >
                              Rebook
                            </button>
                          ) : (
                            <span className="muted">No action</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>

          <div className="panel dash-panel dash-panel--inhouse">
            <div className="phead">
              <h3>In house</h3>
              <span className="phead-count">{inhouseList.length}</span>
            </div>
            {inhouseList.length === 0 ? (
              <p className="muted">No guests currently staying.</p>
            ) : (
              <div className="tbl-wrap dtbl-wrap"><table className="dtbl dtbl-inhouse">
                <thead><tr><th>Guest</th><th>Room</th><th>Leaving</th><th>Status</th></tr></thead>
                <tbody>
                  {inhouseList.map((s) => (
                    <tr key={s.stayId}>
                      <td data-label="Guest" title={s.guestName}>{s.guestName}</td>
                      <td data-label="Room"><KeyTag no={s.roomNo} /></td>
                      <td data-label="Leaving">{s.checkoutDate ?? 'Open ended'}</td>
                      <td data-label="Status"><Badge tone="green">{s.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Room Management ---------------- */
export function RoomsView({ mode, initialFilter }: { mode: Mode; initialFilter?: string }) {
  const [rooms, setRooms] = useState<{ id: string; roomNo: string; status: string }[]>(
    mode === 'preview' ? demoDashboard.rooms : []);
  const [filter, setFilter] = useState(initialFilter ?? '');
  const [msg, setMsg] = useState('');

  useEffect(() => { setFilter(initialFilter ?? ''); }, [initialFilter]);

  useEffect(() => {
    if (mode === 'preview') { setRooms(demoDashboard.rooms); return; }
    dashboard(businessToday())
      .then((d) => setRooms(d.rooms))
      .catch((err) => setMsg(err instanceof Error ? err.message : 'Rooms need login.'));
  }, [mode]);

  const shown = rooms.filter((r) => r.roomNo.toLowerCase().includes(filter.toLowerCase()));
  const count = (b: 'ready' | 'occupied' | 'attention') =>
    shown.filter((r) => bucket(r.status) === b).length;

  return (
    <div className="panel">
      <div className="phead">
        <h3>Key rack</h3>
        <span className="phead-count">{shown.length} of {rooms.length}</span>
      </div>
      <div className="search-inline">
        <Icon name="search" size={18} />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Room number" aria-label="Filter rooms by number" />
      </div>
      {msg && <p className="alert err">{msg}</p>}
      <div className="rooms-legend" style={{ marginTop: 16 }}>
        <span className="rowline"><span className="dot" style={{ background: 'var(--room-ready)' }} />Ready {count('ready')}</span>
        <span className="rowline"><span className="dot" style={{ background: 'var(--room-occupied)' }} />With guest {count('occupied')}</span>
        <span className="rowline"><span className="dot" style={{ background: 'var(--room-attention)' }} />Needs work {count('attention')}</span>
      </div>
      <div className="roomgrid">
        {shown.map((r) => {
          const b = bucket(r.status);
          return (
            <div
              className={`keytag-slot is-${b}${b === 'occupied' ? ' is-out' : ''}`}
              key={r.id}
              title={`Room ${r.roomNo} — ${r.status}`}
            >
              <KeyTag no={r.roomNo} large />
              <span className="keytag-state">{statusLabel(r.status)}</span>
            </div>
          );
        })}
      </div>
      {shown.length === 0 && <p className="muted">No room matches that number.</p>}
    </div>
  );
}

/* ---------------- Housekeeping preview helper ---------------- */
export async function previewBoard(mode: Mode) {
  if (mode === 'preview') return demoBoard;
  return board();
}
