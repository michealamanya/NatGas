import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { api } from '../../api/client';

type Audit = { id: string; action: string; resource: string; createdAt: string; ipAddress?: string; user?: { firstName: string; lastName: string; email: string } };
export default function AdminAudit() {
  const [logs, setLogs] = useState<Audit[]>([]); const [error, setError] = useState('');
  useEffect(() => { api<Audit[]>('/admin/audit-logs?limit=50').then(r => setLogs(r.data)).catch(e => setError(e.message)); }, []);
  return <div><div className="admin-page-head"><div><h1 className="admin-page-title">Audit logs</h1><p className="admin-page-sub">A record of sensitive staff and content actions.</p></div></div>{error && <p className="form-err">{error}</p>}<section className="admin-card"><div className="admin-card-head"><h3><ClipboardList size={16}/> Recent activity</h3></div><div className="table-scroll"><table className="data-table"><thead><tr><th>When</th><th>Staff member</th><th>Action</th><th>Resource</th><th>IP address</th></tr></thead><tbody>{logs.map(log => <tr key={log.id}><td>{new Date(log.createdAt).toLocaleString()}</td><td>{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td><td><b>{log.action.replace(/_/g, ' ')}</b></td><td>{log.resource}</td><td>{log.ipAddress ?? '—'}</td></tr>)}{!logs.length && <tr><td colSpan={5}>No audit records yet.</td></tr>}</tbody></table></div></section></div>;
}
