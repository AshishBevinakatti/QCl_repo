import { useEffect, useState } from 'react';
import {
  apiHealth, availability, board, bookRoom, businessToday, checkIn, checkOut, confirmPayment,
  folioByStay, initiatePayment, isAuthError,
  listCategories, listReservations, requestRefund, rupees, transferStay,
  walkIn,
  type CategoryDto, type FolioDto,
  type ReservationSummary, type RoomBoard,
} from './api';
import { demoBoard, demoCategories, demoFolio } from './demo';
import { Alert, Badge, Btn, Card, Field, Soon, statusTone } from './ui';
import { DashboardView, RoomsView, Sidebar, Topbar, type Jump, type Mode, type View } from './dashboard';
import { initAuthOnce } from './auth';
import { GuestsView } from './guests';
import { OpsView } from './ops/OpsView';

/**
 * Golden Hills ERP workspace. Live mode talks to erp-app as the signed-in
 * staff member (Keycloak SSO); Preview mode runs on labeled sample data.
 */
export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [mode, setMode] = useState<Mode>('preview');
  const [api, setApi] = useState('checking…');
  const [jump, setJump] = useState<(Jump & { nonce: number }) | null>(null);
  const [folioStay, setFolioStay] = useState<string | null>(null);
  const [folioJump, setFolioJump] = useState(0);

  useEffect(() => {
    apiHealth()
      .then((h) => setApi(`${h.status}`))
      .catch(() => setApi('unreachable'));
    initAuthOnce();
  }, []);

  function go(v: View) {
    setView(v);
  }

  function onJump(j: Jump) {
    setJump({ ...j, nonce: Date.now() });
    setView(j.view);
  }

  return (
    <div className="erp">
      <Sidebar view={view} go={go} mode={mode} setMode={setMode} />
      <main className="main">
        <Topbar onJump={onJump} api={api} />
        {mode === 'preview' && view === 'dashboard' && (
          <p className="muted" style={{ marginTop: 0 }}>Preview mode — layout with sample counts. Guest names are never invented: log in for live rows.</p>
        )}
        {view === 'dashboard' && <DashboardView mode={mode} go={go} onJump={onJump} viewFolio={(stayId) => { setFolioStay(stayId); setFolioJump((n) => n + 1); setView('billing'); }} />}
        {view === 'reservations' && <BookView mode={mode} />}
        {view === 'guests' && (
          <GuestsView mode={mode} initialQ={jump?.view === 'guests' ? jump.q : undefined} jumpNonce={jump?.nonce} />
        )}
        {view === 'rooms' && <RoomsView mode={mode} initialFilter={jump?.view === 'rooms' ? jump.roomFilter : undefined} />}
        {view === 'check' && <FrontView mode={mode} initialReservationId={jump?.view === 'check' ? jump.reservationId : undefined} initialBookingStatus={jump?.view === 'check' ? jump.bookingStatus : undefined} jumpNonce={jump?.nonce} />}
        {view === 'billing' && <BillingView mode={mode} initialStayId={folioStay} folioNonce={folioJump} />}
        {view === 'requests' && (
          <div className="panel">
            <div className="phead"><h3>Service Requests</h3></div>
            <Soon icon="build" title="Coming soon" why="No service-request API yet — guest and maintenance requests arrive in a later unit." />
          </div>
        )}
        {view === 'housekeeping' && <HousekeepingView mode={mode} />}
        {view === 'reports' && (
          <div className="panel">
            <div className="phead"><h3>Reports</h3></div>
            <Soon icon="bar_chart" title="Coming soon" why="No reporting API yet — occupancy and revenue reports arrive in a later unit." />
          </div>
        )}
        {view === 'ops' && <OpsView mode={mode} />}
        {view === 'settings' && (
          <div className="panel">
            <div className="phead"><h3>Settings</h3></div>
            <Soon icon="settings" title="Coming soon" why="Property configuration editing arrives in a later unit." />
          </div>
        )}
      </main>
    </div>
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

function LoginHint() {
  return (
    <Alert kind="info">
      This screen needs sign-in — use the Staff log in button in the sidebar.
      Meanwhile, switch to Preview above to review the design.
    </Alert>
  );
}

/* ---------------- Front office ---------------- */
function FrontView({ mode, initialReservationId, initialBookingStatus, jumpNonce }: {
  mode: Mode; initialReservationId?: string; initialBookingStatus?: string; jumpNonce?: number;
}) {
  const [reservationId, setReservationId] = useState(initialReservationId ?? '');
  const [stayId, setStayId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState('');
  const [bookings, setBookings] = useState<ReservationSummary[]>([]);
  const [bdate, setBdate] = useState(businessToday());

  useEffect(() => {
    if (initialReservationId) setReservationId(initialReservationId);
    // 3.8: View-all jumps preload today's bookings on the desk (filtered).
    if (initialBookingStatus !== undefined && mode === 'live') {
      const d = businessToday();
      setBdate(d);
      listReservations(d, initialBookingStatus || undefined)
        .then(setBookings)
        .catch(() => setMsg('Bookings need login.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpNonce]);

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
        <div className="tbl-wrap"><table className="tbl">
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
        </table></div>
        {bookings.length === 0 && <p className="muted">No bookings loaded yet — pick a date and Load.</p>}
      </Card>
      {ok && <Alert kind="ok">{ok}</Alert>}
      {msg && <Alert kind="err">{msg}</Alert>}
    </div>
  );
}

/* ---------------- Billing ---------------- */
function BillingView({ mode, initialStayId, folioNonce }: {
  mode: Mode; initialStayId?: string | null; folioNonce?: number;
}) {
  const [stayId, setStayId] = useState(initialStayId ?? '');
  const [folio, setFolio] = useState<FolioDto | null>(mode === 'preview' ? demoFolio : null);
  const [paymentId, setPaymentId] = useState('');
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState('');

  useEffect(() => {
    if (!initialStayId || mode !== 'live') return;
    setStayId(initialStayId);
    folioByStay(initialStayId)
      .then((f) => { setFolio(f); setMsg(''); })
      .catch(() => setMsg('Folio needs login.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folioNonce]);

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
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Charge</th><th>Amount</th></tr></thead>
              <tbody>
                {folio.entries.map((e, i) => (
                  <tr key={i}><td>{e.sourceType}</td><td>{rupees(e.amountPaise)}</td></tr>
                ))}
              </tbody>
            </table></div>
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
      <div className="tbl-wrap"><table className="tbl">
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
      </table></div>
      <p className="muted">Cleaning advances a task todo → doing → inspect → done; done rooms turn ready for reception.</p>
    </Card>
  );
}
