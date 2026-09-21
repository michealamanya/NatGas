import { FormEvent, useEffect, useState } from 'react';
import { Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { api } from '../../api/client';

type Values = Record<string, string>;
const defaults: Values = { home_hero_media_url: '', home_hero_media_type: 'image', home_hero_overlay: '70', home_announcement_enabled: 'false', home_announcement_label: 'New', home_announcement_text: '', home_announcement_link: '', home_announcement_media_url: '', site_font: 'Inter' };
const fonts = ['Inter', 'DM Sans', 'Manrope', 'Lato', 'Montserrat', 'Work Sans', 'Source Sans 3', 'Nunito Sans', 'Merriweather', 'Playfair Display', 'Arial', 'Georgia'];
type Partner = { id: string; name: string; logoUrl: string; websiteUrl: string; isActive: boolean };
type Feedback = { id: string; quote: string; author: string; role: string };

export default function AdminExperience() {
  const [values, setValues] = useState<Values>(defaults);
  const [file, setFile] = useState<File | null>(null);
  const [announcementFile, setAnnouncementFile] = useState<File | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const set = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));

  useEffect(() => {
    api<Values>('/settings/public').then(result => {
      setValues(current => ({ ...current, ...Object.fromEntries(Object.entries(result.data ?? {}).map(([key, value]) => [key, String(value ?? '')])) }));
      try {
        const parsed = JSON.parse(String(result.data?.partners_json ?? '[]'));
        if (Array.isArray(parsed)) setPartners(parsed.map((partner, index) => ({ id: String(partner.id ?? `partner-${index}`), name: String(partner.name ?? ''), logoUrl: String(partner.logoUrl ?? ''), websiteUrl: String(partner.websiteUrl ?? ''), isActive: partner.isActive !== false })));
      } catch { setPartners([]); }
      try {
        const parsedFeedback = JSON.parse(String(result.data?.feedback_json ?? '[]'));
        if (Array.isArray(parsedFeedback)) setFeedback(parsedFeedback.map((item, index) => ({ id: String(item.id ?? `feedback-${index}`), quote: String(item.quote ?? ''), author: String(item.author ?? ''), role: String(item.role ?? '') })));
      } catch { setFeedback([]); }
    }).catch(() => undefined);
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
      let announcementMediaUrl = values.home_announcement_media_url;
      if (announcementFile) {
        const form = new FormData(); form.append('file', announcementFile); form.append('folder', 'announcements');
        const result = await api<{ url: string }>('/admin/media/upload', { method: 'POST', body: form, headers: {} });
        announcementMediaUrl = result.data.url;
      }
      const next = { ...values, home_hero_media_url: mediaUrl, home_hero_media_type: mediaType, home_announcement_media_url: announcementMediaUrl };
      const cleanPartners = partners.filter(partner => partner.name.trim()).map(partner => ({ ...partner, name: partner.name.trim() }));
      const cleanFeedback = feedback.filter(item => item.quote.trim() && item.author.trim()).map(item => ({ ...item, quote: item.quote.trim(), author: item.author.trim() }));
      await api('/admin/settings', { method: 'PUT', body: JSON.stringify({ ...next, partners_json: JSON.stringify(cleanPartners), feedback_json: JSON.stringify(cleanFeedback) }) });
      setPartners(cleanPartners);
      setFeedback(cleanFeedback);
      window.dispatchEvent(new Event('natgas-settings-change'));
      setValues(next); setNotice('Site experience published.'); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save.'); }
  };

  const restore = async () => {
    if (!confirm('Restore visual defaults? Content, users, orders and products will not change.')) return;
    try { const result = await api('/admin/settings/restore-defaults', { method: 'POST' }); setValues(defaults); setPartners([]); setFeedback([]); window.dispatchEvent(new Event('natgas-settings-change')); setNotice(result.message ?? 'Defaults restored.'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to restore.'); }
  };

  const addPartner = () => setPartners(current => [...current, { id: `partner-${Date.now()}-${current.length}`, name: '', logoUrl: '', websiteUrl: '', isActive: true }]);
  const updatePartner = (index: number, patch: Partial<Partner>) => setPartners(current => current.map((partner, i) => i === index ? { ...partner, ...patch } : partner));
  const uploadPartnerLogo = async (index: number, fileToUpload: File) => {
    try {
      const form = new FormData(); form.append('file', fileToUpload); form.append('folder', 'partners');
      const result = await api<{ url: string }>('/admin/media/upload', { method: 'POST', body: form, headers: {} });
      updatePartner(index, { logoUrl: result.data.url });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to upload partner logo.'); }
  };
  const addFeedback = () => setFeedback(current => [...current, { id: `feedback-${Date.now()}-${current.length}`, quote: '', author: '', role: '' }]);
  const updateFeedback = (id: string, patch: Partial<Feedback>) => setFeedback(current => current.map(item => item.id === id ? { ...item, ...patch } : item));

  return <div><div className="admin-page-head"><div><h1 className="admin-page-title">Site experience</h1><p className="admin-page-sub">Homepage visual, fast flyer, typography and trusted-partner controls.</p></div></div>{notice && <p className="form-ok">{notice}</p>}{error && <p className="form-err">{error}</p>}<form className="admin-form" onSubmit={save}><section className="admin-card admin-card-body"><h2>Homepage background</h2><div className="form-grid"><label>Image or video<input type="file" accept="image/*,video/mp4,video/webm" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label><label>Uploaded media source (internal)<input value={values.home_hero_media_url} onChange={event => set('home_hero_media_url', event.target.value)} /></label><label>Overlay darkness {values.home_hero_overlay}%<input type="range" min="15" max="90" value={values.home_hero_overlay} onChange={event => set('home_hero_overlay', event.target.value)} /></label></div></section><section className="admin-card admin-card-body"><h2>Announcement flyer</h2><div className="form-grid"><label>Visible<select value={values.home_announcement_enabled} onChange={event => set('home_announcement_enabled', event.target.value)}><option value="false">Hidden</option><option value="true">Visible</option></select></label><label>Label<input value={values.home_announcement_label} onChange={event => set('home_announcement_label', event.target.value)} /></label><label>Message<input value={values.home_announcement_text} onChange={event => set('home_announcement_text', event.target.value)} /></label><label>Link<input value={values.home_announcement_link} onChange={event => set('home_announcement_link', event.target.value)} /></label><label>Banner image<input type="file" accept="image/*" onChange={event => setAnnouncementFile(event.target.files?.[0] ?? null)} /></label></div>{values.home_announcement_media_url && <small className="admin-help">A banner image is already attached. Choose another file to replace it.</small>}</section><section className="admin-card admin-card-body"><h2>Typography</h2><label>Site font<select value={values.site_font} onChange={event => set('site_font', event.target.value)}>{fonts.map(font => <option key={font}>{font}</option>)}</select></label><p className="admin-help">This font is applied to the public site after publishing.</p></section><section className="admin-card admin-card-body"><div className="admin-section-row"><div><h2>Trusted partners</h2><p className="admin-page-sub">Add logos and links shown on the public About page.</p></div><button type="button" className="btn btn-outline" onClick={addPartner}><Plus size={15}/> Add partner</button></div>{partners.length === 0 && <p className="admin-empty">No partners configured yet.</p>}{partners.map((partner, index) => <div className="partner-admin-row" key={partner.id}><input aria-label="Partner name" placeholder="Partner name" value={partner.name} onChange={event => updatePartner(index, { name: event.target.value })}/><input aria-label="Partner website" placeholder="Website (optional)" value={partner.websiteUrl} onChange={event => updatePartner(index, { name: partner.name, websiteUrl: event.target.value })}/><label className="upload-inline"><Upload size={15}/> Logo<input type="file" accept="image/*,.svg" onChange={event => { const selected = event.target.files?.[0]; if (selected) void uploadPartnerLogo(index, selected); }}/></label><button type="button" className="icon-btn" aria-label="Remove partner" onClick={() => setPartners(current => current.filter(item => item.id !== partner.id))}><Trash2 size={16}/></button></div>)}</section><section className="admin-card admin-card-body"><div className="admin-section-row"><div><h2>Customer feedback</h2><p className="admin-page-sub">Approve and edit testimonials shown on the homepage.</p></div><button type="button" className="btn btn-outline" onClick={addFeedback}><Plus size={15}/> Add feedback</button></div>{feedback.length === 0 && <p className="admin-empty">No customer feedback published.</p>}{feedback.map(item => <div className="feedback-admin-row" key={item.id}><textarea aria-label="Customer quote" rows={2} placeholder="Customer feedback" value={item.quote} onChange={event => updateFeedback(item.id, { quote: event.target.value })}/><input aria-label="Customer name" placeholder="Customer name" value={item.author} onChange={event => updateFeedback(item.id, { author: event.target.value })}/><input aria-label="Customer role or location" placeholder="Role / location" value={item.role} onChange={event => updateFeedback(item.id, { role: event.target.value })}/><button type="button" className="icon-btn" aria-label="Remove feedback" onClick={() => setFeedback(current => current.filter(entry => entry.id !== item.id))}><Trash2 size={16}/></button></div>)}</section><div className="admin-form-actions"><button type="button" className="btn btn-outline" onClick={restore}><RotateCcw size={15}/> Restore visual defaults</button><button className="btn btn-primary"><Save size={15}/> Publish changes</button></div></form></div>;
}
