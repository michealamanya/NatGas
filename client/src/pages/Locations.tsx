import { Mail, MapPin, Navigation, Phone, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, Location } from '../api/client';
import { useRealtimeRefresh } from '../lib/realtime';

export default function Locations() {
  const [clients, setClients] = useState<Location[]>([]);
  const [query, setQuery]     = useState('');

  useEffect(() => {
    api<Location[]>('/locations')
      .then(r => setClients(dedupeLocations(r.data ?? [])))
      .catch(() => undefined);
  }, []);
  useRealtimeRefresh(() => {
    api<Location[]>('/locations').then(r => setClients(dedupeLocations(r.data ?? []))).catch(() => undefined);
  });

  const found = useMemo(
    () => clients.filter(c =>
      `${c.name} ${c.address} ${c.district} ${c.region}`.toLowerCase().includes(query.toLowerCase()),
    ),
    [clients, query],
  );

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">OUR CLIENTS</div>
          <h1>Trusted by businesses across Uganda.</h1>
          <p>A selection of the homes, businesses and institutions we are proud to supply with safe, reliable LPG energy.</p>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480, marginBottom: 28 }}>
            <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, district or region…"
              aria-label="Search clients"
              style={{
                width: '100%', padding: '11px 36px 11px 40px',
                border: '1.5px solid var(--border)', borderRadius: 10,
                font: 'inherit', fontSize: 14, outline: 'none',
                transition: 'border-color .15s',
                background: '#fff',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--green-3)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 4 }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Client grid */}
          <div className="client-grid locations-grid">
            {found.map(client => (
              <article key={client.id} className="client-card">
                <div className="client-card-head">
                  {client.imageUrl
                    ? <img className="client-logo" src={client.imageUrl} alt="" loading="lazy" />
                    : <div style={{ width: 36, height: 36, background: 'var(--light)', borderRadius: 8, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <MapPin size={16} style={{ color: 'var(--gold-text)' }} />
                      </div>
                  }
                  <div>
                    <h3>{client.name}</h3>
                    {client.isHeadquarters && <small className="client-hq-tag">Headquarters</small>}
                  </div>
                </div>

                <p className="client-address">
                  {client.address}<br />
                  {client.district}, {client.region}
                </p>

                {client.openingHours && <p className="client-hours">{client.openingHours}</p>}

                <div className="location-actions">
                  {client.phone && (
                    <a href={`tel:${client.phone}`}><Phone size={13} /> {client.phone}</a>
                  )}
                  {client.email && (
                    <a href={`mailto:${client.email}`}><Mail size={13} /> {client.email}</a>
                  )}
                  <a
                    target="_blank" rel="noreferrer"
                    href={
                      client.latitude && client.longitude
                        ? `https://www.google.com/maps?q=${client.latitude},${client.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${client.name}, ${client.address}, Uganda`)}`
                    }
                  >
                    <Navigation size={13} /> Directions
                  </a>
                </div>
              </article>
            ))}

            {found.length === 0 && clients.length > 0 && (
              <div className="empty-state" style={{ gridColumn: '1/-1', minHeight: 160 }}>
                <h3>No clients match that search</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setQuery('')}>Clear search</button>
              </div>
            )}

            {clients.length === 0 && (
              <p className="media-empty" style={{ gridColumn: '1/-1' }}>
                Client listings will appear here once added by the admin team.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function dedupeLocations(items: Location[]): Location[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.name}|${item.address}|${item.district}`.trim().toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
