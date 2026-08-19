import { CheckCircle2, Loader2, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, Product, ProductCategory } from '../../api/client';

interface AdminProduct extends Product { updatedAt: string; }

type Toast = { msg: string; type?: 'success' | 'error' } | null;

export default function AdminProducts() {
  const [products,   setProducts]   = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<AdminProduct | null>(null);
  const [toast,      setToast]      = useState<Toast>(null);
  const [features,   setFeatures]   = useState<string[]>(['']);
  const imageRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile]  = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const notify = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    setLoading(true);
    api<AdminProduct[]>('/admin/products?limit=100')
      .then(r => setProducts(r.data ?? []))
      .catch(() => notify('Failed to load products', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api<ProductCategory[]>('/products/categories').then(r => setCategories(r.data ?? [])).catch(() => undefined);
  }, []);

  const openCreate = () => {
    setEditing(null); setFeatures(['']); setImageFile(null); setImagePreview(''); setShowForm(true);
  };
  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    const f = Array.isArray(p.features) ? p.features as string[] : [];
    setFeatures(f.length ? f : ['']);
    setImagePreview(p.imageUrl ?? '');
    setImageFile(null);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const cleanFeatures = features.filter(f => f.trim());
    const payload: Record<string, unknown> = {
      name:             String(fd.get('name') ?? ''),
      cylinderSize:     String(fd.get('cylinderSize') ?? ''),
      shortDescription: String(fd.get('shortDescription') ?? ''),
      description:      String(fd.get('description') ?? ''),
      safetyInfo:       String(fd.get('safetyInfo') ?? ''),
      categoryId:       String(fd.get('categoryId') ?? '') || undefined,
      status:           String(fd.get('status') ?? 'DRAFT'),
      isAvailable:      fd.get('isAvailable') === 'true',
      isFeatured:       fd.get('isFeatured') === 'on',
      displayOrder:     Number(fd.get('displayOrder') ?? 0),
      features:         cleanFeatures,
    };
    // Upload image first if selected
    if (imageFile) {
      const imgFd = new FormData();
      imgFd.append('file', imageFile);
      imgFd.append('folder', 'products');
      try {
        const r = await api<{ url: string }>('/admin/media/upload', { method: 'POST', body: imgFd, headers: {} });
        payload.imageUrl = r.data.url;
      } catch { /* skip image on failure */ }
    }
    try {
      if (editing) {
        await api(`/admin/products/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        notify('Product updated successfully');
      } else {
        await api('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
        notify('Product created successfully');
      }
      closeForm();
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save', 'error');
    }
  };

  const togglePublish = async (p: AdminProduct) => {
    const newStatus = p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api(`/admin/products/${p.id}/publish`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      notify(`Product ${newStatus.toLowerCase()}`);
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const archive = async (p: AdminProduct) => {
    if (!confirm(`Archive "${p.name}"?`)) return;
    try {
      await api(`/admin/products/${p.id}`, { method: 'DELETE' });
      notify('Product archived');
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-sub">Manage the product catalogue. Published products appear on the public website.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Add product</button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="admin-card" style={{ marginBottom: 28 }}>
          <div className="admin-card-header">
            <h3>{editing ? `Edit: ${editing.name}` : 'Add new product'}</h3>
            <button style={{ background:'none', border:0, cursor:'pointer', color:'var(--muted)' }} onClick={closeForm}><X size={18} /></button>
          </div>
          <div className="admin-card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Product name *</label>
                  <input required name="name" defaultValue={editing?.name} placeholder="e.g. 13kg LPG Cylinder" />
                </div>
                <div className="form-group">
                  <label>Cylinder / size</label>
                  <input name="cylinderSize" defaultValue={editing?.cylinderSize ?? ''} placeholder="e.g. 13kg" />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Category</label>
                  <select name="categoryId" defaultValue={editing?.category?.id ?? ''}>
                    <option value="">— No category —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Display order</label>
                  <input type="number" name="displayOrder" defaultValue={editing?.displayOrder ?? 0} />
                </div>
              </div>
              <div className="form-group">
                <label>Short description</label>
                <input name="shortDescription" defaultValue={editing?.shortDescription ?? ''} placeholder="One-line summary…" />
              </div>
              <div className="form-group">
                <label>Full description</label>
                <textarea name="description" rows={4} defaultValue={editing?.description ?? ''} placeholder="Detailed product description…" />
              </div>
              <div className="form-group">
                <label>Safety information</label>
                <textarea name="safetyInfo" rows={2} defaultValue={editing?.safetyInfo ?? ''} />
              </div>

              {/* Features editor */}
              <div className="form-group">
                <label>Features (one per line)</label>
                <div className="features-list-editor">
                  {features.map((f, i) => (
                    <div className="feature-row" key={i}>
                      <input
                        value={f}
                        placeholder={`Feature ${i+1}`}
                        onChange={e => { const n=[...features]; n[i]=e.target.value; setFeatures(n); }}
                      />
                      {features.length > 1 && (
                        <button type="button" onClick={() => setFeatures(features.filter((_,j)=>j!==i))}>
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFeatures([...features,''])}>
                    + Add feature
                  </button>
                </div>
              </div>

              {/* Image upload */}
              <div className="form-group">
                <label>Product image</label>
                <div className="upload-zone" onClick={() => imageRef.current?.click()}>
                  {imagePreview
                    ? <img src={imagePreview} alt="Preview" style={{ height: 120, objectFit: 'cover', borderRadius: 4 }} />
                    : <><CheckCircle2 size={20} style={{ opacity:.3, display:'block', margin:'0 auto 8px' }} /><span>Click to upload image</span></>
                  }
                </div>
                <input ref={imageRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageChange} />
                {imagePreview && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setImageFile(null); setImagePreview(''); }}>
                    Remove image
                  </button>
                )}
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={editing?.status ?? 'DRAFT'}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Availability</label>
                  <select name="isAvailable" defaultValue={String(editing?.isAvailable ?? true)}>
                    <option value="true">In stock</option>
                    <option value="false">Out of stock</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <input type="checkbox" id="isFeatured" name="isFeatured" defaultChecked={editing?.isFeatured} style={{ width:'auto' }} />
                <label htmlFor="isFeatured" style={{ margin:0 }}>Mark as featured (show on homepage)</label>
              </div>

              <div style={{ display:'flex', gap:10, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary">{editing ? 'Save changes' : 'Create product'}</button>
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All products ({products.length})</h3>
        </div>
        {loading ? (
          <div className="loading-state"><Loader2 size={22} className="spin" /></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Size</th><th>Status</th><th>Stock</th><th>Featured</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                        {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width:36, height:36, objectFit:'cover', borderRadius:4, flexShrink:0 }} />}
                        <div><b>{p.name}</b><small>{p.slug}</small></div>
                      </div>
                    </td>
                    <td>{p.category?.name ?? '—'}</td>
                    <td>{p.cylinderSize ?? '—'}</td>
                    <td><span className={`badge badge-${p.status?.toLowerCase()}`}>{p.status}</span></td>
                    <td>{p.isAvailable ? 'In stock' : 'Out of stock'}</td>
                    <td>{p.isFeatured ? '★' : '—'}</td>
                    <td>
                      <div className="actions">
                        <button className="tbl-btn" onClick={() => openEdit(p)}>Edit</button>
                        <button className="tbl-btn" onClick={() => togglePublish(p)}>
                          {p.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button className="tbl-btn danger" onClick={() => archive(p)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--muted)', padding: '32px' }}>No products yet. Click "Add product" to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <div className={`toast${toast.type === 'error' ? ' error' : ''}`}>{toast.msg}</div>}
    </>
  );
}
