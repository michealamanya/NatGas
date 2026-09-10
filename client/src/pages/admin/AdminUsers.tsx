import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, Pencil, Plus, ShieldCheck, Users } from 'lucide-react';
import { api } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';

type Account = {
  id: string; firstName: string; lastName: string; email: string; username: string;
  role: string; status: string; department?: string; phone?: string; lastLoginAt?: string;
};

const staffRoles = ['EDITOR', 'CONTENT_MANAGER', 'HR', 'ADMIN'];
const roleLabel = (role: string) => role.replace(/_/g, ' ');

export default function AdminUsers() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Account | null>(null);
  const [pendingAction, setPendingAction] = useState<{ account: Account; kind: 'status' | 'reset' } | null>(null);

  const load = async () => {
    try {
      const result = await api<Account[]>('/admin/users?limit=100');
      setAccounts(result.data ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load accounts.');
    }
  };
  useEffect(() => { void load(); }, []);

  const message = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 3500);
  };
  const showError = (cause: unknown, fallback: string) => setError(cause instanceof Error ? cause.message : fallback);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api('/admin/users', { method: 'POST', body: JSON.stringify(values) });
      message(result.message ?? 'Staff account created.'); setShowForm(false); await load();
    } catch (cause) { showError(cause, 'Unable to create staff account.'); }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      const result = await api(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
      message(result.message ?? 'Role updated.'); await load();
    } catch (cause) { showError(cause, 'Unable to update role.'); }
  };

  const changeStatus = async (account: Account) => {
    const status = account.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const result = await api(`/admin/users/${account.id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      message(result.message ?? `Account ${status.toLowerCase()}.`); await load();
    } catch (cause) { showError(cause, 'Unable to update account status.'); }
  };

  const reset = async (id: string) => {
    try {
      const result = await api(`/admin/users/${id}/reset-password`, { method: 'POST' });
      message(result.message ?? 'Password reset issued.');
    } catch (cause) { showError(cause, 'Unable to reset password.'); }
  };

  const update = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const password = String(fields.password ?? '');
    delete fields.password;
    try {
      await api(`/admin/users/${editing.id}`, { method: 'PUT', body: JSON.stringify(fields) });
      if (password) await api(`/admin/users/${editing.id}/password`, { method: 'PUT', body: JSON.stringify({ password }) });
      message(password ? 'Account details and temporary password updated.' : 'Account details updated.');
      setEditing(null); await load();
    } catch (cause) { showError(cause, 'Unable to update this account.'); }
  };

  const customers = accounts.filter(account => account.role === 'CUSTOMER');
  const staff = accounts.filter(account => account.role !== 'CUSTOMER');
  const rows = [...staff, ...customers];

  return <div>
    <div className="admin-page-head">
      <div><h1 className="admin-page-title">Staff & users</h1><p className="admin-page-sub">Manage staff access and registered customer accounts.</p></div>
      <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Add staff</button>
    </div>
    <div className="admin-kpi-row">
      <div className="admin-kpi"><span>Staff accounts</span><strong>{staff.length}</strong></div>
      <div className="admin-kpi"><span>Customer accounts</span><strong>{customers.length}</strong></div>
    </div>
    {notice && <p className="form-ok">{notice}</p>}
    {error && <p className="form-err">{error}</p>}
    {showForm && <form className="admin-card admin-card-body admin-form" onSubmit={create}>
      <h2>Create staff account</h2>
      <div className="form-grid">
        <label>First name<input required name="firstName" /></label><label>Last name<input required name="lastName" /></label>
        <label>Email<input required type="email" name="email" /></label><label>Username<input required name="username" /></label>
        <label>Department<input name="department" placeholder="e.g. Operations" /></label>
        <label>Role<select name="role">{staffRoles.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
        <label>Temporary password <small>(optional)</small><input name="password" type="password" minLength={8} /></label>
      </div>
      <div className="admin-form-actions"><button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-dark">Create account</button></div>
    </form>}
    {editing && <form className="admin-card admin-card-body admin-form" onSubmit={update}>
      <h2>Edit {editing.role === 'CUSTOMER' ? 'customer' : 'staff'} account</h2>
      <p className="admin-page-sub">Update contact details, access profile information, or set a temporary password. Password changes require the account holder to choose a new password at sign-in.</p>
      <div className="form-grid">
        <label>First name<input required name="firstName" defaultValue={editing.firstName} /></label><label>Last name<input required name="lastName" defaultValue={editing.lastName} /></label>
        <label>Email<input required type="email" name="email" defaultValue={editing.email} /></label><label>Username<input required name="username" defaultValue={editing.username} /></label>
        <label>Phone number<input name="phone" defaultValue={editing.phone ?? ''} /></label><label>Department<input name="department" defaultValue={editing.department ?? ''} disabled={editing.role === 'CUSTOMER'} /></label>
        <label>New temporary password <small>(leave blank to keep current)</small><input name="password" type="password" minLength={8} placeholder="Uppercase, lowercase, number & symbol" /></label>
      </div>
      <div className="admin-form-actions"><button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary">Save account</button></div>
    </form>}
    <section className="admin-card">
      <div className="admin-card-head"><h3><Users size={16} /> All accounts</h3><span>{accounts.length} total</span></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Account</th><th>Access</th><th>Department / phone</th><th>Status</th><th>Last login</th><th>Actions</th></tr></thead>
        <tbody>{rows.map(account => <tr key={account.id}>
          <td><b>{account.firstName} {account.lastName}</b><small>{account.email}</small></td>
          <td>{account.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : account.role === 'CUSTOMER' ? 'CUSTOMER' : <select className="table-select" value={account.role} onChange={event => changeRole(account.id, event.target.value)}>{staffRoles.map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}</select>}</td>
          <td>{account.role === 'CUSTOMER' ? account.phone || '—' : account.department || '—'}</td>
          <td><span className={`status-pill ${account.status.toLowerCase()}`}>{account.status}</span></td>
          <td>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleDateString() : 'Never'}</td>
          <td><div className="staff-actions">
            <button className="tact" onClick={() => setEditing(account)}><Pencil size={13} /> Edit</button>
            {account.role !== 'SUPER_ADMIN' && <button className="tact" onClick={() => setPendingAction({ account, kind: 'status' })}><ShieldCheck size={13} />{account.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</button>}
            <button className="tact" onClick={() => setEditing(account)}><KeyRound size={13} /> Password</button>
            <button className="tact" onClick={() => setPendingAction({ account, kind: 'reset' })}><KeyRound size={13} /> Reset</button>
          </div></td>
        </tr>)}{!rows.length && <tr><td colSpan={6}>No accounts found.</td></tr>}</tbody>
      </table></div>
    </section>
    <ConfirmDialog open={Boolean(pendingAction)} title={pendingAction?.kind === 'reset' ? 'Reset account password?' : `${pendingAction?.account.status === 'ACTIVE' ? 'Suspend' : 'Activate'} this account?`} message={pendingAction?.kind === 'reset' ? `A new temporary password will be generated for ${pendingAction?.account.email}.` : pendingAction?.account.status === 'ACTIVE' ? `${pendingAction?.account.email} will no longer be able to sign in or place orders.` : `${pendingAction?.account.email} will be able to sign in again.`} confirmLabel={pendingAction?.kind === 'reset' ? 'Reset password' : pendingAction?.account.status === 'ACTIVE' ? 'Suspend account' : 'Activate account'} onCancel={() => setPendingAction(null)} onConfirm={() => { const action = pendingAction; setPendingAction(null); if (action?.kind === 'reset') void reset(action.account.id); else if (action) void changeStatus(action.account); }} />
  </div>;
}
