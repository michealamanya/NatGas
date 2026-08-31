import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
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
const Contact     = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Contact })));
const FAQ         = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.FAQ })));
const Privacy     = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Privacy })));
const Terms       = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Terms })));
const OrderCart   = lazy(() => import('./pages/OrderCart'));
const CustomerAccount = lazy(() => import('./pages/CustomerAccount'));

// ── Admin pages (lazy loaded) ─────────────────────────────────────────────────
const Login          = lazy(() => import('./pages/admin/Login'));
const Dashboard      = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts  = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders    = lazy(() => import('./pages/admin/AdminOrders'));
const AdminServices  = lazy(() => import('./pages/admin/AdminServices'));
const AdminNews      = lazy(() => import('./pages/admin/AdminNews'));
const AdminJobs      = lazy(() => import('./pages/admin/AdminJobs'));
const AdminMessages  = lazy(() => import('./pages/admin/AdminMessages'));
const AdminUsers     = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAudit     = lazy(() => import('./pages/admin/AdminAudit'));
const AdminSettings  = lazy(() => import('./pages/admin/AdminSettings'));
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

// ── Protected admin wrapper ────────────────────────────────────────────────────
function AdminGuard({ user, children }: { user: User | null; children: ReactNode }) {
  if (!user) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

// ── Root app ───────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Re-hydrate session on page load
  useEffect(() => {
    api<User>('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => undefined)
      .finally(() => setAuthReady(true));
  }, []);

  // Wait for auth check before rendering protected routes
  if (!authReady) return <Spinner />;

  return (
    <Suspense fallback={<Spinner />}>
      <ScrollTop />
      <Routes>

        {/* ── Public website ──────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route index               element={<Home />} />
          <Route path="about"        element={<About />} />
          <Route path="products"     element={<Products />} />
          <Route path="products/:slug" element={<ProductDetail />} />
          <Route path="services"     element={<Services />} />
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
        </Route>

        {/* ── Admin login (no layout) ─────────────────────── */}
        <Route
          path="/admin/login"
          element={
            user
              ? <Navigate to="/admin/dashboard" replace />
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
          <Route path="news"      element={<AdminNews />} />
          <Route path="jobs"      element={<AdminJobs />} />
          <Route path="messages"  element={<AdminMessages />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="audit"     element={<AdminAudit />} />
          <Route path="settings"  element={<AdminSettings />} />
        </Route>

        {/* ── Catch-all ───────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 96, fontWeight: 700, color: '#dde5e2', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: 28, color: 'var(--green, #0e3d39)', margin: 0 }}>Page not found</h1>
      <p style={{ color: '#52706b', maxWidth: 400 }}>The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0e3d39', color: '#fff', padding: '12px 22px', fontWeight: 600, fontSize: 14, textDecoration: 'none', borderRadius: 6 }}>
        ← Return to homepage
      </a>
    </div>
  );
}
