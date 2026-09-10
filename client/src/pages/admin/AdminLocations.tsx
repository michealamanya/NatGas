import { FormEvent, useEffect, useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, Location } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';

type Toast = { msg: string; type?: 'success' | 'error' } | null;

export default function AdminLocations() {
  const [items, setItems]       = useState<Location[]>([]);
  const [editing, setEditing]   = useState<Location | null>(null);
  const [open, setOpen]         = useState(false);
  const [toast, setToast]       = useState<Toast>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);

  const notify = (msg: string, type: NonNullable<Toast>['type'] = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const load = () =>
    api<Location[]>('/admin/locations')
      .then((r) => setItems(r.data ?? []))
      .catch((e) => notify(e instanceof Error ? e.message : 'Could not load clients.', 'error'));

  useEffect(() => { load(); }, []);

  const openForm = (item?: Location) => {
    setEditing(item ?? null);
    setOpen(true);
  };

  const closeForm = () => {
    setEditing(null);
    setOpen(false);
  };

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const payload = {
      ...d,
      isActive:        d.isActive        === 'on',
      isHeadquarters:  d.isHeadquarters  === 'on',
      latitude:        d.latitude  ? Number(d.latitude)  : null,
      longitude:       d.longitude ? Number(d.longitude) : null,
      displayOrder:    Number(d.displayOrder || 0),
    };
    try {
      const r = await api(
        editing ? `/admin/locations/${editing.id}` : '/admin/locations',
        { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) },
      );
      notify(r.message ?? 'Client saved.');
      closeForm();
      load();
    } catch (x) {
      notify(x instanceof Error ? x.message : 'Unable to save client.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api(`/admin/locations/${deleting.id}`, { method: 'DELETE' });
      notify('Client removed.');
      setDeleting(null);
      load();
    } catch (x) {
      notify(x instanceof Error ? x.message : 'Unable to delete.', 'error');
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Our Clients</h1>
          <p className="admin-page-sub">
            Manage the trusted clients showcased on the public website.
            Each entry shows the client's name, address, contact and directions.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <Plus size={15} /> Add client
        </button>
      </div>

      {/* ── Form ── */}
      {open && (
        <form className="admin-card admin-card-body admin-form" onSubmit={save}>
          <h2>{editing ? `Edit: ${editing.name}` : 'Add client'}</h2>

          <div className="form-grid">
            <label>
              Client / business name *
              <input required name="name" defaultValue={editing?.name} placeholder="e.g. Serena Hotel Kampala" />
            </label>

            <label>
              Address *
              <input required name="address" defaultValue={editing?.address} placeholder="e.g. Kintu Road, Nakasero" />
            </label>

            <label>
              District *
              <input required name="district" defaultValue={editing?.district} placeholder="e.g. Kampala" />
            </label>

            <label>
              Region *
              <input required name="region" defaultValue={editing?.region} placeholder="e.g. Central" />
            </label>

            <label>
              Phone
              <input name="phone" defaultValue={editing?.phone ?? ''} placeholder="+256 …" />
            </label>

            <label>
              Email
              <input type="email" name="email" defaultValue={editing?.email ?? ''} />
            </label>

            <label>
              Opening / service hours
              <input name="openingHours" defaultValue={editing?.openingHours ?? ''} placeholder="e.g. Mon–Fri 8:00 AM – 5:00 PM" />
            </label>

            <label>
              Display order
              <input type="number" name="displayOrder" defaultValue={editing?.displayOrder ?? 0} min={0} />
            </label>

            <label>
              Latitude <small>(for Google Maps pin)</small>
              <input type="number" step="any" name="latitude" defaultValue={editing?.latitude ?? ''} placeholder="e.g. 0.3476" />
            </label>

            <label>
              Longitude <small>(for Google Maps pin)</small>
              <input type="number" step="any" name="longitude" defaultValue={editing?.longitude ?? ''} placeholder="e.g. 32.5825" />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} style={{ width: 'auto' }} />
              Visible on public website
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" name="isHeadquarters" defaultChecked={editing?.isHeadquarters ?? false} style={{ width: 'auto' }} />
              Mark as headquarter / flagship client
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Save changes' : 'Add client'}
            </button>
          </div>
        </form>
      )}

      {/* ── Table ── */}
      <section className="admin-card">
        <div className="admin-card-head">
          <h3><MapPin size={15} /> All clients ({items.length})</h3>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>District</th>
                <th>Contact</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.name}</b>
                    <small>{item.address}</small>
                  </td>
                  <td>
                    {item.district}
                    <small>{item.region}</small>
                  </td>
                  <td>{item.phone ?? '—'}</td>
                  <td>
                    <span className={`status-pill ${item.isActive ? 'active' : 'inactive'}`}>
                      {item.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="tact" onClick={() => openForm(item)}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button className="tact danger" onClick={() => setDeleting(item)}>
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                    No clients added yet. Click "Add client" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Confirm delete ── */}
      <ConfirmDialog
        open={deleting !== null}
        title={`Remove ${deleting?.name ?? 'this client'}?`}
        message="This will remove the client from the public website. The action cannot be undone."
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {toast && (
        <div className={`toast${toast.type === 'error' ? ' error' : ''}`}>{toast.msg}</div>
      )}
    </div>
  );
}
