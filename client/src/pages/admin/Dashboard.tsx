import {
  Briefcase, FileText, Globe, Image,
  MessageSquare, Package, Settings, Users, Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

type DashboardData = {
  counts?: {
    products:     { total: number; published: number };
    services:     { total: number };
    news:         { total: number };
    jobs:         { total: number; open: number };
    applications: { total: number; new: number };
    contacts:     { total: number; unread: number };
    users:        { total: number; active: number };
    pages?:       { total: number };
  };
  system?:         { status: string; timestamp: string };
  recentActivity?: Array<{
    id: string; action: string; resource: string; createdAt: string;
    user?: { firstName: string; lastName: string };
  }>;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({});

  useEffect(() => {
    api<DashboardData>('/admin/dashboard')
      .then(r => setData(r.data ?? {}))
      .catch(() => undefined);
  }, []);

  const c = data.counts;

  const statCards = [
    { icon: Package,       label: 'Products', value: c?.products.total,  to: '/admin/products', sub: `${c?.products.published  ?? 0} published`      },
    { icon: Wrench,        label: 'Services', value: c?.services.total,  to: '/admin/services', sub: 'Public service catalogue'                       },
    { icon: MessageSquare, label: 'Messages', value: c?.contacts.total,  to: '/admin/messages', sub: `${c?.contacts.unread     ?? 0} unread`           },
    { icon: Briefcase,     label: 'Jobs',     value: c?.jobs.total,      to: '/admin/jobs',     sub: `${c?.applications.new    ?? 0} new applications` },
    { icon: Users,         label: 'Accounts', value: c?.users.total,     to: '/admin/users',    sub: `${c?.users.active        ?? 0} active`            },
    { icon: FileText,      label: 'News',     value: c?.news.total,      to: '/admin/news',     sub: 'Published content'                              },
  ];

  return (
    <div>
      {/* Header */}
      <div className="admin-page-head">
        <div>
          <h1 className="admin-pg-title">Overview</h1>
          <p className="admin-pg-sub">Your live NATGAS platform at a glance.</p>
        </div>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: data.system?.status === 'healthy' ? '#e8f5ec' : '#fdf0d5',
            color:      data.system?.status === 'healthy' ? '#176443' : '#8a5500',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {data.system?.status === 'healthy' ? 'System online' : 'Check system'}
        </span>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        {statCards.map(({ icon: Icon, label, value, to, sub }) => (
          <Link to={to} className="scard" key={label} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="scard-lbl">{label}</span>
              <div style={{ width: 32, height: 32, background: 'var(--light)', borderRadius: 8, display: 'grid', placeItems: 'center', color: 'var(--gold-text)' }}>
                <Icon size={16} />
              </div>
            </div>
            <div className="scard-val">{value ?? '—'}</div>
            <span className="scard-sub">{sub}</span>
          </Link>
        ))}
      </div>

      {/* Site controls */}
      <div className="acard" style={{ marginBottom: 16 }}>
        <div className="acard-head">
          <h3>Site controls</h3>
          <span>Update public content instantly</span>
        </div>
        <div className="acard-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary btn-sm" to="/admin/experience"><Globe size={13} /> Homepage &amp; visuals</Link>
          <Link className="btn btn-outline btn-sm" to="/admin/media"><Image size={13} /> Gallery &amp; team</Link>
          <Link className="btn btn-outline btn-sm" to="/admin/settings"><Settings size={13} /> Company settings</Link>
          <Link className="btn btn-outline btn-sm" to="/admin/orders">Manage orders</Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="acard">
        <div className="acard-head">
          <h3>Recent activity</h3>
          <Link to="/admin/audit" style={{ fontSize: 12, color: 'var(--green-3)', fontWeight: 600 }}>View audit log</Link>
        </div>
        <div className="acard-body" style={{ padding: 0 }}>
          {data.recentActivity?.length
            ? data.recentActivity.slice(0, 7).map((item, i, arr) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    gap: 12, padding: '11px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                    <b style={{ color: 'var(--green)', fontWeight: 700 }}>
                      {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System'}
                    </b>{' '}
                    {item.action.replace(/_/g, ' ').toLowerCase()}{' '}
                    <em style={{ fontStyle: 'normal', color: 'var(--muted)' }}>{item.resource}</em>
                  </span>
                  <small style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                    {new Date(item.createdAt).toLocaleString('en-UG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
              ))
            : <p className="media-empty" style={{ padding: '20px', textAlign: 'center' }}>Activity will appear here as your team works.</p>
          }
        </div>
      </div>
    </div>
  );
}
