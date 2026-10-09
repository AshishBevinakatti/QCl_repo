import { useEffect, useState } from 'react';
import { apiHealth, createGuest, listCategories, rupees, searchGuests, type CategoryDto, type GuestDto } from './api';

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
