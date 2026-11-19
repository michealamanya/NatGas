import { useEffect, useState } from 'react';
import { Image, Users, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, MediaItem } from '../api/client';
import { useRealtimeRefresh } from '../lib/realtime';

export default function Media() {
  const [gallery, setGallery]   = useState<MediaItem[]>([]);
  const [team, setTeam]         = useState<MediaItem[]>([]);
  const [lightbox, setLightbox] = useState<{ items: MediaItem[]; idx: number } | null>(null);

  useEffect(() => {
    api<MediaItem[]>('/media?folder=gallery').then(r => setGallery(r.data ?? [])).catch(() => undefined);
    api<MediaItem[]>('/media?folder=team').then(r => setTeam(r.data ?? [])).catch(() => undefined);
  }, []);

  useRealtimeRefresh(() => {
    api<MediaItem[]>('/media?folder=gallery').then(r => setGallery(r.data ?? [])).catch(() => undefined);
    api<MediaItem[]>('/media?folder=team').then(r => setTeam(r.data ?? [])).catch(() => undefined);
  });

  const open  = (items: MediaItem[], idx: number) => { setLightbox({ items, idx }); document.body.style.overflow = 'hidden'; };
  const close = () => { setLightbox(null); document.body.style.overflow = ''; };
  const prev  = () => setLightbox(l => l ? { ...l, idx: (l.idx - 1 + l.items.length) % l.items.length } : l);
  const next  = () => setLightbox(l => l ? { ...l, idx: (l.idx + 1) % l.items.length } : l);

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">MEDIA</div>
          <h1>Media &amp; our people</h1>
          <p>See NATGAS at work and meet the people behind safe, reliable LPG solutions.</p>
        </div>
      </div>

      {/* Gallery */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="chip-sm"><Image size={12} /> GALLERY</span>
              <h2>Projects &amp; installations</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Projects, installations and moments from NATGAS Uganda.</p>
            </div>
          </div>
          {gallery.length ? (
            <div className="media-gallery">
              {gallery.map((item, i) => (
                <figure key={item.id} onClick={() => open(gallery, i)} style={{ cursor: 'zoom-in' }}>
                  <img src={item.url} alt={item.altText ?? 'NATGAS gallery'} loading="lazy" />
                  {item.caption && <figcaption>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          ) : (
            <p className="media-empty">Our project gallery will be updated soon.</p>
          )}
        </div>
      </section>

      {/* Team */}
      <section id="team" className="section" style={{ background: 'var(--cream)' }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="chip-sm"><Users size={12} /> OUR TEAM</span>
              <h2>Meet our people</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Professional people committed to dependable LPG service.</p>
            </div>
          </div>
          {team.length ? (
            <div className="team-grid">
              {team.map((item, i) => (
                <article key={item.id} onClick={() => open(team, i)} style={{ cursor: 'pointer' }}>
                  <img src={item.url} alt={item.altText ?? 'NATGAS team member'} loading="lazy" />
                  <div>
                    <h3>{item.altText ?? 'NATGAS team member'}</h3>
                    {item.caption && <p>{item.caption}</p>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="media-empty">Team profiles will be introduced here soon.</p>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <button onClick={e => { e.stopPropagation(); prev(); }}
            style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: 0, borderRadius: '50%', width: 44, height: 44, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff' }}>
            <ChevronLeft size={22} />
          </button>
          <img
            src={lightbox.items[lightbox.idx].url}
            alt={lightbox.items[lightbox.idx].altText ?? ''}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}
          />
          <button onClick={e => { e.stopPropagation(); next(); }}
            style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: 0, borderRadius: '50%', width: 44, height: 44, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff' }}>
            <ChevronRight size={22} />
          </button>
          <button onClick={close}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.12)', border: 0, borderRadius: '50%', width: 36, height: 36, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff' }}>
            <X size={18} />
          </button>
          <span style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
            {lightbox.idx + 1} / {lightbox.items.length}
          </span>
        </div>
      )}
    </>
  );
}
