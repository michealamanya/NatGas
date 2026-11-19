import { ImagePlus, Loader2, Plus, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, NewsArticle } from '../../api/client';

export default function AdminNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<NewsArticle | null>(null);
  const [toast,    setToast]    = useState('');
  const imageRef = useRef<HTMLInputElement>(null);
  const [imageFile,    setImageFile]    = useState<File | null>(null);
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
  const openEdit   = (a: NewsArticle) => {
    setEditing(a); setImageFile(null);
    setImagePreview(a.featuredImage ?? '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setImageFile(null); setImagePreview(''); };

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
      const imgFd = new FormData();
      imgFd.append('file', imageFile);
      imgFd.append('folder', 'news');
      try {
        const r = await api<{ url: string }>('/admin/media/upload', { method: 'POST', body: imgFd, headers: {} });
        payload.featuredImage = r.data.url;
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
      await api(`/admin/news/${a.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: a.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }),
      });
      notify(`Article ${a.status === 'PUBLISHED' ? 'unpublished' : 'published'}`);
      load();
    } catch (err) { notify(err instanceof Error ? err.message : 'Failed'); }
  };

  return (
    <>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="admin-page-title">News &amp; Blog</h1>
          <p className="admin-page-sub">Published articles appear on the public news page.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Write article
        </button>
      </div>

      {/* Article form */}
      {showForm && (
        <div className="admin-card" style={{ marginBottom: 28 }}>
          <div className="admin-card-header">
            <h3>{editing ? 'Edit article' : 'New article'}</h3>
            <button style={{ background: 'none', border: 0, cursor: 'pointer', display: 'flex' }} onClick={closeForm}>
              <X size={18} />
            </button>
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
                    ? <img src={imagePreview} alt="Preview" />
                    : <><ImagePlus size={22} /><span>Click to add an article image</span><small>JPG, PNG, WebP or GIF</small></>
                  }
                </div>
                <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                {imagePreview && (
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
                    onClick={() => { setImageFile(null); setImagePreview(''); }}>
                    Remove image
                  </button>
                )}
              </div>
              <div className="form-group">
                <label>Article content *</label>
                <textarea required name="content" rows={12} defaultValue={editing?.content ?? ''}
                  placeholder="Full article text. Use blank lines to separate paragraphs." />
              </div>
              <div className="form-group" style={{ maxWidth: 260 }}>
                <label>Status</label>
                <select name="status" defaultValue={editing?.status ?? 'DRAFT'}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Publish now</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary">{editing ? 'Save changes' : 'Save article'}</button>
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles grid */}
      {loading ? (
        <div className="loading-state"><Loader2 size={22} className="spin" /></div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <h3>No articles yet</h3>
          <p>Click "Write article" to create your first news post.</p>
        </div>
      ) : (
        <div className="admin-news-grid">
          {articles.map(a => (
            <div key={a.id} className="admin-news-card">
              {/* Image */}
              <div className="admin-news-img">
                {a.featuredImage
                  ? <img src={a.featuredImage} alt={a.title} loading="lazy" />
                  : <div className="admin-news-img-placeholder">
                      <ImagePlus size={28} />
                    </div>
                }
                {/* Status badge overlaid on image */}
                <span className={`admin-news-status badge badge-${a.status.toLowerCase()}`}>
                  {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                </span>
              </div>

              {/* Body */}
              <div className="admin-news-body">
                <span className="admin-news-date">
                  {new Date(a.updatedAt).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <h3 className="admin-news-title">{a.title}</h3>
                {a.summary && (
                  <p className="admin-news-summary">{a.summary}</p>
                )}
              </div>

              {/* Actions */}
              <div className="admin-news-actions">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(a)}>
                  Edit
                </button>
                <button
                  className="btn btn-sm"
                  style={a.status === 'PUBLISHED'
                    ? { background: 'var(--light)', color: 'var(--muted)', border: '1px solid var(--border)' }
                    : { background: 'var(--green)', color: '#fff' }
                  }
                  onClick={() => toggle(a)}
                >
                  {a.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="toast-msg">{toast}</div>}
    </>
  );
}
