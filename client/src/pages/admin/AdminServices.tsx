import { FormEvent, useEffect, useRef, useState } from 'react';
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api, Service } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const result = await api<Service[]>('/admin/services?limit=100');
      setServices(result.data ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load services.');
    }
  };

  useEffect(() => { void load(); }, []);

  const clearForm = () => {
    setEditing(null); setName(''); setDescription(''); setImageUrl(''); setFile(null); setPreview('');
  };

  const selectImage = (selected?: File) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const startEdit = (service: Service) => {
    setEditing(service);
    setName(service.name);
    setDescription(service.description ?? service.shortDesc ?? '');
    setImageUrl(service.imageUrl ?? '');
    setFile(null);
    setPreview(service.imageUrl ?? '');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      let resolvedImageUrl = imageUrl;
      if (file) {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', 'services');
        resolvedImageUrl = (await api<{ url: string }>('/admin/media/upload', {
          method: 'POST', body: form, headers: {},
        })).data.url;
      }
      const response = await api(editing ? `/admin/services/${editing.id}` : '/admin/services', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          name,
          description,
          imageUrl: resolvedImageUrl || null,
          status: editing?.status ?? 'PUBLISHED',
        }),
      });
      setNotice(response.message ?? `Service ${editing ? 'updated' : 'created'}.`);
      clearForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save service.');
    }
  };

  const remove = async (service: Service) => {
    setError('');
    try {
      const response = await api(`/admin/services/${service.id}`, { method: 'DELETE' });
      if (editing?.id === service.id) clearForm();
      setNotice(response.message ?? 'Service deleted.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete service.');
    }
  };

  return <div>
    <div className="admin-page-head">
      <div><h1 className="admin-page-title">Technical services</h1><p className="admin-page-sub">Create, edit and illustrate the services shown to customers.</p></div>
    </div>
    {notice && <p className="form-ok">{notice}</p>}
    {error && <p className="form-err">{error}</p>}
    <form className="admin-card admin-card-body order-form" onSubmit={submit}>
      <h2>{editing ? `Edit ${editing.name}` : 'Add a service'}</h2>
      <label>Service name<input required value={name} onChange={event => setName(event.target.value)} /></label>
      <label>Description<textarea required value={description} onChange={event => setDescription(event.target.value)} /></label>
      <label>Service image</label>
      <div className="upload-zone news-image-upload" onClick={() => inputRef.current?.click()}>
        {preview ? <img src={preview} alt="Service preview" /> : <><ImagePlus size={22} /><span>Upload technical service image</span></>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={event => selectImage(event.target.files?.[0])} />
      <div className="admin-form-actions">
        {editing && <button type="button" className="btn btn-outline" onClick={clearForm}><X size={14} /> Cancel edit</button>}
        <button className="btn btn-primary">{editing ? <Pencil size={14} /> : <Plus size={14} />}{editing ? 'Save changes' : 'Add service'}</button>
      </div>
    </form>
    <div className="product-grid product-grid-3">
      {services.map(service => <article className="ncard" key={service.id}>
        {service.imageUrl && <div className="ncard-img"><img src={service.imageUrl} alt={service.name} /></div>}
        <div className="ncard-body"><h3>{service.name}</h3><p>{service.shortDesc ?? service.description}</p><div className="admin-form-actions"><button type="button" className="btn btn-outline" onClick={() => startEdit(service)}><Pencil size={14} /> Edit</button><button type="button" className="btn btn-outline" onClick={() => setPendingDelete(service)}><Trash2 size={14} /> Delete</button></div></div>
      </article>)}
    </div>
    <ConfirmDialog open={Boolean(pendingDelete)} title="Delete service?" message={`This will permanently remove ${pendingDelete?.name ?? 'this service'} from the website and CMS.`} confirmLabel="Delete service" onCancel={() => setPendingDelete(null)} onConfirm={() => { if (pendingDelete) { void remove(pendingDelete); setPendingDelete(null); } }} />
  </div>;
}
