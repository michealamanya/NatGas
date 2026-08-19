import { FormEvent, useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { api } from '../../api/client';

type Staff = { id: string; firstName: string; lastName: string; email: string; username: string; role: string; status: string; department?: string; lastLoginAt?: string };
const roles = ['EDITOR', 'CONTENT_MANAGER', 'HR', 'ADMIN'];

export default function AdminUsers() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const load = () => api<Staff[]>('/admin/users?limit=50').then(r => setStaff(r.data)).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { const r = await api<unknown>('/admin/users', { method: 'POST', body: JSON.stringify(values) }); setNotice(r.message ?? 'Staff account created.'); setShowForm(false); load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to create staff account.'); }
  };

  return <div>
    <div className="admin-page-head"><div><h1 className="admin-page-title">Staff & users</h1><p className="admin-page-sub">Manage secure access and assigned roles.</p></div><button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15}/> Add staff</button></div>
    {notice && <p className="form-ok">{notice}</p>}{error && <p className="form-err">{error}</p>}
    {showForm && <form className="admin-card admin-card-body admin-form" onSubmit={create}><h2>Create staff account</h2><div className="form-grid"><label>First name<input required name="firstName"/></label><label>Last name<input required name="lastName"/></label><label>Email<input required type="email" name="email"/></label><label>Username<input required name="username"/></label><label>Department<input name="department" placeholder="e.g. Operations"/></label><label>Role<select name="role">{roles.map(role => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}</select></label></div><div className="admin-form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-dark">Create account</button></div></form>}
    <section className="admin-card"><div className="admin-card-head"><h3><Users size={16}/> Team members</h3><span>{staff.length} accounts</span></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Staff member</th><th>Role</th><th>Department</th><th>Status</th><th>Last login</th></tr></thead><tbody>{staff.map(member => <tr key={member.id}><td><b>{member.firstName} {member.lastName}</b><small>{member.email}</small></td><td>{member.role.replace('_', ' ')}</td><td>{member.department ?? '—'}</td><td><span className={`status-pill ${member.status.toLowerCase()}`}>{member.status}</span></td><td>{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}</td></tr>)}{!staff.length && <tr><td colSpan={5}>No staff accounts found.</td></tr>}</tbody></table></div></section>
  </div>;
}
