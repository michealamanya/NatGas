import { FormEvent, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../api/client';

type Setting = { key: string; value: string | null; label?: string; description?: string };
export default function AdminSettings() {
  const [groups, setGroups] = useState<Record<string, Setting[]>>({}); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  const load = () => api<Record<string, Setting[]>>('/admin/settings').then(r => setGroups(r.data)).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const updates = Object.fromEntries(form.entries()); try { const result = await api('/admin/settings', { method: 'PUT', body: JSON.stringify(updates) }); setNotice(result.message ?? 'Settings saved.'); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save settings.'); } };
  return <div><div className="admin-page-head"><div><h1 className="admin-page-title">Website settings</h1><p className="admin-page-sub">Company information, social links, SEO defaults and homepage copy.</p></div></div>{notice && <p className="form-ok">{notice}</p>}{error && <p className="form-err">{error}</p>}<form onSubmit={save}>{Object.entries(groups).map(([category, settings]) => <section className="admin-card admin-card-body admin-form" key={category}><h2>{category.replace(/\b\w/g, c => c.toUpperCase())}</h2><div className="form-grid">{settings.map(setting => <label key={setting.key}>{setting.label ?? setting.key}<input name={setting.key} defaultValue={setting.value ?? ''} aria-describedby={`${setting.key}-help`}/>{setting.description && <small id={`${setting.key}-help`}>{setting.description}</small>}</label>)}</div></section>)}<div className="admin-form-actions"><button className="btn btn-dark"><Save size={15}/> Save settings</button></div></form></div>;
}
