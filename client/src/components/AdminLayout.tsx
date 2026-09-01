import {
  BarChart3, Briefcase, FileText, Globe, LayoutDashboard,
  Image, LogOut, MapPin, MessageSquare, Package, Settings, Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api, User } from '../api/client';

const NAV = [
  { icon: LayoutDashboard, label: 'Overview',   to: '/admin/dashboard' },
  { icon: Package,         label: 'Products',   to: '/admin/products'  },
  { icon: Package,         label: 'Services',   to: '/admin/services'  },
  { icon: Image,           label: 'Media & Team', to: '/admin/media'   },
  { icon: Globe,           label: 'Site Experience', to: '/admin/experience' },
  { icon: MapPin,          label: 'Outlets',      to: '/admin/locations' },
  { icon: Package,         label: 'Orders',     to: '/admin/orders'    },
  { icon: FileText,        label: 'News',        to: '/admin/news'      },
  { icon: Briefcase,       label: 'Jobs',        to: '/admin/jobs'      },
  { icon: MessageSquare,   label: 'Messages',    to: '/admin/messages'  },
  { icon: Users,           label: 'Staff',       to: '/admin/users'     },
  { icon: BarChart3,       label: 'Audit Logs',  to: '/admin/audit'     },
  { icon: Settings,        label: 'Settings',    to: '/admin/settings'  },
];

export default function AdminLayout({ user, onLogout }: { user: User; onLogout?: () => void }) {
  const navigate = useNavigate();

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /**/ }
    onLogout?.();
    navigate('/admin/login');
  };

  return (
    <div className="admin-wrap">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <img
            src="/naticon.jpeg"
            alt="Natgas Uganda"
            style={{ height: 36, width: 'auto', objectFit: 'contain', borderRadius: 4 }}
          />
          <div className="admin-logo-text">
            NATGAS <small>ADMIN</small>
          </div>
        </div>

        <div className="admin-nav">
          <div className="admin-nav-lbl">Workspace</div>
          {NAV.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `anav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={15} /> {label}
            </NavLink>
          ))}

          <div className="admin-nav-lbl" style={{ marginTop: 20 }}>Quick actions</div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="anav-link"
          >
            <Globe size={15} /> View website ↗
          </a>
          <button className="anav-link" style={{ color: '#f5b120' }} onClick={logout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main body ── */}
      <div className="admin-body">
        {/* Top bar */}
        <div className="admin-top">
          <h2>Natgas Uganda — Content Management</h2>
          <div className="admin-top-r">
            <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
              {user.role.replace(/_/g, ' ').toLowerCase()}
            </span>
            <div className="admin-avatar">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
              {user.firstName} {user.lastName}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
