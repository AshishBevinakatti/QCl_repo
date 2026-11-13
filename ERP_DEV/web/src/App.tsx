import { useEffect, useMemo, useState } from 'react';
import {
  apiHealth, availability, board, bookRoom, businessToday, checkIn, checkOut, confirmPayment,
  enrichSummaries, folioByStay, initiatePayment, isAuthError, me,
  listCategories, listReservations, requestRefund, rupees, transferStay,
  walkIn,
  type CategoryDto, type EnrichedReservation, type FolioDto, type MeDto,
  type RoomBoard,
} from './api';
import { demoBoard, demoCategories, demoFolio } from './demo';
import { Alert, Badge, Btn, Card, Field, KeyTag, PageHeader, Soon, statusLabel, statusTone } from './ui';
import { DashboardView, RoomsView, Sidebar, Topbar, viewLabel, type Jump, type Mode, type View } from './dashboard';
import { initAuthOnce } from './auth';
import { canSee, departmentLabel, landingView, PREVIEW_PERSONAS } from './access';
import { AccessDenied, SignIn } from './SignIn';
import { GuestsView } from './guests';
import { LeadsView } from './leads';
import { OpsView } from './ops/OpsView';

/**
 * Golden Hills ERP workspace. Live mode talks to erp-app as the signed-in
 * staff member (Keycloak SSO) and shows only the screens /api/v1/me allows;
 * Preview mode (dev builds only) runs on labeled sample data and personas.
 */
export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [mode, setMode] = useState<Mode>('live');
  const [auth, setAuth] = useState<'checking' | 'in' | 'out'>('checking');
  const [account, setAccount] = useState<MeDto | null>(null);
  const [accountErr, setAccountErr] = useState('');
  const [persona, setPersona] = useState(PREVIEW_PERSONAS[0].id);
  const [api, setApi] = useState('checking…');
  const [jump, setJump] = useState<(Jump & { nonce: number }) | null>(null);
  const [folioStay, setFolioStay] = useState<string | null>(null);
  const [folioJump, setFolioJump] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    apiHealth()
      .then((h) => setApi(`${h.status}`))
      .catch(() => setApi('unreachable'));
    initAuthOnce().then((ok) => setAuth(ok ? 'in' : 'out'));
  }, []);

  useEffect(() => {
    if (auth !== 'in') return;
    me()
      .then(setAccount)
      .catch((err) => setAccountErr(err instanceof Error ? err.message : 'Could not load your access.'));
  }, [auth]);

  const previewPersona = PREVIEW_PERSONAS.find((p) => p.id === persona) ?? PREVIEW_PERSONAS[0];
  const perms = useMemo(
    () => new Set(mode === 'preview' ? previewPersona.permissions : account?.permissions ?? []),
    [mode, previewPersona, account],
  );
  const landing = landingView(perms);

  // Land once per permission set (sign-in, persona switch), not on every navigation.
  const [landedFor, setLandedFor] = useState<Set<string> | null>(null);
  if (landedFor !== perms) {
    setLandedFor(perms);
    if (landing) setView(landing);
  }

  function go(v: View) {
    setView(v);
    setNavOpen(false);
  }

  function onJump(j: Jump) {
    setJump({ ...j, nonce: Date.now() });
    setView(j.view);
    setNavOpen(false);
  }

  if (auth === 'checking') {
    return <main className="signin"><p className="signin-note">Loading…</p></main>;
  }
  if (mode === 'live' && auth === 'out') {
    return <SignIn onPreview={import.meta.env.DEV ? () => setMode('preview') : undefined} />;
  }
  if (mode === 'live' && !account) {
    return (
      <main className="signin">
        <section className="signin-card">
          {accountErr ? (
            <>
              <Alert kind="err">{accountErr}</Alert>
              <Btn onClick={() => window.location.reload()}>Retry</Btn>
            </>
          ) : (
            <p className="signin-note">Loading your workspace…</p>
          )}
        </section>
      </main>
    );
  }

  const who = mode === 'preview'
    ? { name: 'Preview', dept: `${previewPersona.label} (sample)` }
    : account && { name: account.username, dept: departmentLabel(account.roles) };

  return (
    <div className="erp">
      <Sidebar
        view={view}
        go={go}
        mode={mode}
        setMode={setMode}
        mobileOpen={navOpen}
        onClose={() => setNavOpen(false)}
        perms={perms}
        who={who}
        persona={persona}
        setPersona={setPersona}
      />
      <main className="main">
        <Topbar onJump={onJump} api={api} onMenu={() => setNavOpen(true)} perms={perms} />
        <div className="page-stack" key={mode}>
          {mode === 'preview' && view === 'dashboard' && (
            <p className="alert info">
              Preview mode — layout with sample counts. Guest names are never invented: sign in for live rows.
            </p>
          )}

          {landing === null ? (
            <AccessDenied what="any workspace yet (no permissions are assigned to your account)" />
          ) : !canSee(view, perms) ? (
            <AccessDenied what={viewLabel(view)} />
          ) : (
          <>
          {view === 'dashboard' && (
            <>
              <DashboardView
                mode={mode}
                go={go}
                onJump={onJump}
                viewFolio={(stayId) => {
                  setFolioStay(stayId);
                  setFolioJump((n) => n + 1);
                  setView('billing');
                }}
              />
            </>
          )}

          {view === 'leads' && (
            <LeadsView
              onViewGuest={(guestId) => onJump({ view: 'guests', q: guestId })}
            />
          )}

          {view === 'reservations' && (
            <>
              <PageHeader title="Book a room" subtitle="Check what is free, then hold a room for a guest" />
              <BookView mode={mode} />
            </>
          )}

          {view === 'guests' && (
            <GuestsView
              mode={mode}
              initialQ={jump?.view === 'guests' ? jump.q : undefined}
              jumpNonce={jump?.nonce}
              onOpenFrontOffice={(reservationId) => onJump({ view: 'check', reservationId })}
              onOpenBilling={(stayId) => {
                setFolioStay(stayId);
                setFolioJump((n) => n + 1);
                setView('billing');
              }}
            />
          )}

          {view === 'rooms' && (
            <>
              <PageHeader title="Rooms" subtitle="Every room and the state it is in right now" />
              <RoomsView mode={mode} initialFilter={jump?.view === 'rooms' ? jump.roomFilter : undefined} />
            </>
          )}

          {view === 'check' && (
            <>
              <PageHeader title="Front office" subtitle="Pick a booking, then check the guest in, out, or into another room" />
              <FrontView
                mode={mode}
                initialReservationId={jump?.view === 'check' ? jump.reservationId : undefined}
                initialBookingStatus={jump?.view === 'check' ? jump.bookingStatus : undefined}
                jumpNonce={jump?.nonce}
              />
            </>
          )}

          {view === 'billing' && (
            <>
              <PageHeader title="Billing" subtitle="What a stay owes, and settling it" />
              <BillingView mode={mode} initialStayId={folioStay} folioNonce={folioJump} />
            </>
          )}

          {view === 'requests' && (
            <>
              <PageHeader title="Service requests" subtitle="Guest and maintenance requests" />
              <div className="panel">
                <Soon
                  icon="build"
                  title="Not built yet"
                  why="There is no service-request API yet. Guest and maintenance requests arrive in a later unit, so this screen shows nothing rather than inventing rows."
                />
              </div>
            </>
          )}

          {view === 'housekeeping' && (
            <>
              <PageHeader title="Housekeeping" subtitle="Which rooms are ready to let, and what is still to do" />
              <HousekeepingView mode={mode} />
            </>
          )}

          {view === 'reports' && (
            <>
              <PageHeader title="Reports" subtitle="Occupancy and revenue reporting" />
              <div className="panel">
                <Soon
                  icon="bar_chart"
                  title="Not built yet"
                  why="There is no reporting API yet. Occupancy and revenue reports arrive in a later unit, so this screen shows nothing rather than inventing figures."
                />
              </div>
            </>
          )}

          {view === 'ops' && <OpsView mode={mode} />}

          {view === 'settings' && (
            <>
              <PageHeader title="Settings" subtitle="Property configuration" />
              <div className="panel">
                <Soon
                  icon="settings"
                  title="Not built yet"
                  why="Property configuration is held in the backend but cannot be edited here yet — editing arrives in a later unit."
                />
              </div>
            </>
          )}
          </>
          )}
        </div>
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
    } catch { setMsg('Could not check availability — sign in first.'); }
  }

  async function book(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setOk('');
    if (mode === 'preview') { setOk('Preview — this booking is not saved. Switch to Live to book for real.'); return; }
    try {
      const r = await bookRoom(name, phone, cat, from, to, promo || undefined);
      setOk(`Held ${r.nights} night(s) — quote ${rupees(r.quotedTotalPaise)}, advance due ${rupees(r.advanceDuePaise)} (ref ${r.id.slice(0, 8)}…)`);
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Booking failed.'); }
  }

  return (
    <div className="desk-grid desk-grid--2">
      <Card title="What is free">
        <div className="row">
          <Field label="Room type">
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Choose a room type</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name} — {rupees(c.basePricePaise)}</option>)}
            </select>
          </Field>
          <Field label="Arriving"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="Leaving"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Btn ghost onClick={check}>Check</Btn>
        </div>
      </Card>
      <Card title="Hold a room">
        <form onSubmit={book}>
          <div className="row">
            <Field label="Guest name"><input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
            <Field label="Promo code"><input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Optional" /></Field>
            <Btn type="submit">Hold room</Btn>
          </div>
        </form>
        {ok && <Alert kind="ok">{ok}</Alert>}
        {msg && <Alert kind="err">{msg}</Alert>}
      </Card>
    </div>
  );
}

function LoginHint() {
  return (
    <Alert kind="info">
      This screen needs sign-in — use Staff sign-in in the sidebar. To look at the layout
      without a backend, switch to Preview.
    </Alert>
  );
}

/* ---------------- Front office ----------------
 * The bookings list is the screen. Staff pick a row and act on it, instead of
 * copying a UUID out of one card and pasting it into another. The id field is
 * kept below the list for a record that is not on it. Same endpoints as before:
 * listReservations to fill the list, checkIn / checkOut / transferStay to act. */
function FrontView({ mode, initialReservationId, initialBookingStatus, jumpNonce }: {
  mode: Mode; initialReservationId?: string; initialBookingStatus?: string; jumpNonce?: number;
}) {
  const [reservationId, setReservationId] = useState(initialReservationId ?? '');
  const [stayId, setStayId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState('');
  /* Enriched, so the desk sees a guest name instead of only a uuid — the same
   * listReservations + listCategories pair the dashboard already uses. */
  const [bookings, setBookings] = useState<EnrichedReservation[]>([]);
  const [bdate, setBdate] = useState(businessToday());
  const [picked, setPicked] = useState<EnrichedReservation | null>(null);

  useEffect(() => {
    if (initialReservationId) setReservationId(initialReservationId);
    if (mode === 'preview') return;
    // 3.8: View-all jumps preload today's bookings on the desk (filtered).
    if (initialBookingStatus !== undefined) {
      const d = businessToday();
      setBdate(d);
      Promise.all([listReservations(d, initialBookingStatus || undefined), listCategories()])
        .then(([rows, cats]) => enrichSummaries(rows, cats.items))
        .then(setBookings)
        .catch(() => setMsg('Bookings need sign-in.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpNonce, mode]);

  async function act(label: string, fn: () => Promise<{ id: string; status: string }>) {
    setMsg(''); setOk('');
    if (mode === 'preview') { setOk(`Preview — ${label.toLowerCase()} is not saved.`); return; }
    try {
      const s = await fn();
      setOk(`${label} — stay ${s.id.slice(0, 8)} is now ${s.status}`);
      setStayId(s.id);
      await loadBookings();
    } catch (err) { setMsg(err instanceof Error ? err.message : `${label} failed — sign in first.`); }
  }

  async function loadBookings() {
    setMsg('');
    if (mode === 'preview') return;
    try {
      const [rows, cats] = await Promise.all([listReservations(bdate), listCategories()]);
      setBookings(await enrichSummaries(rows, cats.items));
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Bookings need sign-in.'); }
  }

  async function doWalkIn() {
    setMsg(''); setOk('');
    if (mode === 'preview') { setOk('Preview — a walk-in is not saved.'); return; }
    try {
      const cats = await listCategories();
      const s = await walkIn('Walk-in Guest', '+91-9000000000', cats.items[0].id);
      setOk(`Walk-in checked in as stay ${s.id.slice(0, 8)}`);
      await loadBookings();
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Walk-in failed.'); }
  }

  /* A row is chosen, so the action buttons know what they act on. */
  function pick(b: EnrichedReservation) {
    setPicked(b);
    setReservationId(b.id);
    setOk(''); setMsg('');
  }

  const target = reservationId || picked?.id || '';

  return (
    <div className="desk-grid--wide desk-grid">
      <div className="panel">
        <div className="phead">
          <h3>Bookings</h3>
          <span className="phead-count">{bookings.length}</span>
          <Btn ghost onClick={doWalkIn} title="Books tonight, collects the advance and checks the guest in, in one step">
            Walk-in guest
          </Btn>
        </div>
        <div className="row">
          <Field label="Business date"><input type="date" value={bdate} onChange={(e) => setBdate(e.target.value)} /></Field>
          <Btn ghost onClick={loadBookings}>Load</Btn>
        </div>

        {bookings.length === 0 ? (
          <p className="muted" style={{ marginTop: 16 }}>
            No bookings loaded — pick a business date and load.
          </p>
        ) : (
          <div className="tbl-wrap" style={{ marginTop: 16 }}><table className="tbl tbl--pick">
            <thead><tr><th>Guest</th><th>Booking</th><th>Room type</th><th>Stay</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  tabIndex={0}
                  className={picked?.id === b.id ? 'is-selected' : ''}
                  aria-selected={picked?.id === b.id}
                  onClick={() => pick(b)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(b); } }}
                >
                  <td>{b.guestName}</td>
                  <td className="ref" title={b.id}>{b.ref}</td>
                  <td>{b.category}</td>
                  <td>{b.checkinDate} → {b.checkoutDate}</td>
                  <td><Badge tone={statusTone(b.status)}>{statusLabel(b.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}

        {/* Kept for a booking that is not in the loaded list. */}
        <div className="desk-byid">
          <Field label="Or act on a reservation id">
            <input
              className="mono"
              value={reservationId}
              onChange={(e) => { setReservationId(e.target.value); setPicked(null); }}
              placeholder="Reservation id"
            />
          </Field>
          <Field label="Room id (optional)">
            <input className="mono" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Auto-assigns when empty" />
          </Field>
        </div>

        {ok && <Alert kind="ok">{ok}</Alert>}
        {msg && <Alert kind="err">{msg}</Alert>}
      </div>

      <aside className="deskpane">
        <h3>Selected booking</h3>
        {!target ? (
          <div className="deskpane-empty">
            <span>No booking selected.</span>
            <span>Choose a row from the list, or paste a reservation id below it.</span>
          </div>
        ) : (
          <>
            <div className="deskpane-record">
              <strong>{picked ? picked.guestName : 'Entered by id'}</strong>
              <span className="deskpane-sub">
                {picked ? `${picked.ref} · ${picked.category}` : reservationId.slice(0, 8)}
              </span>
            </div>
            <dl className="deskpane-grid">
              {picked && (
                <>
                  <dt>Stay</dt>
                  <dd>{picked.checkinDate} → {picked.checkoutDate}</dd>
                  <dt>Status</dt>
                  <dd><Badge tone={statusTone(picked.status)}>{statusLabel(picked.status)}</Badge></dd>
                  {picked.advanceDuePaise > 0 && (
                    <>
                      <dt>Advance due</dt>
                      <dd>{rupees(picked.advanceDuePaise)}</dd>
                    </>
                  )}
                </>
              )}
              <dt>Reservation</dt>
              <dd className="mono">{target}</dd>
              {stayId && (
                <>
                  <dt>Stay id</dt>
                  <dd className="mono">{stayId}</dd>
                </>
              )}
            </dl>
            <div className="deskpane-actions">
              <Btn onClick={() => act('Checked in', () => checkIn(target, roomId || undefined))}>
                Check in
              </Btn>
              <Btn
                ghost
                disabled={!stayId}
                title={stayId ? undefined : 'Check the guest in first — check-out acts on a stay, not a reservation'}
                onClick={() => act('Checked out', () => checkOut(stayId))}
              >
                Check out
              </Btn>
              <Btn
                ghost
                disabled={!stayId || !roomId}
                title={stayId && roomId ? undefined : 'A transfer needs a stay and the room to move it to'}
                onClick={() => act('Transferred', () => transferStay(stayId, roomId, 'desk move'))}
              >
                Transfer room
              </Btn>
            </div>
          </>
        )}
      </aside>
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
    if (mode === 'preview') { setOk('Preview — no money moves.'); return; }
    try {
      const init = await initiatePayment(reservationId ? { reservationId } : { folioId: folio!.id, amount });
      await confirmPayment(init.gatewayRef, init.signature);
      setOk(`Captured ${rupees(init.amountPaise)} (sandbox).`);
      await load();
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Payment failed.'); }
  }

  return (
    <div className="desk-grid desk-grid--wide">
      <div className="panel">
        <div className="phead">
          <h3>Folio</h3>
          {folio && <span className="phead-count">{folio.entries.length} charges</span>}
        </div>
        <div className="row">
          <Field label="Stay id">
            <input className="mono" value={stayId} onChange={(e) => setStayId(e.target.value)} placeholder="Stay id" />
          </Field>
          <Btn ghost onClick={load}>Load folio</Btn>
        </div>
        {msg && <Alert kind="err">{msg}</Alert>}
        {folio && (
          <>
            <div className="tbl-wrap" style={{ marginTop: 16 }}><table className="tbl">
              <thead><tr><th>Charge</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {folio.entries.map((e, i) => (
                  <tr key={i}>
                    <td>{statusLabel(e.sourceType)}</td>
                    <td className="num">{rupees(e.amountPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="folio-total">
              <span>Outstanding</span>
              <strong className={folio.outstandingPaise > 0 ? 'is-due' : undefined}>
                {rupees(folio.outstandingPaise)}
              </strong>
            </div>
          </>
        )}
        {ok && <Alert kind="ok">{ok}</Alert>}
      </div>

      <aside className="deskpane">
        <h3>Take payment</h3>
        {!folio ? (
          <div className="deskpane-empty">
            <span>No folio loaded.</span>
            <span>Load a stay to see its charges and settle the balance.</span>
          </div>
        ) : (
          <>
            <div className="deskpane-record">
              <strong>{rupees(folio.outstandingPaise)}</strong>
              <span className="deskpane-sub">
                {folio.outstandingPaise > 0 ? 'outstanding on this stay' : 'nothing outstanding'}
              </span>
            </div>
            <div className="deskpane-actions">
              <Btn
                disabled={folio.outstandingPaise <= 0}
                onClick={() => pay(folio.outstandingPaise)}
              >
                Settle balance
              </Btn>
            </div>
          </>
        )}

        <div className="deskpane-actions">
          <h3>Refund</h3>
          <Field label="Payment id">
            <input className="mono" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="Payment id" />
          </Field>
          <Btn ghost disabled={!paymentId} onClick={async () => {
            setMsg(''); setOk('');
            if (mode === 'preview') { setOk('Preview — a refund is not recorded.'); return; }
            try {
              await requestRefund(paymentId, 10000, 'desk goodwill');
              setOk('Refund of ₹100 requested — it needs a manager to approve it');
            } catch (err) { setMsg(err instanceof Error ? err.message : 'Refund failed.'); }
          }}>
            Request ₹100 refund
          </Btn>
          <p className="muted">
            A refund is a request, not a payout — a manager approves it before any money moves.
          </p>
        </div>
      </aside>
    </div>
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
    <div className="panel">
      <div className="phead">
        <h3>Room readiness</h3>
        <span className="phead-count">{rooms.length} rooms</span>
        <Btn ghost onClick={load}>Refresh</Btn>
      </div>
      {msg && <Alert kind="err">{msg}</Alert>}
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Room</th><th>Status</th><th className="num">Open tasks</th></tr></thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.roomId}>
              <td><KeyTag no={r.roomNo} /></td>
              <td><Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge></td>
              <td className="num">{r.openTasks}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <p className="panel-foot">
        A cleaning task moves todo → doing → inspect → done. Once it is done the room turns
        ready and reception can let it again.
      </p>
    </div>
  );
}
