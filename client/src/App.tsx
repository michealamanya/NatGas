import { Component, lazy, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { api, User } from './api/client';
import AdminLayout from './components/AdminLayout';
import PublicLayout from './components/PublicLayout';

// ── Public pages (lazy loaded) ────────────────────────────────────────────────
const Home        = lazy(() => import('./pages/Home'));
const Products    = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/Products').then(m => ({ default: m.ProductDetail })));
const Careers     = lazy(() => import('./pages/Careers'));
const JobDetail   = lazy(() => import('./pages/Careers').then(m => ({ default: m.JobDetail })));
const News        = lazy(() => import('./pages/News'));
const NewsArticle = lazy(() => import('./pages/News').then(m => ({ default: m.NewsArticlePage })));
const About       = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.About })));
const Services    = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Services })));
const ServiceDetail = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ServiceDetail })));
const Contact     = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Contact })));
const FAQ         = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.FAQ })));
const Privacy     = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Privacy })));
const Terms       = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Terms })));
const OrderCart   = lazy(() => import('./pages/OrderCart'));
const CustomerAccount = lazy(() => import('./pages/CustomerAccount'));
const Media       = lazy(() => import('./pages/Media'));
const Locations   = lazy(() => import('./pages/Locations'));
const WhyChoose   = lazy(() => import('./pages/CompanyGuides').then(m => ({ default: m.WhyChoose })));
const HowToOrder  = lazy(() => import('./pages/CompanyGuides').then(m => ({ default: m.HowToOrder })));

// ── Admin pages (lazy loaded) ─────────────────────────────────────────────────
const Login          = lazy(() => import('./pages/admin/Login'));
const Dashboard      = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts  = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders    = lazy(() => import('./pages/admin/AdminOrders'));
const AdminServices  = lazy(() => import('./pages/admin/AdminServices'));
const AdminMedia     = lazy(() => import('./pages/admin/AdminMedia'));
const AdminLocations = lazy(() => import('./pages/admin/AdminLocations'));
const AdminNews      = lazy(() => import('./pages/admin/AdminNews'));
const AdminJobs      = lazy(() => import('./pages/admin/AdminJobs'));
const AdminMessages  = lazy(() => import('./pages/admin/AdminMessages'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAudit     = lazy(() => import('./pages/admin/AdminAudit'));
const AdminSettings  = lazy(() => import('./pages/admin/AdminSettings'));
const AdminExperience = lazy(() => import('./pages/admin/AdminExperience'));
const AdminPlaceholder = lazy(() => import('./pages/admin/AdminPlaceholder'));

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #dde5e2', borderTopColor: '#0e3d39', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

// ── Scroll to top on route change ─────────────────────────────────────────────
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('NatGas page failed to render', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="error-state" role="alert">
        <span className="chip-sm">TEMPORARY DISPLAY ERROR</span>
        <h1>We’re refreshing this page.</h1>
        <p>A recent update could not be displayed. Reload once to continue.</p>
        <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>Reload page</button>
      </main>
    );
  }
}

// ── Protected admin wrapper ────────────────────────────────────────────────────
function AdminGuard({ user, children }: { user: User | null; children: ReactNode }) {
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role === 'CUSTOMER') return <Navigate to="/account" replace />;
  return <>{children}</>;
}

// ── Root app ───────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Re-hydrate session on page load
  useEffect(() => {
    const syncSession = () => {
      api<User>('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => setUser(null))
        .finally(() => setAuthReady(true));
    };
    syncSession();
    window.addEventListener('natgas-auth-change', syncSession);
    return () => window.removeEventListener('natgas-auth-change', syncSession);
  }, []);

  // Wait for auth check before rendering protected routes
  if (!authReady) return <Spinner />;

  return (
    <Suspense fallback={<Spinner />}>
      <ScrollTop />
      <AppErrorBoundary>
      <Routes>

        {/* ── Public website ──────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route index               element={<Home />} />
          <Route path="about"        element={<About />} />
          <Route path="products"     element={<Products />} />
          <Route path="products/:slug" element={<ProductDetail />} />
          <Route path="services"     element={<Services />} />
          <Route path="services/:slug" element={<ServiceDetail />} />
          <Route path="media"        element={<Media />} />
          <Route path="locations"    element={<Locations />} />
          <Route path="why-choose"   element={<WhyChoose />} />
          <Route path="how-to-order" element={<HowToOrder />} />
          <Route path="careers"      element={<Careers />} />
          <Route path="careers/:slug" element={<JobDetail />} />
          <Route path="news"         element={<News />} />
          <Route path="news/:slug"   element={<NewsArticle />} />
          <Route path="contact"      element={<Contact />} />
          <Route path="faq"          element={<FAQ />} />
          <Route path="privacy"      element={<Privacy />} />
          <Route path="terms"        element={<Terms />} />
          <Route path="order"        element={<OrderCart />} />
          <Route path="account"      element={<CustomerAccount />} />
          <Route path="*"             element={<NotFound />} />
        </Route>

        {/* ── Admin login (no layout) ─────────────────────── */}
        <Route
          path="/admin/login"
          element={
            user
              ? <Navigate to={user.role === 'CUSTOMER' ? '/account' : '/admin/dashboard'} replace />
              : <Login onLogin={setUser} />
          }
        />

        {/* ── Admin (protected) ───────────────────────────── */}
        <Route
          path="/admin"
          element={
            <AdminGuard user={user}>
              <AdminLayout user={user!} onLogout={() => setUser(null)} />
            </AdminGuard>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products"  element={<AdminProducts />} />
          <Route path="orders"    element={<AdminOrders />} />
          <Route path="services"  element={<AdminServices />} />
          <Route path="media"     element={<AdminMedia />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="news"      element={<AdminNews />} />
          <Route path="jobs"      element={<AdminJobs />} />
          <Route path="messages"  element={<AdminMessages />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="audit"     element={<AdminAudit />} />
          <Route path="settings"  element={<AdminSettings />} />
          <Route path="experience" element={<AdminExperience />} />
        </Route>

        {/* ── Catch-all ───────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </AppErrorBoundary>
    </Suspense>
  );
}

function NotFound() {
  const location = useLocation();
  return (
    <main className="not-found-page">
      <div className="not-found-code">404</div>
      <span className="chip-sm">PAGE NOT FOUND</span>
      <h1>This page has moved or does not exist.</h1>
      <p>We could not find <code>{location.pathname}</code>. Try the main navigation or return to the NatGas homepage.</p>
      <div className="not-found-actions">
        ← Return to homepage
        <Link className="btn btn-primary" to="/">Return home</Link>
        <Link className="btn btn-outline" to="/contact">Contact NatGas</Link>
      </div>
    </main>
  );
}
