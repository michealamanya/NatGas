import { FormEvent, useEffect, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { api } from '../../api/client';

type Values = Record<string, string>;
const defaults: Values = { home_hero_media_url: '', home_hero_media_type: 'image', home_hero_overlay: '70', home_announcement_enabled: 'false', home_announcement_label: 'New', home_announcement_text: '', home_announcement_link: '', site_font: 'Inter' };
const fonts = ['Inter', 'DM Sans', 'Manrope', 'Lato', 'Montserrat', 'Work Sans', 'Source Sans 3', 'Nunito Sans', 'Merriweather', 'Playfair Display', 'Arial', 'Georgia'];

export default function AdminExperience() {
  const [values, setValues] = useState<Values>(defaults);
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const set = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));

  useEffect(() => {
    api<Values>('/settings/public').then(result => setValues(current => ({ ...current, ...Object.fromEntries(Object.entries(result.data ?? {}).map(([key, value]) => [key, String(value ?? '')])) }))).catch(() => undefined);
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      let mediaUrl = values.home_hero_media_url;
      let mediaType = values.home_hero_media_type;
      if (file) {
        const form = new FormData(); form.append('file', file); form.append('folder', 'homepage');
        const result = await api<{ url: string }>('/admin/media/upload', { method: 'POST', body: form, headers: {} });
        mediaUrl = result.data.url; mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      }
      const next = { ...values, home_hero_media_url: mediaUrl, home_hero_media_type: mediaType };
      await Promise.all(Object.entries(next).map(([key, value]) => api(`/admin/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value, type: 'string', category: 'experience' }) })));
      setValues(next); setNotice('Site experience published.'); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save.'); }
  };

  const restore = async () => {
    if (!confirm('Restore visual defaults? Content, users, orders and products will not change.')) return;
    try { const result = await api('/admin/settings/restore-defaults', { method: 'POST' }); setValues(defaults); setNotice(result.message ?? 'Defaults restored.'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to restore.'); }
  };

  return <div><div className="admin-page-head"><div><h1 className="admin-page-title">Site experience</h1><p className="admin-page-sub">Homepage visual, fast flyer, font and recovery controls.</p></div></div>{notice && <p className="form-ok">{notice}</p>}{error && <p className="form-err">{error}</p>}<form className="admin-form" onSubmit={save}><section className="admin-card admin-card-body"><h2>Homepage background</h2><div className="form-grid"><label>Image or video<input type="file" accept="image/*,video/mp4,video/webm" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label><label>Media URL<input value={values.home_hero_media_url} onChange={event => set('home_hero_media_url', event.target.value)} /></label><label>Overlay darkness {values.home_hero_overlay}%<input type="range" min="15" max="90" value={values.home_hero_overlay} onChange={event => set('home_hero_overlay', event.target.value)} /></label></div></section><section className="admin-card admin-card-body"><h2>Announcement flyer</h2><div className="form-grid"><label>Visible<select value={values.home_announcement_enabled} onChange={event => set('home_announcement_enabled', event.target.value)}><option value="false">Hidden</option><option value="true">Visible</option></select></label><label>Label<input value={values.home_announcement_label} onChange={event => set('home_announcement_label', event.target.value)} /></label><label>Message<input value={values.home_announcement_text} onChange={event => set('home_announcement_text', event.target.value)} /></label><label>Link<input value={values.home_announcement_link} onChange={event => set('home_announcement_link', event.target.value)} /></label></div></section><section className="admin-card admin-card-body"><h2>Typography</h2><label>Site font<select value={values.site_font} onChange={event => set('site_font', event.target.value)}>{fonts.map(font => <option key={font}>{font}</option>)}</select></label></section><div className="admin-form-actions"><button type="button" className="btn btn-outline" onClick={restore}><RotateCcw size={15}/> Restore visual defaults</button><button className="btn btn-primary"><Save size={15}/> Publish changes</button></div></form></div>;
}
