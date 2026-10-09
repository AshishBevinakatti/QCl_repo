import { useEffect, useState } from 'react';
import { apiHealth, listCategories, rupees, type CategoryDto } from './api';

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
    </div>
  );
}
