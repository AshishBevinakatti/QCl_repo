import { useEffect, useRef, useState } from 'react';
import bannerImg from './assets/banner.jpg';
import {
  alerts, board, businessToday, checkIn, checkOut, confirmPayment, confirmReservation, dashboard, departures,
  enrichSummaries, guestById, inHouseGuests, initiatePayment, isAuthError, listCategories, listReservations,
  rupees, searchGuests, searchReservationsByRef,
  type AlertDto, type DashboardDto, type DepartureDto, type EnrichedReservation, type InHouseDto,
} from './api';
import { hasRole, isAuthenticated, login, logout, roles, username } from './auth';
import { demoBoard, demoDashboard } from './demo';
import { Badge, Btn, Donut, Icon, Kpi, statusTone } from './ui';

export type View =
  | 'dashboard' | 'reservations' | 'guests' | 'rooms' | 'check'
  | 'billing' | 'requests' | 'housekeeping' | 'reports' | 'ops' | 'settings';
export type Mode = 'live' | 'preview';

export interface Jump {
  view: View;
  q?: string;
  reservationId?: string;
  roomFilter?: string;
  /** 3.8: preload the check desk's bookings list for today, filtered ('' = all). */
  bookingStatus?: string;
}

/* Room-status → donut bucket. Backend stores free-form lowercase strings;
 * anything unknown counts as Available (ready-like) — mapping is documented
 * in docs/04-modules/erp-03-front-office.md, not hidden. */
const MAINT = new Set(['dirty', 'cleaning', 'inspect', 'out_of_order', 'maintenance']);
function bucket(status: string): 'available' | 'occupied' | 'maint' {
  if (status === 'occupied') return 'occupied';
  if (MAINT.has(status)) return 'maint';
  return 'available';
}

const NAV: { id: View; label: string; icon: string; ops?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'reservations', label: 'Reservations', icon: 'calendar_month' },
  { id: 'guests', label: 'Guests', icon: 'group' },
  { id: 'rooms', label: 'Room Management', icon: 'bed' },
  { id: 'check', label: 'Check-in / Check-out', icon: 'swap_horiz' },
  { id: 'billing', label: 'Billing & Payments', icon: 'receipt_long' },
  { id: 'requests', label: 'Service Requests', icon: 'build' },
  { id: 'housekeeping', label: 'Housekeeping', icon: 'cleaning_services' },
  { id: 'reports', label: 'Reports', icon: 'bar_chart' },
  { id: 'ops', label: 'Ops Console', icon: 'monitoring', ops: true },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ---------------- Sidebar ---------------- */
export function Sidebar({ view, go, mode, setMode }: {
  view: View; go: (v: View) => void; mode: Mode; setMode: (m: Mode) => void;
}) {
  const authed = isAuthenticated();
  const canOps = hasRole(
    'SUPERADMIN', 'OPS_VIEWER', 'OPS_DEVELOPER', 'OPS_OPERATOR', 'OPS_ADMIN', 'OPS_APPROVER',
  );
  return (
    <aside className="sidebar">
      <div className="brand">Golden Hills<small>Resort ERP</small></div>
      <div className="mode-toggle" role="group" aria-label="data mode">
        <button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>Live</button>
        <button className={mode === 'preview' ? 'active' : ''} onClick={() => setMode('preview')}>Preview</button>
      </div>
      <nav className="nav">
        {NAV.filter((n) => !n.ops || canOps).map((n) => (
          <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => go(n.id)}>
            <Icon name={n.icon} />{n.label}
          </button>
        ))}
      </nav>
      <div className="side-foot">
        {authed ? (
          <div className="usercard">
            <span className="avatar">{(username() || '?').slice(0, 1).toUpperCase()}</span>
            <span className="who"><strong>{username()}</strong><small>{roles().join(', ') || 'staff'}</small></span>
          </div>
        ) : (
          <div className="usercard">
            <span className="avatar">?</span>
            <span className="who"><strong>Not signed in</strong><small>{mode === 'preview' ? 'preview data' : 'live needs login'}</small></span>
          </div>
        )}
        <nav className="nav">
          <button className={view === 'settings' ? 'active' : ''} onClick={() => go('settings')}>
            <Icon name="settings" />Settings
          </button>
          {authed
            ? <button onClick={logout}><Icon name="logout" />Logout</button>
            : <button onClick={login}><Icon name="login" />Staff log in</button>}
        </nav>
      </div>
    </aside>
  );
}

/* ---------------- Topbar ---------------- */
export function Topbar({ onJump, api }: {
  onJump: (j: Jump) => void; api: string;
}) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ kind: string; label: string; sub: string; jump: Jump }[]>([]);
  const [msg, setMsg] = useState('');
  const [now, setNow] = useState(new Date());
  const seq = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
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
    if (/^[0-9a-f-]{8,}$/i.test(query)) {
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

  return (
    <div>
      <div className="topbar-new">
        <form className="searchbox" onSubmit={submit}>
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guest, booking ID, room number…" aria-label="Search" />
          <kbd>⌘ K</kbd>
        </form>
        <span className="clock"><strong>{dateStr}</strong>{timeStr} · {api}</span>
        <button className="iconbtn" title="Notifications — no notification system yet; live alerts are on the dashboard"><Icon name="notifications" /></button>
      </div>
      {msg && <p className="muted">{msg}</p>}
      {hits.length > 0 && (
        <div className="panel" style={{ marginBottom: '1rem' }}>
          {hits.map((h, i) => (
            <div key={i} className="row" style={{ alignItems: 'center', padding: '0.25rem 0' }}>
              <Badge>{h.kind}</Badge>
              <span><strong>{h.label}</strong> <span className="muted">{h.sub}</span></span>
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
      setDeparturesList([]); setInhouseList([]); setAlertList([]);
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
        <p>This dashboard needs sign-in — use the <strong>Staff log in</strong> button in the sidebar.</p>
        <p className="muted">Meanwhile, switch to Preview above to review the layout.</p>
      </div>
    );
  }
  if (mode === 'live' && !dash && loading) {
    return <div className="panel"><p className="muted">Loading dashboard…</p></div>;
  }
  if (mode === 'live' && !dash && msg) return <div className="panel"><p>{msg}</p></div>;
  if (!dash) return null;

  const total = dash.rooms.length;
  const avail = dash.rooms.filter((r) => bucket(r.status) === 'available').length;
  const occ = dash.rooms.filter((r) => bucket(r.status) === 'occupied').length;
  const maint = total - avail - occ;
  const ready = dash.rooms.filter((r) => bucket(r.status) === 'maint').length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  return (
    <>
      <div className="banner">
        <img src={bannerImg} alt="" />
        <div className="shade" />
        <div className="txt">
          <h2>{greeting()}, {isAuthenticated() ? username() : 'there'}</h2>
          <p>Here&apos;s what&apos;s happening at Golden Hills Resort today.</p>
        </div>
        <div className="tag">Make every stay<br />a memorable experience.</div>
      </div>

      <div className="kpis">
        <Kpi icon="bed" tint="var(--brand)" num={avail} lbl="Rooms Available" sub={`out of ${total} rooms`} />
        <Kpi icon="event_available" tint="var(--gold)" num={dash.arrivals.length} lbl="Expected Arrivals" sub="Today" />
        <Kpi icon="event_busy" tint="#8a8f85" num={mode === 'preview' ? '—' : departuresList.length} lbl="Expected Departures" sub="Today" />
        <Kpi icon="groups" tint="#274b9b" num={dash.inHouse.length} lbl="In-House Guests" sub="Currently staying" />
        <Kpi icon="cleaning_services" tint="var(--danger)" num={ready} lbl="Rooms Awaiting Readiness" sub="Housekeeping in progress" />
      </div>

      {ok && <div className="panel" style={{ marginBottom: '0.9rem' }}>{ok}</div>}
      {msg && <div className="panel" style={{ marginBottom: '0.9rem' }}>{msg}</div>}

      <div className="dash-grid">
        <div className="panel">
          <div className="phead"><h3>Today&apos;s Arrivals ({dash.arrivals.length})</h3><a onClick={() => onJump({ view: 'check', bookingStatus: 'confirmed' })}>View all <Icon name="arrow_forward" size={14} /></a></div>
          {mode === 'preview' ? (
            <p className="muted">Preview shows the layout only — guest rows are never invented. Log in for live arrivals.</p>
          ) : arrivals.length === 0 ? (
            <p className="muted">No arrivals expected today.</p>
          ) : (
            <div className="tbl-wrap"><table className="dtbl">
              <thead><tr><th>Time</th><th>Guest Name</th><th>Booking ID</th><th>Room Type</th><th>Guests</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {arrivals.map((a) => (
                  <tr key={a.id}>
                    <td title="Check-in times are not stored — dates only">—</td>
                    <td className="ell" title={a.guestName}>{a.guestName}</td>
                    <td title={a.id}>{a.ref}</td>
                    <td>{a.category}</td>
                    <td title="Party size is not stored on a reservation">—</td>
                    <td><Badge tone={statusTone(a.status)}>{a.status === 'confirmed' ? 'Confirmed' : a.status}</Badge></td>
                    <td>
                      <button className="mini-btn" disabled={acting === a.id} onClick={() => doCheckIn(a.id)}>
                        {acting === a.id ? '…' : 'Check In'}
                      </button>{' '}
                      <button className="mini-btn" title="Row actions — coming soon">…</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>

        <div className="panel">
          <div className="phead"><h3>Room Status Overview</h3><a onClick={() => go('rooms')}>View all <Icon name="arrow_forward" size={14} /></a></div>
          <div className="donut-wrap">
            <Donut
              total={total} label="Total Rooms"
              slices={[
                { value: avail, color: '#2e7d32' },
                { value: occ, color: '#d84a4a' },
                { value: maint, color: '#b98a2f' },
              ]}
            />
            <div className="donut-legend">
              <span className="rowline"><span className="dot" style={{ background: '#2e7d32' }} />Available<span className="n">{avail} ({pct(avail)}%)</span></span>
              <span className="rowline"><span className="dot" style={{ background: '#d84a4a' }} />Occupied<span className="n">{occ} ({pct(occ)}%)</span></span>
              <span className="rowline" title="Rooms carry no reserved status — reservations hold categories, not rooms"><span className="dot" style={{ background: '#274b9b' }} />Reserved<span className="n">—</span></span>
              <span className="rowline"><span className="dot" style={{ background: '#b98a2f' }} />Maintenance<span className="n">{maint} ({pct(maint)}%)</span></span>
            </div>
          </div>
          <div className="minis">
            <div className="mini"><Icon name="bed" /><span><span className="num">{avail}</span><div className="lbl">Available</div></span></div>
            <div className="mini"><Icon name="hotel" /><span><span className="num">{occ}</span><div className="lbl">Occupied</div></span></div>
            <div className="mini"><Icon name="event_busy" /><span><span className="num">—</span><div className="lbl">Reserved</div></span></div>
            <div className="mini"><Icon name="build" /><span><span className="num">{maint}</span><div className="lbl">Maintenance</div></span></div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="phead"><h3>Today&apos;s Departures ({mode === 'preview' ? 0 : departuresList.length})</h3><a onClick={() => onJump({ view: 'check', bookingStatus: 'checked-in' })}>View all <Icon name="arrow_forward" size={14} /></a></div>
          {mode === 'preview' ? (
            <p className="muted">Preview shows the layout only — log in for live departures.</p>
          ) : departuresList.length === 0 ? (
            <p className="muted">No departures expected today.</p>
          ) : (
            <div className="tbl-wrap"><table className="dtbl">
              <thead><tr><th>Time</th><th>Guest Name</th><th>Room</th><th>Stay Duration</th><th>Outstanding</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {departuresList.map((d) => (
                  <tr key={d.stayId}>
                    <td title="Check-out times are not stored — dates only">—</td>
                    <td className="ell" title={d.guestName}>{d.guestName}</td>
                    <td>{d.roomNo}</td>
                    <td>{d.nights} night{d.nights === 1 ? '' : 's'}</td>
                    <td>{rupees(d.outstandingPaise)}</td>
                    <td><Badge tone={d.status === 'Ready' ? 'green' : 'amber'}>{d.status}</Badge></td>
                    <td>
                      {d.status === 'Ready' ? (
                        <button className="mini-btn" disabled={acting === d.stayId} onClick={() => doCheckOut(d.stayId)}>
                          {acting === d.stayId ? '…' : 'Check Out'}
                        </button>
                      ) : (
                        <button className="mini-btn" onClick={() => viewFolio(d.stayId)}>View Folio</button>
                      )}{' '}
                      <button className="mini-btn" title="Row actions — coming soon">…</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
        <div className="panel">
          <div className="phead"><h3>Alerts &amp; Pending Tasks</h3></div>
          {mode === 'preview' ? (
            <p className="muted">Preview shows the layout only — log in for live alerts.</p>
          ) : alertList.length === 0 ? (
            <p className="muted">All clear — no pending alerts.</p>
          ) : (
            <div className="donut-legend">
              {alertList.map((a) => (
                <span className="rowline" key={a.ref + a.text}>
                  <span className="dot" style={{ background: a.severity === 'high' ? '#d84a4a' : a.severity === 'medium' ? '#b98a2f' : '#274b9b' }} />
                  {a.text}
                </span>
              ))}
            </div>
          )}
          <p className="muted">Guest requests and maintenance issues arrive in a later unit — no source system yet.</p>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr 0.9fr' }}>
        <div className="panel">
          <div className="phead"><h3>Recent Bookings</h3><a onClick={() => onJump({ view: 'check', bookingStatus: '' })}>View all <Icon name="arrow_forward" size={14} /></a></div>
          {mode === 'preview' || bookings.length === 0 ? (
            <p className="muted">{mode === 'preview' ? 'Preview shows the layout only — log in for live bookings.' : 'No bookings on this date.'}</p>
          ) : (
            <div className="tbl-wrap"><table className="dtbl">
              <thead><tr><th>Guest Name</th><th>Booking ID</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="ell" title={b.guestName}>{b.guestName}</td><td title={b.id}>{b.ref}</td>
                    <td>{b.checkinDate}</td><td>{b.checkoutDate}</td>
                    <td><Badge tone={statusTone(b.status)}>{b.status}</Badge></td>
                    <td>
                      {b.status === 'hold' ? (
                        b.advanceDuePaise > 0 && !receipts[b.id] ? (
                          <>
                            <button className="mini-btn" disabled={acting === b.id} onClick={() => collectAdvance(b)}>
                              {acting === b.id ? '…' : `Collect advance ${rupees(b.advanceDuePaise)}`}
                            </button>{' '}
                            <button className="mini-btn" disabled title="Collect the advance first">Confirm</button>
                          </>
                        ) : (
                          <>
                            {receipts[b.id] && <span className="muted" title={receipts[b.id]}>✓ Advance captured </span>}
                            <button className="mini-btn" disabled={acting === b.id} onClick={() => doConfirm(b.id)}>
                              {acting === b.id ? '…' : 'Confirm'}
                            </button>
                          </>
                        )
                      ) : b.status === 'expired' ? (
                        <a className="muted" title="Expired before the advance was collected — expired holds are terminal" onClick={() => go('reservations')}>
                          expired — rebook
                        </a>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
        <div className="panel">
          <div className="phead"><h3>In-House Guests ({mode === 'preview' ? 0 : inhouseList.length})</h3></div>
          {mode === 'preview' ? (
            <p className="muted">Preview shows the layout only — log in for live rows.</p>
          ) : inhouseList.length === 0 ? (
            <p className="muted">No guests currently staying.</p>
          ) : (
            <div className="tbl-wrap"><table className="dtbl">
              <thead><tr><th>Guest Name</th><th>Room</th><th>Check-out</th><th>Status</th></tr></thead>
              <tbody>
                {inhouseList.map((s) => (
                  <tr key={s.stayId}>
                    <td className="ell" title={s.guestName}>{s.guestName}</td><td>{s.roomNo}</td>
                    <td>{s.checkoutDate ?? '—'}</td>
                    <td><Badge tone="green">{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
        <div className="promo">
          <img src={bannerImg} alt="" />
          <div className="shade" />
          <div className="txt">
            <strong>Need to assign a room quickly?</strong>
            <p>Check available rooms and assign to a guest.</p>
            <button className="go" onClick={() => go('rooms')}>Manage Rooms <Icon name="arrow_forward" size={15} /></button>
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
  return (
    <div className="panel">
      <div className="phead"><h3>Rooms ({shown.length})</h3></div>
      <div className="row" style={{ marginBottom: '0.7rem' }}>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by room number…" aria-label="Filter rooms" />
      </div>
      {msg && <p className="muted">{msg}</p>}
      <div className="roomgrid">
        {shown.map((r) => (
          <div className="roomcell" key={r.id}>
            <div className="no">{r.roomNo}</div>
            <Badge tone={statusTone(r.status)}>{r.status}</Badge>
          </div>
        ))}
      </div>
      {shown.length === 0 && <p className="muted">No rooms match.</p>}
    </div>
  );
}

/* ---------------- Housekeeping preview helper ---------------- */
export async function previewBoard(mode: Mode) {
  if (mode === 'preview') return demoBoard;
  return board();
}
