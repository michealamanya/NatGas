import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, LogOut, PackageCheck, Truck, UserRound, XCircle } from 'lucide-react';
import { api, User } from '../api/client';
import { useRealtimeRefresh } from '../lib/realtime';

type OrderItem = { id: string; productName: string; quantity: number };

type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  district?: string;
  preferredDate?: string;
  staffNotes?: string;
  items: OrderItem[];
};

/* ── Status helpers ─────────────────────────────────────────────── */
const STATUS_STEPS = [
  { key: 'PENDING',          label: 'Order received' },
  { key: 'CONFIRMED',        label: 'Confirmed'       },
  { key: 'PREPARING',        label: 'Being prepared'  },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { key: 'COMPLETED',        label: 'Delivered'       },
];

const STATUS_COLOUR: Record<string, string> = {
  PENDING:          'background:#fdf0d5;color:#8a5500',
  CONFIRMED:        'background:#e8f5ec;color:#176443',
  PREPARING:        'background:#e8f5ec;color:#176443',
  OUT_FOR_DELIVERY: 'background:#e8f0ff;color:#2d4db8',
  COMPLETED:        'background:#dcf0e5;color:#14683a',
  CANCELLED:        'background:#fdecea;color:#b91c1c',
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function StatusTimeline({ status }: { status: string }) {
  if (status === 'CANCELLED') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>
        <XCircle size={18} />  This order was cancelled.
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);

  return (
    <div className="order-timeline">
      {STATUS_STEPS.map((step, idx) => {
        const done    = idx < currentIdx;
        const current = idx === currentIdx;
        return (
          <div key={step.key} className={`otl-step${done ? ' done' : ''}${current ? ' current' : ''}`}>
            <div className="otl-dot">
              {done ? <CheckCircle2 size={14} /> : idx + 1}
            </div>
            <div className="otl-label">
              {step.label}
              {current && (
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>
                  ← current
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Order card ─────────────────────────────────────────────────── */
function OrderCard({ order }: { order: CustomerOrder }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="order-card-v2">
      {/* Head */}
      <div className="order-card-v2-head">
        <h3>
          <PackageCheck size={16} style={{ color: 'var(--gold)' }} />
          {order.orderNumber}
        </h3>
        <div className="order-card-v2-head-meta">
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {new Date(order.createdAt).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, ...Object.fromEntries((STATUS_COLOUR[order.status] ?? 'background:#eee;color:#555').split(';').map(s => s.split(':'))) }}>
            {statusLabel(order.status)}
          </span>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-3)', background: 'none', border: 0, cursor: 'pointer' }}
          >
            {expanded ? 'Hide details ▲' : 'View details ▼'}
          </button>
        </div>
      </div>

      {/* Items strip (always visible) */}
      <div className="order-card-v2-items">
        {order.items.map(item => (
          <span key={item.id} className="order-item-chip">
            {item.quantity} × {item.productName}
          </span>
        ))}
      </div>

      {/* Staff message (always visible if present) */}
      {order.staffNotes && (
        <div style={{ padding: '0 20px 14px' }}>
          <div className="order-staff-note">
            <div className="order-staff-note-label">
              <Truck size={12} /> Message from NATGAS
            </div>
            <p>{order.staffNotes}</p>
          </div>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="order-card-v2-body" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Timeline */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 10 }}>
              Order progress
            </p>
            <StatusTimeline status={order.status} />
          </div>

          {/* Delivery info */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 10 }}>
              Delivery details
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text)' }}>
              <span>
                <strong style={{ color: 'var(--muted)', fontSize: 11 }}>Method: </strong>
                {order.deliveryMethod === 'PICKUP' ? 'Outlet collection' : 'Home / business delivery'}
              </span>
              {order.deliveryAddress && (
                <span>
                  <strong style={{ color: 'var(--muted)', fontSize: 11 }}>Address: </strong>
                  {order.deliveryAddress}{order.district ? `, ${order.district}` : ''}
                </span>
              )}
              {order.preferredDate && (
                <span>
                  <strong style={{ color: 'var(--muted)', fontSize: 11 }}>Preferred date: </strong>
                  {new Date(order.preferredDate).toLocaleDateString('en-UG', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function CustomerAccount() {
  const [mode,   setMode]   = useState<'register' | 'login'>('register');
  const [user,   setUser]   = useState<User | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [error,  setError]  = useState('');
  const [notice, setNotice] = useState('');
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const loadAccount = async () => {
    try {
      const [acct, hist] = await Promise.all([
        api<User>('/auth/me'),
        api<CustomerOrder[]>('/orders/mine'),
      ]);
      setUser(acct.data);
      setOrders(hist.data ?? []);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => { void loadAccount(); }, []);
  useRealtimeRefresh(loadAccount);

  useEffect(() => {
    if (params.get('order') === 'received') {
      setNotice('✓ Your order request was received! You can track its status below as our team reviews it.');
    }
  }, [params]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      await api(
        mode === 'register' ? '/auth/register' : '/auth/login',
        { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) },
      );
      await loadAccount();
      window.dispatchEvent(new Event('natgas-auth-change'));
      navigate(params.get('next') ?? '/account', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to continue.');
    }
  };

  const saveProfile = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const r = await api<User>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      setUser(r.data);
      setNotice(r.message ?? 'Account details updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save account details.');
    }
  };

  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const r = await api('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      (e.target as HTMLFormElement).reset();
      setNotice(r.message ?? 'Password changed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to change password.');
    }
  };

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } finally {
      setUser(null); setOrders([]);
      window.dispatchEvent(new Event('natgas-auth-change'));
      navigate('/account', { replace: true });
    }
  };

  /* ── Not logged in ──────────────────────────────────────────────── */
  if (!user) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="account-box admin-card admin-card-body">
            <span className="chip-sm">CUSTOMER ACCOUNT</span>
            <h1>{mode === 'register' ? 'Create your order account' : 'Welcome back'}</h1>
            <p>Sign in to submit LPG order requests and track their progress.</p>

            <div className="jobs-tabs" style={{ marginBottom: 20 }}>
              <button
                type="button"
                className={`jobs-tab${mode === 'register' ? ' active' : ''}`}
                onClick={() => setMode('register')}
              >
                Create account
              </button>
              <button
                type="button"
                className={`jobs-tab${mode === 'login' ? ' active' : ''}`}
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </div>

            <form className="order-form" onSubmit={submit}>
              {error  && <p className="form-err">{error}</p>}
              {notice && <p className="form-ok"><p>{notice}</p></p>}

              {mode === 'register' && (
                <>
                  <label>First name <input required name="firstName" /></label>
                  <label>Last name  <input required name="lastName"  /></label>
                  <label>Phone number <input required name="phone" type="tel" /></label>
                </>
              )}
              <label>Email address <input required type="email" name="email" /></label>
              <label>
                Password
                <input required type="password" name="password" minLength={8} />
                {mode === 'register' && (
                  <span className="password-help">At least 8 characters</span>
                )}
              </label>

              <button className="btn btn-primary btn-full">
                {mode === 'register' ? 'Create account and continue' : 'Sign in and continue'}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  /* ── Logged in ──────────────────────────────────────────────────── */
  return (
    <section className="section customer-account-section">
      <div className="wrap">

        {/* Header */}
        <div className="customer-account-head">
          <div>
            <span className="chip-sm">MY NATGAS ACCOUNT</span>
            <h1>Hello, {user.firstName}.</h1>
            <p>Track your orders, view delivery updates and manage your account.</p>
          </div>
          <div>
            <Link className="btn btn-outline" to="/products">
              <PackageCheck size={15} /> Order gas
            </Link>
            <button className="btn btn-dark" onClick={logout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>

        {notice && (
          <div className="form-ok" style={{ marginBottom: 24 }}>
            <p>{notice}</p>
          </div>
        )}
        {error && <p className="form-err" style={{ marginBottom: 16 }}>{error}</p>}

        <div className="customer-account-grid">

          {/* ── Orders ────────────────────────────────────────────── */}
          <div className="customer-orders">
            <h2>Your order requests</h2>

            {orders.length === 0 ? (
              <div className="customer-empty">
                <UserRound size={28} />
                <h3>No orders yet</h3>
                <p>When you place an LPG order, it will appear here with live status updates.</p>
                <Link className="btn btn-primary" to="/products">Browse products</Link>
              </div>
            ) : (
              orders.map(order => <OrderCard key={order.id} order={order} />)
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────────────── */}
          <aside className="customer-account-controls">

            {/* Profile form */}
            <form className="admin-card admin-card-body order-form" onSubmit={saveProfile}>
              <h2>Account details</h2>
              <label>First name  <input required name="firstName" defaultValue={user.firstName} /></label>
              <label>Last name   <input required name="lastName"  defaultValue={user.lastName}  /></label>
              <label>Phone number<input required name="phone"     defaultValue={user.phone ?? ''} /></label>
              <label>
                Email address
                <input value={user.email} disabled style={{ opacity: .6 }} />
              </label>
              <button className="btn btn-primary">Save details</button>
            </form>

            {/* Password form */}
            <form className="admin-card admin-card-body order-form" onSubmit={changePassword}>
              <h2>Change password</h2>
              <label>Current password <input required type="password" name="currentPassword" /></label>
              <label>New password      <input required type="password" name="newPassword" minLength={8} /></label>
              <label>Confirm password  <input required type="password" name="confirmPassword" minLength={8} /></label>
              <button className="btn btn-outline">Update password</button>
            </form>

          </aside>
        </div>
      </div>
    </section>
  );
}
