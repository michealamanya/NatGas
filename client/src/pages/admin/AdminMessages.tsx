import { Loader2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';

interface Msg { id:string; name:string; email:string; phone?:string; subject:string; message:string; status:string; createdAt:string; }

export default function AdminMessages() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Msg | null>(null);
  const [toast, setToast]       = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => {
    setLoading(true);
    api<Msg[]>('/admin/contact?limit=100')
      .then(r => setMessages(r.data ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markRead = async (m: Msg) => {
    try {
      await api(`/admin/contact/${m.id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'READ' }) });
      notify('Marked as read'); load();
    } catch { notify('Failed'); }
  };

  const archive = async (m: Msg) => {
    try {
      await api(`/admin/contact/${m.id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'ARCHIVED' }) });
      notify('Archived'); if (selected?.id === m.id) setSelected(null); load();
    } catch { notify('Failed'); }
  };

  const STATUS_COLOR: Record<string,string> = { UNREAD: 'badge-new', READ: 'badge-published', ARCHIVED: 'badge-archived' };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">Contact Messages</h1>
        <p className="admin-page-sub">Messages submitted via the public contact form.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>All messages ({messages.length})</h3>
          </div>
          {loading ? (
            <div className="loading-state"><Loader2 size={22} className="spin" /></div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>From</th><th>Subject</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {messages.map(m => (
                    <tr key={m.id} style={{ cursor:'pointer' }} onClick={() => setSelected(m)}>
                      <td>
                        <b>{m.name}</b>
                        <small>{m.email}</small>
                      </td>
                      <td>{m.subject}</td>
                      <td><span className={`badge ${STATUS_COLOR[m.status] ?? 'badge-draft'}`}>{m.status}</span></td>
                      <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="actions">
                          {m.status !== 'READ' && <button className="tbl-btn" onClick={() => markRead(m)}>Mark read</button>}
                          <button className="tbl-btn danger" onClick={() => archive(m)}>Archive</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {messages.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--muted)', padding:'40px' }}>
                      <Mail size={32} style={{ opacity:.2, display:'block', margin:'0 auto 10px' }} />
                      No messages yet.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div className="admin-card" style={{ height: 'fit-content', position: 'sticky', top: 80 }}>
            <div className="admin-card-header">
              <h3>Message</h3>
              <button style={{ background:'none', border:0, cursor:'pointer', fontSize: 18, color:'var(--muted)' }} onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="admin-card-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>From</div>
                <b>{selected.name}</b>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{selected.email}</div>
                {selected.phone && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{selected.phone}</div>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Subject</div>
                <b>{selected.subject}</b>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Message</div>
                <p style={{ background: 'var(--cream)', padding: '14px 16px', borderRadius: 6, fontSize: 14, lineHeight: 1.75, color: 'var(--text)' }}>
                  {selected.message}
                </p>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
                Received {new Date(selected.createdAt).toLocaleString()}
              </div>
              <div style={{ display:'flex', gap: 8 }}>
                <a href={`mailto:${selected.email}?subject=Re: ${selected.subject}`} className="btn btn-primary btn-sm">
                  Reply via email
                </a>
                <button className="btn btn-outline btn-sm" onClick={() => archive(selected)}>Archive</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
