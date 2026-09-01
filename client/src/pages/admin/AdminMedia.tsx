import { FormEvent, useEffect, useRef, useState } from 'react';
import { ImagePlus, Pencil, Trash2, Users } from 'lucide-react';
import { api, MediaItem } from '../../api/client';

type Collection = 'gallery' | 'team';
export default function AdminMedia() {
  const [collection, setCollection] = useState<Collection>('gallery');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const load = async () => { try { setItems((await api<MediaItem[]>(`/admin/media?folder=${collection}&mimeType=image&limit=100`)).data ?? []); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load media.'); } };
  useEffect(() => { void load(); }, [collection]);
  const message = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 3500); };
  const upload = async (event: FormEvent) => { event.preventDefault(); if (!file) { setError('Choose an image first.'); return; } try { const form = new FormData(); form.append('file', file); form.append('folder', collection); form.append('altText', name); form.append('caption', caption); const result = await api('/admin/media/upload', { method: 'POST', body: form, headers: {} }); message(result.message ?? 'Image added.'); setFile(null); setName(''); setCaption(''); if (inputRef.current) inputRef.current.value = ''; await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to upload image.'); } };
  const edit = async (item: MediaItem) => { const altText = window.prompt(collection === 'team' ? 'Team member name' : 'Image description', item.altText ?? ''); if (altText === null) return; const nextCaption = window.prompt(collection === 'team' ? 'Role / job title' : 'Caption (optional)', item.caption ?? ''); if (nextCaption === null) return; try { const result = await api(`/admin/media/${item.id}`, { method: 'PUT', body: JSON.stringify({ altText, caption: nextCaption }) }); message(result.message ?? 'Details saved.'); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update image.'); } };
  const remove = async (item: MediaItem) => { if (!window.confirm('Delete this image permanently?')) return; try { const result = await api(`/admin/media/${item.id}`, { method: 'DELETE' }); message(result.message ?? 'Image deleted.'); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete image.'); } };
  const team = collection === 'team';
  return <div><div className="admin-page-head"><div><h1 className="admin-page-title">Media &amp; team</h1><p className="admin-page-sub">Manage public gallery images and Meet Our Team profiles.</p></div></div><div className="admin-tabs"><button className={collection === 'gallery' ? 'active' : ''} onClick={() => setCollection('gallery')}>Gallery</button><button className={team ? 'active' : ''} onClick={() => setCollection('team')}><Users size={14} /> Meet our team</button></div>{notice && <p className="form-ok">{notice}</p>}{error && <p className="form-err">{error}</p>}<form className="admin-card admin-card-body admin-form" onSubmit={upload}><h2>Add {team ? 'team profile' : 'gallery image'}</h2><div className="form-grid"><label>{team ? 'Full name' : 'Image description'}<input value={name} onChange={e => setName(e.target.value)} required /></label><label>{team ? 'Role / job title' : 'Caption (optional)'}<input value={caption} onChange={e => setCaption(e.target.value)} /></label><label>Image<input ref={inputRef} type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} required /></label></div><button className="btn btn-primary"><ImagePlus size={14} /> Upload image</button></form><div className="media-admin-grid">{items.map(item => <article key={item.id}><img src={item.url} alt={item.altText ?? ''} /><div><b>{item.altText || 'Untitled image'}</b><small>{item.caption}</small><div className="admin-form-actions"><button className="tact" onClick={() => edit(item)}><Pencil size={13} /> Edit</button><button className="tact" onClick={() => remove(item)}><Trash2 size={13} /> Delete</button></div></div></article>)}</div>{!items.length && <p className="media-empty">No {team ? 'team profiles' : 'gallery images'} yet.</p>}</div>;
}
