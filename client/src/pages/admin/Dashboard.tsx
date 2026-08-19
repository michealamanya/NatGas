import { Briefcase, FileText, MessageSquare, Package, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, DashboardStats } from '../../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState<Partial<DashboardStats>>({});
  useEffect(() => {
    api<DashboardStats>('/admin/dashboard').then(r => setStats(r.data ?? {})).catch(() => undefined);
  }, []);

  const cards = [
    { icon: Package,       label: 'Products',         value: stats.products,         to: '/admin/products' },
    { icon: MessageSquare, label: 'Contact messages',  value: stats.contactMessages,  to: '/admin/messages' },
    { icon: Briefcase,     label: 'Job applications',  value: stats.jobApplications,  to: '/admin/jobs' },
    { icon: FileText,      label: 'News articles',     value: stats.newsArticles,     to: '/admin/news' },
    { icon: Users,         label: 'Staff accounts',    value: stats.users,            to: '/admin/users' },
    { icon: Package,       label: 'Services',          value: stats.services,         to: '/admin/services' },
  ];

  return (
    <>
      <h1 className="admin-page-title">Overview</h1>
      <p className="admin-page-sub">System snapshot for Natgas Uganda Limited</p>

      <div className="stat-cards">
        {cards.map(({ icon: Icon, label, value, to }) => (
          <Link to={to} className="stat-card" key={label} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="stat-card-label">{label}</span>
              <div className="stat-card-icon"><Icon size={18} /></div>
            </div>
            <div className="stat-card-value">{value ?? '—'}</div>
            <span className="stat-card-sub">Current total</span>
          </Link>
        ))}
      </div>

      <div className="admin-card" style={{ marginTop: 24 }}>
        <div className="admin-card-header"><h3>Quick links</h3></div>
        <div className="admin-card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn btn-green btn-sm" to="/admin/products">Manage products</Link>
          <Link className="btn btn-outline btn-sm" to="/admin/news">Write article</Link>
          <Link className="btn btn-outline btn-sm" to="/admin/jobs">Post a job</Link>
          <Link className="btn btn-outline btn-sm" to="/admin/messages">View messages</Link>
          <Link className="btn btn-ghost btn-sm" to="/" target="_blank">View website ↗</Link>
        </div>
      </div>
    </>
  );
}
