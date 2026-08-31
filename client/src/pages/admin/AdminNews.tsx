import { ImagePlus, Loader2, Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, NewsArticle } from '../../api/client';

export default function AdminNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<NewsArticle | null>(null);
  const [toast,    setToast]    = useState('');
  const imageRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => {
    setLoading(true);
    api<NewsArticle[]>('/admin/news?limit=100')
      .then(r => setArticles(r.data ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setImageFile(null); setImagePreview(''); setShowForm(true); };
  const openEdit   = (a: NewsArticle) => { setEditing(a); setImageFile(null); setImagePreview(a.featuredImage ?? ''); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditing(null); setImageFile(null); setImagePreview(''); };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      title:   fd.get('title'),
      summary: fd.get('summary'),
      content: fd.get('content'),
      status:  fd.get('status'),
    };
    if (imageFile) {
      const imageData = new FormData();
      imageData.append('file', imageFile);
      imageData.append('folder', 'news');
      try {
        const result = await api<{ url: string }>('/admin/media/upload', { method: 'POST', body: imageData, headers: {} });
        payload.featuredImage = result.data.url;
      } catch (err) {
        notify(err instanceof Error ? `Image upload failed: ${err.message}` : 'Image upload failed');
        return;
      }
    }
    try {
      if (editing) {
        await api(`/admin/news/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        notify('Article updated');
      } else {
        await api('/admin/news', { method: 'POST', body: JSON.stringify(payload) });
        notify('Article created');
      }
      closeForm(); load();
    } catch (err) { notify(err instanceof Error ? err.message : 'Failed'); }
  };

  const toggle = async (a: NewsArticle) => {
    try {
      await api(`/admin/news/${a.id}`, { method: 'PUT', body: JSON.stringify({ status: a.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }) });
      notify(`Article ${a.status === 'PUBLISHED' ? 'unpublished' : 'published'}`);
      load();
    } catch (err) { notify(err instanceof Error ? err.message : 'Failed'); }
  };

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="admin-page-title">News &amp; Blog</h1>
          <p className="admin-page-sub">Published articles appear on the public news page.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Write article</button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: 28 }}>
          <div className="admin-card-header">
            <h3>{editing ? 'Edit article' : 'New article'}</h3>
            <button style={{ background:'none', border:0, cursor:'pointer' }} onClick={closeForm}><X size={18} /></button>
          </div>
          <div className="admin-card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Headline *</label>
                <input required name="title" defaultValue={editing?.title} placeholder="Article headline…" />
              </div>
              <div className="form-group">
                <label>Summary</label>
                <textarea name="summary" rows={2} defaultValue={editing?.summary ?? ''} placeholder="Brief summary shown in listings…" />
              </div>
              <div className="form-group">
                <label>Featured image</label>
                <div className="upload-zone news-image-upload" onClick={() => imageRef.current?.click()}>
                  {imagePreview
                    ? <img src={imagePreview} alt="Article preview" />
                    : <><ImagePlus size={22} /><span>Click to add an article image</span><small>JPG, PNG, WebP or GIF</small></>}
                </div>
                <input ref={imageRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageChange} />
                {imagePreview && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setImageFile(null); setImagePreview(''); }}>Remove image</button>}
              </div>
              <div className="form-group">
                <label>Article content *</label>
                <textarea required name="content" rows={12} defaultValue={editing?.content ?? ''} placeholder="Full article text. Use blank lines to separate paragraphs." />
              </div>
              <div className="form-group" style={{ maxWidth: 260 }}>
                <label>Status</label>
                <select name="status" defaultValue={editing?.status ?? 'DRAFT'}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Publish now</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary">{editing ? 'Save changes' : 'Save article'}</button>
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header"><h3>All articles ({articles.length})</h3></div>
        {loading ? (
          <div className="loading-state"><Loader2 size={22} className="spin" /></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Article</th><th>Status</th><th>Last updated</th><th>Actions</th></tr></thead>
              <tbody>
                {articles.map(a => (
                  <tr key={a.id}>
                    <td><div className="article-row-title">{a.featuredImage && <img src={a.featuredImage} alt="" />}<span><b>{a.title}</b><small>{a.slug}</small></span></div></td>
                    <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                    <td>{new Date(a.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button className="tbl-btn" onClick={() => openEdit(a)}>Edit</button>
                        <button className="tbl-btn" onClick={() => toggle(a)}>
                          {a.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {articles.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign:'center', color:'var(--muted)', padding:'32px' }}>No articles yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <div className="toast-msg">{toast}</div>}
    </>
  );
}
