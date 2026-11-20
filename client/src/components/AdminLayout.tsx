import {
  BarChart3, Briefcase, FileText, Globe, LayoutDashboard,
  Camera, Image, KeyRound, Loader2, LogOut, Megaphone, MapPin, Menu, MessageSquare, Package, Settings, ShieldCheck, UserRound, Users, Upload, PanelLeftClose, PanelLeftOpen, X,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, User } from '../api/client';

const NAV = [
  { icon: LayoutDashboard, label: 'Overview', to: '/admin/dashboard', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { icon: Package, label: 'Products', to: '/admin/products', roles: ['EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
  { icon: Package, label: 'Services', to: '/admin/services', roles: ['EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
  { icon: Image, label: 'Media & Team', to: '/admin/media', roles: ['EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'HR'] },
  { icon: Globe, label: 'Site Experience', to: '/admin/experience', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { icon: Megaphone, label: 'Marketing', to: '/admin/marketing', roles: ['CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
  { icon: MapPin, label: 'Our Clients', to: '/admin/locations', roles: ['EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
  { icon: Package, label: 'Orders', to: '/admin/orders', roles: ['OPERATIONS', 'ADMIN', 'SUPER_ADMIN'] },
  { icon: FileText, label: 'News', to: '/admin/news', roles: ['EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'] },
  { icon: Briefcase, label: 'Jobs', to: '/admin/jobs', roles: ['HR', 'ADMIN', 'SUPER_ADMIN'] },
  { icon: MessageSquare, label: 'Messages', to: '/admin/messages', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { icon: Users, label: 'Staff & users', to: '/admin/users', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { icon: BarChart3, label: 'Audit Logs', to: '/admin/audit', roles: ['ADMIN', 'SUPER_ADMIN'] },
  { icon: Settings, label: 'Settings', to: '/admin/settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export default function AdminLayout({ user, onLogout }: { user: User; onLogout?: () => void }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);
  const [profileError, setProfileError] = useState('');
  const profileInput = useRef<HTMLInputElement>(null);
  const [newApplications, setNewApplications] = useState(0);
  const [navCollapsed, setNavCollapsed] = useState(() => localStorage.getItem('natgas-admin-nav-collapsed') === 'true');
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'security'>('profile');
  const [profileSaving, setProfileSaving] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let toastTimer: number | undefined;
    const showToast = (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      if (toastTimer) window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => setToast(null), 4000);
    };
    const handleStart = () => setActionBusy(true);
    const handleEnd = () => setActionBusy(false);
    const handleSuccess = (event: Event) => showToast(String((event as CustomEvent).detail ?? 'Action completed successfully.'), 'success');
    const handleError = (event: Event) => showToast(String((event as CustomEvent).detail ?? 'Action could not be completed.'), 'error');
    window.addEventListener('natgas-action-start', handleStart);
    window.addEventListener('natgas-action-end', handleEnd);
    window.addEventListener('natgas-action-success', handleSuccess);
    window.addEventListener('natgas-action-error', handleError);
    return () => {
      if (toastTimer) window.clearTimeout(toastTimer);
      window.removeEventListener('natgas-action-start', handleStart);
      window.removeEventListener('natgas-action-end', handleEnd);
      window.removeEventListener('natgas-action-success', handleSuccess);
      window.removeEventListener('natgas-action-error', handleError);
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
        setProfileMenuOpen(false);
        setProfileModalOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    const refreshApplications = () => api<{ counts?: { applications?: { new?: number } } }>('/admin/dashboard')
      .then(result => setNewApplications(result.data?.counts?.applications?.new ?? 0))
      .catch(() => undefined);
    void refreshApplications();
    const timer = window.setInterval(refreshApplications, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const closeProfileMenu = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', closeProfileMenu);
    return () => document.removeEventListener('mousedown', closeProfileMenu);
  }, []);

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /**/ }
    onLogout?.();
    navigate('/admin/login');
  };
  const toggleNav = () => setNavCollapsed(current => {
    const next = !current;
    localStorage.setItem('natgas-admin-nav-collapsed', String(next));
    return next;
  });

  const uploadProfilePhoto = async (file: File) => {
    setProfileError('');
    try {
      const form = new FormData(); form.append('file', file); form.append('folder', 'staff-avatars');
      const uploaded = await api<{ url: string }>('/admin/media/upload', { method: 'POST', body: form, headers: {} });
      const updated = await api<User>('/auth/profile/avatar', { method: 'PUT', body: JSON.stringify({ avatarUrl: uploaded.data.url }) });
      setProfile(current => ({ ...current, ...updated.data, avatarUrl: uploaded.data.url }));
    } catch (reason) { setProfileError(reason instanceof Error ? reason.message : 'Unable to update profile photo.'); }
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const updated = await api<User>('/auth/profile', { method: 'PUT', body: JSON.stringify(values) });
      setProfile(updated.data);
      setProfileModalOpen(false);
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      await api('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      event.currentTarget.reset();
      setProfileModalOpen(false);
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : 'Unable to change password.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className={`admin-wrap${navCollapsed ? ' nav-collapsed' : ''}${mobileNavOpen ? ' mobile-nav-open' : ''}`}>
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
          <button type="button" className="admin-nav-toggle" onClick={toggleNav} aria-label={navCollapsed ? 'Expand admin navigation' : 'Collapse admin navigation'} title={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}>
            {navCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <button type="button" className="admin-mobile-nav-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <div className="admin-nav">
          <div className="admin-nav-lbl">Workspace</div>
          {NAV.filter(item => {
            const accountRoles = profile.roles ?? [profile.role];
            return accountRoles.includes('SUPER_ADMIN') || accountRoles.some(role => item.roles.includes(role));
          }).map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `anav-link${isActive ? ' active' : ''}`}
              onClick={() => setMobileNavOpen(false)}
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
      <button
        type="button"
        className="admin-mobile-backdrop"
        aria-label="Close admin navigation"
        onClick={() => setMobileNavOpen(false)}
      />

      {/* ── Main body ── */}
      <div className="admin-body">
        {actionBusy && (
          <div className="admin-action-progress" role="status" aria-live="polite">
            <Loader2 size={14} className="spin" />
            <span>Processing action…</span>
          </div>
        )}
        {/* Top bar */}
        <div className="admin-top">
          <button type="button" className="admin-mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open admin navigation" aria-expanded={mobileNavOpen}>
            <Menu size={20} />
            <span>Menu</span>
          </button>
          <h2>Natgas Uganda — Content Management</h2>
          <div className="admin-top-r">
            <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
              {(profile.roles?.length ? profile.roles : [profile.role]).map(role => role.replace(/_/g, ' ').toLowerCase()).join(' · ')}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
              {profile.firstName} {profile.lastName}
            </span>
            <div className="admin-profile-menu-wrap" ref={profileMenuRef}>
              <button type="button" className="admin-profile-photo" onClick={() => setProfileMenuOpen(open => !open)} title="Open account menu" aria-label="Open account menu" aria-expanded={profileMenuOpen}>
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{profile.firstName[0]}{profile.lastName[0]}</span>}
              </button>
              {profileMenuOpen && (
                <div className="admin-profile-menu">
                  <div className="admin-profile-menu-head">
                    <div className="admin-profile-photo admin-profile-photo-large">
                      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{profile.firstName[0]}{profile.lastName[0]}</span>}
                    </div>
                    <div>
                      <strong>{profile.firstName} {profile.lastName}</strong>
                      <span>{profile.email}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setProfileTab('profile'); setProfileModalOpen(true); setProfileMenuOpen(false); }}>
                    <UserRound size={16} /> Account profile
                  </button>
                  <button type="button" onClick={() => { setProfileTab('security'); setProfileModalOpen(true); setProfileMenuOpen(false); }}>
                    <ShieldCheck size={16} /> Password &amp; security
                  </button>
                  <button type="button" onClick={() => profileInput.current?.click()}>
                    <Camera size={16} /> Change photo
                  </button>
                  <div className="admin-profile-menu-divider" />
                  <button type="button" className="danger" onClick={logout}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
            <input ref={profileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void uploadProfilePhoto(file); event.currentTarget.value = ''; }} />
          </div>
        </div>

        {profileError && <div className="admin-profile-error" role="status"><Upload size={13} /> {profileError}</div>}

        {/* Page content */}
        <main className="admin-main">
          <Outlet />
        </main>
        {toast && (
          <div className={`toast ${toast.type === 'error' ? 'error' : ''}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        )}
        {profileModalOpen && (
          <div className="admin-profile-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="admin-profile-title" onMouseDown={event => { if (event.target === event.currentTarget) setProfileModalOpen(false); }}>
            <div className="admin-profile-modal">
              <div className="admin-profile-modal-head">
                <div>
                  <span className="chip-sm">MY ACCOUNT</span>
                  <h2 id="admin-profile-title">Profile management</h2>
                </div>
                <button type="button" className="confirm-close" onClick={() => setProfileModalOpen(false)} aria-label="Close profile management"><X size={18} /></button>
              </div>
              <div className="admin-profile-tabs" role="tablist">
                <button type="button" className={profileTab === 'profile' ? 'active' : ''} onClick={() => setProfileTab('profile')}><UserRound size={15} /> Profile</button>
                <button type="button" className={profileTab === 'security' ? 'active' : ''} onClick={() => setProfileTab('security')}><KeyRound size={15} /> Security</button>
              </div>
              {profileTab === 'profile' ? (
                <form className="admin-profile-modal-form" onSubmit={saveProfile}>
                  <div className="admin-profile-identity">
                    <div className="admin-profile-photo admin-profile-photo-modal">
                      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{profile.firstName[0]}{profile.lastName[0]}</span>}
                    </div>
                    <div>
                      <b>{profile.firstName} {profile.lastName}</b>
                      <span>{(profile.roles?.length ? profile.roles : [profile.role]).map(role => role.replace(/_/g, ' ')).join(' · ')}</span>
                      <button type="button" className="tact" onClick={() => profileInput.current?.click()}><Camera size={13} /> Change photo</button>
                    </div>
                  </div>
                  <div className="form-grid">
                    <label>First name<input name="firstName" required minLength={1} maxLength={80} defaultValue={profile.firstName} /></label>
                    <label>Last name<input name="lastName" required minLength={1} maxLength={80} defaultValue={profile.lastName} /></label>
                    <label>Phone number<input name="phone" required minLength={7} maxLength={30} defaultValue={profile.phone ?? ''} /></label>
                    <label>Email address<input value={profile.email} readOnly /></label>
                  </div>
                  <div className="admin-profile-modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setProfileModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save changes'}</button>
                  </div>
                </form>
              ) : (
                <form className="admin-profile-modal-form" onSubmit={changePassword}>
                  <div className="admin-security-callout"><ShieldCheck size={18} /><div><b>Keep your account secure</b><span>Use at least 8 characters with uppercase, lowercase, number and symbol.</span></div></div>
                  <div className="form-grid single-column">
                    <label>Current password<input name="currentPassword" type="password" required autoComplete="current-password" /></label>
                    <label>New password<input name="newPassword" type="password" required minLength={8} autoComplete="new-password" /></label>
                    <label>Confirm new password<input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" /></label>
                  </div>
                  <div className="admin-profile-modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setProfileModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={profileSaving}>{profileSaving ? 'Updating…' : 'Update password'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
