import { useEffect, useState } from 'react';
import {
  HttpError, apiHealth, availability, board, bookRoom, checkIn, checkOut, confirmPayment,
  createGuest, dashboard, enrollMember, folioByStay, guestById, initiatePayment, isAuthError,
  listCategories, listReservations, redeemPoints, requestRefund, rupees, searchGuests, transferStay,
  walkIn,
  type CategoryDto, type DashboardDto, type FolioDto, type GuestDto, type MemberDto,
  type ReservationSummary, type RoomBoard,
} from './api';
import { demoBoard, demoCategories, demoDashboard, demoFolio, demoGuests, demoMember } from './demo';
import { Alert, Badge, Btn, Card, Field, Stat, statusTone } from './ui';
import { initAuthOnce, isAuthenticated, login, logout, roles, username } from './auth';

type View = 'dashboard' | 'book' | 'front' | 'guests' | 'members' | 'billing' | 'housekeeping';
type Mode = 'live' | 'preview';

const NAV: { id: View; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'book', label: 'Book a room' },
  { id: 'front', label: 'Front office' },
  { id: 'guests', label: 'Guests' },
  { id: 'members', label: 'Members' },
  { id: 'billing', label: 'Billing' },
  { id: 'housekeeping', label: 'Housekeeping' },
];

/**
 * Golden Hills ERP workspace. Live mode talks to erp-app as the signed-in
 * staff member (Keycloak SSO); Preview mode runs on labeled sample data.
 */
export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [mode, setMode] = useState<Mode>('preview');
  const [api, setApi] = useState('checking…');
  const [apiUp, setApiUp] = useState(false);
  const [authTick, setAuthTick] = useState(0);
  const authed = isAuthenticated();

  useEffect(() => {
    apiHealth()
      .then((h) => { setApi(`${h.status} (${h.service})`); setApiUp(true); })
      .catch(() => { setApi('unreachable — start erp-app (DAY-ONE §5)'); setApiUp(false); });
    initAuthOnce().then(() => setAuthTick((t) => t + 1));
  }, []);

  return (
    <div className="erp">
      <aside className="sidebar">
        <div className="brand">Golden Hills<small>Resort ERP</small></div>
        <div className="mode-toggle" role="group" aria-label="data mode">
          <button className={mode === 'live' ? 'active' : ''} onClick={() => setMode('live')}>Live</button>
          <button className={mode === 'preview' ? 'active' : ''} onClick={() => setMode('preview')}>Preview</button>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button key={n.id} className={view === n.id ? 'active' : ''} onClick={() => setView(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          {authed ? (
            <>
              <div style={{ fontWeight: 700, color: '#fff' }}>{username()}</div>
              <div>{roles().join(', ') || 'no roles'}</div>
              <button className="btn ghost" style={{ marginTop: 6 }} onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <div>Not signed in.</div>
              <button className="btn ghost" style={{ marginTop: 6 }} onClick={login}>Staff log in</button>
              <div style={{ marginTop: 6 }}>
                {mode === 'preview' ? 'Preview: sample data, nothing is saved.' : 'Live needs sign-in.'}
              </div>
            </>
          )}
        </div>
      </aside>
      <main className="main" key={`${mode}-${authed}-${authTick}`}>
        <div className="topbar">
          <h1>{NAV.find((n) => n.id === view)!.label}</h1>
          <span className="sub">{mode === 'preview' ? 'Sample data' : authed ? `Live · ${username()}` : 'Live server data'}</span>
          <span className={apiUp ? 'status-pill' : 'status-pill down'}>API: {api}</span>
        </div>
        {mode === 'preview' && (
          <Alert kind="info">Preview mode — sample data for review. Log in for live data.</Alert>
        )}
        {view === 'dashboard' && <DashboardView mode={mode} />}
        {view === 'book' && <BookView mode={mode} />}
        {view === 'front' && <FrontView mode={mode} />}
        {view === 'guests' && <GuestsView mode={mode} />}
        {view === 'members' && <MembersView mode={mode} />}
        {view === 'billing' && <BillingView mode={mode} />}
        {view === 'housekeeping' && <HousekeepingView mode={mode} />}
      </main>
    </div>
  );
}

function LoginHint() {
  return (
    <Alert kind="info">
      This screen needs sign-in — use the Staff log in button in the sidebar.
      Meanwhile, switch to Preview above to review the design.
    </Alert>
  );
}

/* ---------------- Dashboard ---------------- */
function DashboardView({ mode }: { mode: Mode }) {
  const [dash, setDash] = useState<DashboardDto | null>(mode === 'preview' ? demoDashboard : null);
  const [denied, setDenied] = useState(false);
  const [msg, setMsg] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function load(d: string) {
    if (mode === 'preview') { setDash({ ...demoDashboard, date: d }); return; }
    try { setDash(await dashboard(d)); setMsg(''); setDenied(false); }
    catch (err) {
      if (isAuthError(err)) { setDenied(true); setMsg(''); }
      else setMsg(err instanceof Error ? err.message : 'Dashboard failed.');
    }
  }

  useEffect(() => { load(date); /* eslint-disable-next-line */ }, [mode]);

  if (mode === 'live' && !dash && denied) return <LoginHint />;
  if (mode === 'live' && !dash && msg) return <Alert kind="err">{msg}</Alert>;
  return (
    <>
      <div className="row" style={{ marginBottom: '1rem' }}>
        <Field label="Business date">
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); load(e.target.value); }} />
        </Field>
        <Btn ghost onClick={() => load(date)}>Refresh</Btn>
      </div>
      {dash && (
        <>
          <div className="grid">
            <Stat num={dash.arrivals.length} lbl="Arrivals today" />
            <Stat num={dash.inHouse.length} lbl="In-house" />
            {dash.occupancy.map((o) => (
              <Stat key={o.categoryId} num={`${o.occupied}/${o.total}`} lbl={`${o.category} occupied`} />
            ))}
          </div>
          <Card title="Rooms">
            <table className="tbl">
              <thead><tr><th>Room</th><th>Status</th></tr></thead>
              <tbody>
                {dash.rooms.map((r) => (
                  <tr key={r.id}><td>{r.roomNo}</td><td><Badge tone={statusTone(r.status)}>{r.status}</Badge></td></tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}

/* ---------------- Book ---------------- */
function BookView({ mode }: { mode: Mode }) {
  const [cats, setCats] = useState<CategoryDto[]>(mode === 'preview' ? demoCategories : []);
  const [cat, setCat] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [promo, setPromo] = useState('WELCOME10');
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState('');

  useEffect(() => {
    if (mode === 'live') listCategories().then((p) => setCats(p.items)).catch(() => setMsg('login'));
    else setCats(demoCategories);
  }, [mode]);

  if (mode === 'live' && cats.length === 0 && msg) return <LoginHint />;

  async function check() {
    setMsg(''); setOk('');
    if (mode === 'preview') { setOk('8 of 10 Deluxe free (sample)'); return; }
    try {
      const a = await availability(cat, from, to);
      setOk(`${a.available} of ${a.totalRooms} free`);
    } catch { setMsg('Could not check — log in first.'); }
  }

  async function book(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setOk('');
    if (mode === 'preview') { setOk('Preview: booking is not saved. Connect Live to book for real.'); return; }
    try {
      const r = await bookRoom(name, phone, cat, from, to, promo || undefined);
      setOk(`Held ${r.nights} night(s) — quote ${rupees(r.quotedTotalPaise)}, advance due ${rupees(r.advanceDuePaise)} (ref ${r.id.slice(0, 8)}…)`);
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Booking failed.'); }
  }

  return (
    <>
      <Card title="Check availability">
        <div className="row">
          <Field label="Category">
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Choose…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name} — {rupees(c.basePricePaise)}</option>)}
            </select>
          </Field>
          <Field label="Check-in"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="Check-out"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Btn ghost onClick={check}>Check</Btn>
        </div>
      </Card>
      <Card title="Guest & booking">
        <form onSubmit={book}>
          <div className="row">
            <Field label="Guest name"><input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
            <Field label="Promo (optional)"><input value={promo} onChange={(e) => setPromo(e.target.value)} /></Field>
            <Btn type="submit">Book room</Btn>
          </div>
        </form>
        {ok && <Alert kind="ok">{ok}</Alert>}
        {msg && <Alert kind="err">{msg}</Alert>}
      </Card>
    </>
  );
}

/* ---------------- Front office ---------------- */
function FrontView({ mode }: { mode: Mode }) {
  const [reservationId, setReservationId] = useState('');
  const [stayId, setStayId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState('');
  const [bookings, setBookings] = useState<ReservationSummary[]>([]);
  const [bdate, setBdate] = useState(new Date().toISOString().slice(0, 10));

  async function act(label: string, fn: () => Promise<{ id: string; status: string }>) {
    setMsg(''); setOk('');
    if (mode === 'preview') { setOk(`Preview: “${label}” is not saved.`); return; }
    try {
      const s = await fn();
      setOk(`${label}: stay ${s.id.slice(0, 8)}… is now ${s.status}. Full stay id: ${s.id}`);
      setStayId(s.id);
    } catch (err) { setMsg(err instanceof Error ? err.message : `${label} failed — log in first.`); }
  }

  async function loadBookings() {
    setMsg('');
    if (mode === 'preview') return;
    try { setBookings(await listReservations(bdate)); }
    catch (err) { setMsg(err instanceof Error ? err.message : 'Bookings need login.'); }
  }

  function copy(text: string) {
    void navigator.clipboard?.writeText(text).catch(() => {});
  }

  async function doWalkIn() {
    setMsg(''); setOk('');
    if (mode === 'preview') { setOk('Preview: walk-in is not saved.'); return; }
    try {
      const cats = await listCategories();
      const s = await walkIn('Walk-in Guest', '+91-9000000000', cats.items[0].id);
      setOk(`Walk-in checked in: ${s.id.slice(0, 8)}…`);
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Walk-in failed.'); }
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      <Card title="Check in">
        <Field label="Reservation id"><input value={reservationId} onChange={(e) => setReservationId(e.target.value)} /></Field>
        <Field label="Room id (optional — auto-assigns)"><input value={roomId} onChange={(e) => setRoomId(e.target.value)} /></Field>
        <p><Btn onClick={() => act('Checked in', () => checkIn(reservationId, roomId || undefined))}>Check in</Btn></p>
      </Card>
      <Card title="Check out / transfer">
        <Field label="Stay id"><input value={stayId} onChange={(e) => setStayId(e.target.value)} /></Field>
        <p className="row">
          <Btn onClick={() => act('Checked out', () => checkOut(stayId))}>Check out</Btn>
          <Btn ghost onClick={() => act('Transferred', () => transferStay(stayId, roomId, 'desk move'))}>Transfer</Btn>
        </p>
      </Card>
      <Card title="Walk-in">
        <p className="muted">Books tonight, collects advance, checks in — one step.</p>
        <p><Btn onClick={doWalkIn}>Walk in guest</Btn></p>
      </Card>
      <Card title="Bookings on date — pick an id, no memorising">
        <div className="row">
          <Field label="Date"><input type="date" value={bdate} onChange={(e) => setBdate(e.target.value)} /></Field>
          <Btn ghost onClick={loadBookings}>Load bookings</Btn>
        </div>
        <table className="tbl">
          <thead><tr><th>Booking ref</th><th>Dates</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td><code>{b.id.slice(0, 8)}…</code></td>
                <td>{b.checkinDate} → {b.checkoutDate}</td>
                <td><Badge tone={statusTone(b.status)}>{b.status}</Badge></td>
                <td><Btn ghost onClick={() => { setReservationId(b.id); copy(b.id); }}>Use</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <p className="muted">No bookings loaded yet — pick a date and Load.</p>}
      </Card>
      {ok && <Alert kind="ok">{ok}</Alert>}
      {msg && <Alert kind="err">{msg}</Alert>}
    </div>
  );
}

/* ---------------- Guests ---------------- */
function GuestsView({ mode }: { mode: Mode }) {
  const [q, setQ] = useState('');
  const [guests, setGuests] = useState<GuestDto[]>(mode === 'preview' ? demoGuests : []);
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState('');
  const [cerr, setCerr] = useState('');
  const [dupId, setDupId] = useState<string | null>(null);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault(); setMsg('');
    if (mode === 'preview') {
      setGuests(demoGuests.filter((g) => (g.name + g.phone).toLowerCase().includes(q.toLowerCase())));
      return;
    }
    try { setGuests((await searchGuests(q)).items); }
    catch { setMsg('Search needs login.'); }
  }

  async function runCreate(e: React.FormEvent) {
    e.preventDefault(); setCerr(''); setOk(''); setDupId(null);
    if (mode === 'preview') { setOk('Preview: guest is not saved.'); return; }
    try {
      const g = await createGuest(name, phone);
      setOk(`Created ${g.name}.`); setName(''); setPhone('');
      setGuests((await searchGuests(g.phone)).items);
    } catch (err) {
      // GUEST_EXISTS carries the existing profile id in details (no raw UUID in text).
      if (err instanceof HttpError && err.code === 'GUEST_EXISTS' && err.details?.existingGuestId) {
        setCerr('This phone number is already registered to a guest.');
        setDupId(err.details.existingGuestId);
      } else {
        setCerr(err instanceof Error ? err.message : 'Create failed.');
      }
    }
  }

  async function showDuplicate() {
    setCerr('');
    try {
      const g = await guestById(dupId!);
      setQ(g.phone); setGuests([g]);
    } catch { setCerr('Could not load the existing profile.'); }
  }

  return (
    <>
      <Card title="Find guests">
        <form onSubmit={runSearch}>
          <div className="row">
            <Field label="Name or phone"><input value={q} onChange={(e) => setQ(e.target.value)} /></Field>
            <Btn type="submit" ghost>Search</Btn>
          </div>
        </form>
        {msg && <Alert kind="err">{msg}</Alert>}
        <table className="tbl">
          <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Member</th></tr></thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id}>
                <td>{g.name}</td><td>{g.phone}</td>
                <td><Badge tone={statusTone(g.status)}>{g.status}</Badge></td>
                <td>{g.memberId ? '★ member' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="New guest">
        <form onSubmit={runCreate}>
          <div className="row">
            <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
            <Btn type="submit">Add guest</Btn>
          </div>
        </form>
        {ok && <Alert kind="ok">{ok}</Alert>}
        {cerr && <Alert kind="err">{cerr}</Alert>}
        {dupId && <p><Btn ghost onClick={showDuplicate}>Show the existing guest</Btn></p>}
      </Card>
    </>
  );
}

/* ---------------- Members ---------------- */
function MembersView({ mode }: { mode: Mode }) {
  const [guestId, setGuestId] = useState('');
  const [member, setMember] = useState<MemberDto | null>(mode === 'preview' ? demoMember : null);
  const [folioId, setFolioId] = useState(''); const [points, setPoints] = useState('100');
  const [msg, setMsg] = useState('');

  async function enroll(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    if (mode === 'preview') { setMember(demoMember); return; }
    try { setMember(await enrollMember(guestId)); }
    catch (err) { setMsg(err instanceof Error ? err.message : 'Enroll needs login.'); }
  }

  async function redeem(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    if (!member) return;
    if (mode === 'preview') { setMsg('Preview: points are not spent.'); return; }
    try { setMember(await redeemPoints(member.id, folioId, parseInt(points, 10))); }
    catch (err) { setMsg(err instanceof Error ? err.message : 'Redeem failed.'); }
  }

  return (
    <>
      <Card title="Enroll member">
        <form onSubmit={enroll}>
          <div className="row">
            <Field label="Guest id"><input value={guestId} onChange={(e) => setGuestId(e.target.value)} required /></Field>
            <Btn type="submit">Enroll</Btn>
          </div>
        </form>
        {msg && <Alert kind="err">{msg}</Alert>}
      </Card>
      {member && (
        <Card title="Member dashboard">
          <div className="grid">
            <Stat num={member.membershipNo} lbl="Membership no." />
            <Stat num={member.tier} lbl="Tier" />
            <Stat num={member.points} lbl="Points" />
            <Stat num={member.status} lbl={`Status (till ${member.validTo})`} />
          </div>
          <form onSubmit={redeem}>
            <div className="row">
              <Field label="Folio id"><input value={folioId} onChange={(e) => setFolioId(e.target.value)} required /></Field>
              <Field label="Points"><input value={points} onChange={(e) => setPoints(e.target.value)} required /></Field>
              <Btn type="submit" ghost>Redeem to folio</Btn>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}

/* ---------------- Billing ---------------- */
function BillingView({ mode }: { mode: Mode }) {
  const [stayId, setStayId] = useState('');
  const [folio, setFolio] = useState<FolioDto | null>(mode === 'preview' ? demoFolio : null);
  const [paymentId, setPaymentId] = useState('');
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState('');

  async function load() {
    setMsg('');
    if (mode === 'preview') { setFolio(demoFolio); return; }
    try { setFolio(await folioByStay(stayId)); }
    catch { setMsg('Folio needs login.'); }
  }

  async function pay(amount: number, reservationId?: string) {
    setMsg(''); setOk('');
    if (mode === 'preview') { setOk('Preview: no money moves.'); return; }
    try {
      const init = await initiatePayment(reservationId ? { reservationId } : { folioId: folio!.id, amount });
      await confirmPayment(init.gatewayRef, init.signature);
      setOk(`Captured ${rupees(init.amountPaise)} (sandbox).`);
      await load();
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Payment failed.'); }
  }

  return (
    <>
      <Card title="Guest folio">
        <div className="row">
          <Field label="Stay id"><input value={stayId} onChange={(e) => setStayId(e.target.value)} /></Field>
          <Btn ghost onClick={load}>Load folio</Btn>
        </div>
        {msg && <Alert kind="err">{msg}</Alert>}
        {folio && (
          <>
            <table className="tbl">
              <thead><tr><th>Charge</th><th>Amount</th></tr></thead>
              <tbody>
                {folio.entries.map((e, i) => (
                  <tr key={i}><td>{e.sourceType}</td><td>{rupees(e.amountPaise)}</td></tr>
                ))}
              </tbody>
            </table>
            <p><strong>Outstanding: {rupees(folio.outstandingPaise)}</strong></p>
            <p><Btn onClick={() => pay(folio.outstandingPaise)}>Pay balance (sandbox)</Btn></p>
          </>
        )}
        {ok && <Alert kind="ok">{ok}</Alert>}
      </Card>
      <Card title="Refund">
        <div className="row">
          <Field label="Payment id"><input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} /></Field>
          <Btn ghost onClick={async () => {
            setMsg(''); setOk('');
            if (mode === 'preview') { setOk('Preview: refund is not recorded.'); return; }
            try {
              await requestRefund(paymentId, 10000, 'desk goodwill');
              setOk('Refund requested — a manager approves it.');
            } catch (err) { setMsg(err instanceof Error ? err.message : 'Refund failed.'); }
          }}>
            Refund ₹100
          </Btn>
        </div>
      </Card>
    </>
  );
}

/* ---------------- Housekeeping ---------------- */
function HousekeepingView({ mode }: { mode: Mode }) {
  const [rooms, setRooms] = useState<RoomBoard[]>(mode === 'preview' ? demoBoard : []);
  const [denied, setDenied] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    if (mode === 'preview') { setRooms(demoBoard); return; }
    try { setRooms(await board()); setDenied(false); }
    catch (err) {
      if (isAuthError(err)) setDenied(true);
      else setMsg(err instanceof Error ? err.message : 'Board failed.');
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [mode]);

  if (mode === 'live' && rooms.length === 0 && denied) return <LoginHint />;
  if (mode === 'live' && rooms.length === 0 && msg) return <Alert kind="err">{msg}</Alert>;

  return (
    <Card title="Room readiness">
      {msg && <Alert kind="err">{msg}</Alert>}
      <p><Btn ghost onClick={load}>Refresh</Btn></p>
      <table className="tbl">
        <thead><tr><th>Room</th><th>Status</th><th>Open tasks</th></tr></thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.roomId}>
              <td>{r.roomNo}</td>
              <td><Badge tone={statusTone(r.status)}>{r.status}</Badge></td>
              <td>{r.openTasks}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Cleaning advances a task todo → doing → inspect → done; done rooms turn ready for reception.</p>
    </Card>
  );
}
