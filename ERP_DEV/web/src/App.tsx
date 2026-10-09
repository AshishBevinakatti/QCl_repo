import { useEffect, useState } from 'react';
import { apiHealth, availability, board, bookRoom, checkIn, checkOut, createGuest, dashboard, listCategories, rupees, searchGuests, transferStay, walkIn, type CategoryDto, type DashboardDto, type GuestDto, type RoomBoard } from './api';

/**
 * 3.0 base shell: nav skeleton + live API status + room categories.
 * Screens per module land in units 3.1+; Keycloak login lands with 3.0-backend
 * realm wiring (until then the shell calls public endpoints only).
 */
const NAV = ['Dashboard', 'Bookings', 'Front Office', 'Guests', 'Members', 'Billing', 'Reports'];

export default function App() {
  const [health, setHealth] = useState('checking…');
  const [cats, setCats] = useState<CategoryDto[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiHealth()
      .then((h) => setHealth(`${h.status} (${h.service})`))
      .catch((e: Error) => setError(`API unreachable — is erp-app running? (${e.message})`));
    listCategories()
      .then((p) => setCats(p.items))
      .catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Golden Hills ERP</h1>
      <nav style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {NAV.map((n) => (
          <span key={n} style={{ border: '1px solid #ccc', borderRadius: 6, padding: '0.25rem 0.6rem' }}>
            {n}
          </span>
        ))}
      </nav>
      <p>API status: {health}</p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <h2>Room categories</h2>
      <ul>
        {cats.map((c) => (
          <li key={c.id}>
            {c.name} — {rupees(c.basePricePaise)} / night, sleeps {c.capacity}
          </li>
        ))}
      </ul>
      <Guests />
      <Booking cats={cats} />
      <FrontOffice />
      <Housekeeping />
    </div>
  );
}

/** 3.1 Guests screen: search + list + create (merge lives in the manager UI, unit 3.7). */
function Guests() {
  const [q, setQ] = useState('');
  const [guests, setGuests] = useState<GuestDto[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg('');
    try {
      setGuests((await searchGuests(q)).items);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'search failed (login required)');
    }
  }

  async function runCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const g = await createGuest(name, phone);
      setMsg(`created ${g.name}`);
      setName('');
      setPhone('');
      setGuests((await searchGuests(g.phone)).items);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'create failed');
    }
  }

  return (
    <section>
      <h2>Guests</h2>
      <form onSubmit={runSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search name or phone" aria-label="search guests" />
        <button type="submit">Search</button>
      </form>
      <ul>
        {guests.map((g) => (
          <li key={g.id}>
            {g.name} — {g.phone} ({g.status})
          </li>
        ))}
      </ul>
      <form onSubmit={runCreate} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="name" aria-label="guest name" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="phone" aria-label="guest phone" />
        <button type="submit">Add guest</button>
      </form>
      {msg && <p>{msg}</p>}
    </section>
  );
}

/** 3.2 Booking screen: pick category + dates → availability → guest → book. */
function Booking({ cats }: { cats: CategoryDto[] }) {
  const [cat, setCat] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [promo, setPromo] = useState('WELCOME10');
  const [msg, setMsg] = useState('');

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const a = await availability(cat, from, to);
      setMsg(`${a.available} of ${a.totalRooms} free`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'check failed (login required)');
    }
  }

  async function book(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const r = await bookRoom(name, phone, cat, from, to, promo || undefined);
      setMsg(`held ${r.nights} night(s), quote ${rupees(r.quotedTotalPaise)}, advance due ${rupees(r.advanceDuePaise)} (ref ${r.id.slice(0, 8)})`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'booking failed');
    }
  }

  return (
    <section>
      <h2>Book a room</h2>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="category">
          <option value="">category…</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="check-in" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="check-out" />
        <button type="button" onClick={check}>Check</button>
      </div>
      <form onSubmit={book} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="guest name" aria-label="guest name" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="phone" aria-label="guest phone" />
        <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="promo (optional)" aria-label="promo" />
        <button type="submit">Book</button>
      </form>
      {msg && <p>{msg}</p>}
    </section>
  );
}

/** 3.3 Reception dashboard: arrivals, in-house, room grid, check-in/out/transfer/walk-in. */
function FrontOffice() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [dash, setDash] = useState<DashboardDto | null>(null);
  const [reservationId, setReservationId] = useState('');
  const [stayId, setStayId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [msg, setMsg] = useState('');

  async function load(d: string) {
    setMsg('');
    try {
      setDash(await dashboard(d));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'dashboard failed (login required)');
    }
  }

  async function act(label: string, fn: () => Promise<{ id: string; status: string; roomId: string }>) {
    setMsg('');
    try {
      const s = await fn();
      setMsg(`${label}: stay ${s.id.slice(0, 8)} ${s.status}`);
      await load(date);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : `${label} failed`);
    }
  }

  return (
    <section>
      <h2>Front office</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); load(e.target.value); }} aria-label="business date" />
        <button type="button" onClick={() => load(date)}>Refresh</button>
      </div>
      {dash && (
        <>
          <p>Arrivals: {dash.arrivals.length} · In-house: {dash.inHouse.length} · Outstanding: ₹0 (billing 3.4)</p>
          <p>Rooms: {dash.rooms.map((r) => `${r.roomNo}:${r.status}`).join(' ')}</p>
        </>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <input value={reservationId} onChange={(e) => setReservationId(e.target.value)} placeholder="reservation id" aria-label="reservation id" />
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="room id (optional)" aria-label="room id" />
        <button type="button" onClick={() => act('checked in', () => checkIn(reservationId, roomId || undefined))}>Check in</button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input value={stayId} onChange={(e) => setStayId(e.target.value)} placeholder="stay id" aria-label="stay id" />
        <button type="button" onClick={() => act('checked out', () => checkOut(stayId))}>Check out</button>
        <button type="button" onClick={() => act('transferred', () => transferStay(stayId, roomId, 'desk move'))}>Transfer</button>
      </div>
      {msg && <p>{msg}</p>}
    </section>
  );
}

/** 3.3 Housekeeping board: room readiness + task advance. */
function Housekeeping() {
  const [rooms, setRooms] = useState<RoomBoard[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      setRooms(await board());
    } catch {
      setMsg('board failed (login required)');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section>
      <h2>Housekeeping</h2>
      <button type="button" onClick={load}>Refresh</button>
      <ul>
        {rooms.slice(0, 12).map((r) => (
          <li key={r.roomId}>{r.roomNo}: {r.status} ({r.openTasks} open)</li>
        ))}
      </ul>
      {msg && <p>{msg}</p>}
      <WalkIn />
    </section>
  );
}

function WalkIn() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const cats = await listCategories();
          const s = await walkIn(name, phone, cats.items[0].id);
          setMsg(`walk-in checked in: ${s.id.slice(0, 8)}`);
        } catch (err) {
          setMsg(err instanceof Error ? err.message : 'walk-in failed');
        }
      }}
      style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}
    >
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="walk-in name" aria-label="walk-in name" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="phone" aria-label="walk-in phone" />
      <button type="submit">Walk in</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
