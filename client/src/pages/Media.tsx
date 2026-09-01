import { useEffect, useState } from 'react';
import { Image, Users } from 'lucide-react';
import { api, MediaItem } from '../api/client';

export default function Media() {
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [team, setTeam] = useState<MediaItem[]>([]);

  useEffect(() => {
    api<MediaItem[]>('/media?folder=gallery').then(result => setGallery(result.data ?? [])).catch(() => undefined);
    api<MediaItem[]>('/media?folder=team').then(result => setTeam(result.data ?? [])).catch(() => undefined);
  }, []);

  return <>
    <div className="page-hero"><div className="page-hero-wrap"><h1>Media &amp; our people</h1><p>See NATGAS at work and meet the people behind safe, reliable LPG solutions.</p></div></div>
    <section className="section" style={{ background: '#fff' }}><div className="wrap">
      <div className="section-head"><div><h2><Image size={23} /> Gallery</h2><p>Projects, installations and moments from NATGAS Uganda.</p></div></div>
      {gallery.length ? <div className="media-gallery">{gallery.map(item => <figure key={item.id}><img src={item.url} alt={item.altText ?? 'NATGAS gallery'} />{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}</div> : <p className="media-empty">Our project gallery will be updated soon.</p>}
    </div></section>
    <section id="team" className="section" style={{ background: 'var(--cream)' }}><div className="wrap">
      <div className="section-head"><div><h2><Users size={23} /> Meet our team</h2><p>Professional people committed to dependable LPG service.</p></div></div>
      {team.length ? <div className="team-grid">{team.map(item => <article key={item.id}><img src={item.url} alt={item.altText ?? 'NATGAS team member'} /><div><h3>{item.altText ?? 'NATGAS team member'}</h3>{item.caption && <p>{item.caption}</p>}</div></article>)}</div> : <p className="media-empty">Team profiles will be introduced here soon.</p>}
    </div></section>
  </>;
}
