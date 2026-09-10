import { Mail, MapPin, Navigation, Phone, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api, Location } from '../api/client';

export default function Locations() {
  const [clients, setClients] = useState<Location[]>([]);
  const [query, setQuery]     = useState('');

  useEffect(() => {
    api<Location[]>('/locations')
      .then((r) => setClients(r.data ?? []))
      .catch(() => undefined);
  }, []);

  const found = useMemo(
    () =>
      clients.filter((c) =>
        `${c.name} ${c.address} ${c.district} ${c.region}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [clients, query],
  );

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">OUR CLIENTS</div>
          <h1>Trusted by businesses across Uganda.</h1>
          <p>
            A selection of the homes, businesses and institutions we are proud to supply
            with safe, reliable LPG energy.
          </p>
        </div>
      </div>

      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">

          {/* Search */}
          <div className="locator-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, district or region…"
              aria-label="Search clients"
            />
          </div>

          {/* Client cards */}
          <div className="client-grid locations-grid">
            {found.map((client) => (
              <article key={client.id} className="client-card">
                <div className="client-card-head">
                  <MapPin size={18} className="client-pin" />
                  <div>
                    <h3>{client.name}</h3>
                    {client.isHeadquarters && (
                      <small className="client-hq-tag">Headquarters</small>
                    )}
                  </div>
                </div>

                <p className="client-address">
                  {client.address}<br />
                  {client.district}, {client.region}
                </p>

                {client.openingHours && (
                  <p className="client-hours">{client.openingHours}</p>
                )}

                <div className="location-actions">
                  {client.phone && (
                    <a href={`tel:${client.phone}`}>
                      <Phone size={13} /> {client.phone}
                    </a>
                  )}
                  {client.email && (
                    <a href={`mailto:${client.email}`}>
                      <Mail size={13} /> {client.email}
                    </a>
                  )}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={
                      client.latitude && client.longitude
                        ? `https://www.google.com/maps?q=${client.latitude},${client.longitude}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${client.name}, ${client.address}, Uganda`,
                          )}`
                    }
                  >
                    <Navigation size={13} /> Directions
                  </a>
                </div>
              </article>
            ))}

            {found.length === 0 && clients.length > 0 && (
              <p className="media-empty" style={{ gridColumn: '1/-1' }}>
                No clients match that search.
              </p>
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
