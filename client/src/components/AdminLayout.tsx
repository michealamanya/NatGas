import {
  BarChart3, Briefcase, FileText, Globe, LayoutDashboard,
  Image, LogOut, MapPin, MessageSquare, Package, Settings, Users, Upload,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { api, User } from '../api/client';

const NAV = [
  { icon: LayoutDashboard, label: 'Overview',   to: '/admin/dashboard' },
  { icon: Package,         label: 'Products',   to: '/admin/products'  },
  { icon: Package,         label: 'Services',   to: '/admin/services'  },
  { icon: Image,           label: 'Media & Team', to: '/admin/media'   },
  { icon: Globe,           label: 'Site Experience', to: '/admin/experience' },
  { icon: MapPin,          label: 'Our Clients',  to: '/admin/locations' },
  { icon: Package,         label: 'Orders',     to: '/admin/orders'    },
  { icon: FileText,        label: 'News',        to: '/admin/news'      },
  { icon: Briefcase,       label: 'Jobs',        to: '/admin/jobs'      },
  { icon: MessageSquare,   label: 'Messages',    to: '/admin/messages'  },
  { icon: Users,           label: 'Staff & users', to: '/admin/users'   },
  { icon: BarChart3,       label: 'Audit Logs',  to: '/admin/audit'     },
  { icon: Settings,        label: 'Settings',    to: '/admin/settings'  },
];

export default function AdminLayout({ user, onLogout }: { user: User; onLogout?: () => void }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);
  const [profileError, setProfileError] = useState('');
  const profileInput = useRef<HTMLInputElement>(null);
  const [newApplications, setNewApplications] = useState(0);

  useEffect(() => {
    const refreshApplications = () => api<{ counts?: { applications?: { new?: number } } }>('/admin/dashboard')
      .then(result => setNewApplications(result.data?.counts?.applications?.new ?? 0))
      .catch(() => undefined);
    void refreshApplications();
    const timer = window.setInterval(refreshApplications, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /**/ }
    onLogout?.();
    navigate('/admin/login');
  };

  const uploadProfilePhoto = async (file: File) => {
    setProfileError('');
    try {
      const form = new FormData(); form.append('file', file); form.append('folder', 'staff-avatars');
      const uploaded = await api<{ url: string }>('/admin/media/upload', { method: 'POST', body: form, headers: {} });
      const updated = await api<User>('/auth/profile/avatar', { method: 'PUT', body: JSON.stringify({ avatarUrl: uploaded.data.url }) });
      setProfile(current => ({ ...current, ...updated.data, avatarUrl: uploaded.data.url }));
    } catch (reason) { setProfileError(reason instanceof Error ? reason.message : 'Unable to update profile photo.'); }
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
              <Icon size={15} /> <span>{label}</span>{label === 'Jobs' && newApplications > 0 && <b className="admin-nav-badge" aria-label={`${newApplications} new applications`}>{newApplications > 99 ? '99+' : newApplications}</b>}
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
              {profile.role.replace(/_/g, ' ').toLowerCase()}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
              {profile.firstName} {profile.lastName}
            </span>
            <button type="button" className="admin-profile-photo" onClick={() => profileInput.current?.click()} title="Change profile photo" aria-label="Change profile photo">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{profile.firstName[0]}{profile.lastName[0]}</span>}
            </button>
            <input ref={profileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void uploadProfilePhoto(file); event.currentTarget.value = ''; }} />
          </div>
        </div>

        {profileError && <div className="admin-profile-error" role="status"><Upload size={13} /> {profileError}</div>}

        {/* Page content */}
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
