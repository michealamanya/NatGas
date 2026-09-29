import { ArrowRight, Minus, Package, Plus, ShoppingCart, Truck, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, User } from '../api/client';
import { CartItem, getCart, saveCart } from '../lib/cart';

export default function OrderCart() {
  const [cart,    setCart]    = useState<CartItem[]>(getCart());
  const [user,    setUser]    = useState<User | null>(null);
  const [error,   setError]   = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api<User>('/auth/me').then(r => setUser(r.data)).catch(() => undefined);
  }, []);

  const updateQty = (id: string, qty: number) => {
    const next = cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, qty) } : item);
    setCart(next); saveCart(next);
  };

  const removeItem = (id: string) => {
    const next = cart.filter(x => x.id !== id);
    setCart(next); saveCart(next);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setSending(true);
    const fd   = new FormData(e.currentTarget);
    const date = String(fd.get('preferredDate') ?? '');
    try {
      await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items:           cart.map(i => ({ productId: i.id, quantity: i.quantity })),
          deliveryAddress: fd.get('deliveryAddress'),
          district:        fd.get('district'),
          phone:           fd.get('phone'),
          deliveryMethod:  fd.get('deliveryMethod'),
          preferredDate:   date ? new Date(`${date}T09:00:00`).toISOString() : undefined,
          notes:           fd.get('notes'),
        }),
      });
      saveCart([]); setCart([]);
      navigate('/account?order=received');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit order');
    } finally {
      setSending(false);
    }
  };

  /* ── Empty cart ─────────────────────────────────────────────────── */
  if (!cart.length) {
    return (
      <div className="page-hero" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="page-hero-wrap" style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ width: 64, height: 64, background: 'var(--light)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <ShoppingCart size={26} color="var(--green)" />
          </div>
          <h1 style={{ fontSize: 26, marginBottom: 8 }}>Your order list is empty</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 22 }}>
            Browse our products and add items to place an order request.
          </p>
          <Link className="btn btn-primary" to="/products">
            Browse products <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="section">
      <div className="wrap">

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <span className="chip-sm">ORDER REQUEST</span>
          <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(26px,3.5vw,38px)', letterSpacing: '-1px', marginTop: 6, marginBottom: 4 }}>
            Review your order
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            {cart.length} item{cart.length !== 1 ? 's' : ''} · prices confirmed by our team after submission
          </p>
        </div>

        <div className="checkout-grid">

          {/* ── Left: items ──────────────────────────────────────── */}
          <div>
            <div className="checkout-items-card">
              <div className="checkout-items-head">
                <h2>Order items</h2>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
              </div>

              {cart.map(item => (
                <div className="checkout-item-row" key={item.id}>
                  {/* Image */}
                  <div className="checkout-item-img">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} />
                      : <Package size={20} color="var(--muted)" />
                    }
                  </div>

                  {/* Name */}
                  <div>
                    <div className="checkout-item-name">{item.name}</div>
                    {item.cylinderSize && (
                      <div className="checkout-item-sub">{item.cylinderSize}</div>
                    )}
                  </div>

                  {/* Qty */}
                  <div className="checkout-qty">
                    <button
                      type="button"
                      className="checkout-qty-btn"
                      aria-label="Decrease"
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                    >
                      <Minus size={11} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateQty(item.id, Number(e.target.value))}
                      aria-label="Quantity"
                    />
                    <button
                      type="button"
                      className="checkout-qty-btn"
                      aria-label="Increase"
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    className="checkout-remove"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.id)}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}

              <div className="checkout-note">
                ★ Final price confirmed by the NATGAS team after review. Delivery fees may apply.
              </div>
            </div>
          </div>

          {/* ── Right: form or sign-in ────────────────────────────── */}
          <div>
            {user ? (
              <div className="checkout-form-card">
                <div className="checkout-form-head">
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Truck size={16} color="var(--gold)" /> Delivery details
                  </h2>
                </div>
                <div className="checkout-form-body">
                  <form onSubmit={submit}>
                    <div className="fg">
                      <label>Fulfilment method</label>
                      <select name="deliveryMethod">
                        <option value="DELIVERY">Home / business delivery</option>
                        <option value="PICKUP">Collect from a NATGAS outlet</option>
                      </select>
                    </div>
                    <div className="fg">
                      <label>Delivery address *</label>
                      <input required name="deliveryAddress" placeholder="Street, building, landmark…" />
                    </div>
                    <div className="fg-row2">
                      <div className="fg">
                        <label>District *</label>
                        <input required name="district" placeholder="e.g. Wakiso" />
                      </div>
                      <div className="fg">
                        <label>Phone number *</label>
                        <input required name="phone" type="tel" defaultValue={user.phone ?? ''} placeholder="+256…" />
                      </div>
                    </div>
                    <div className="fg">
                      <label>Preferred date</label>
                      <input type="date" name="preferredDate" min={new Date().toISOString().slice(0, 10)} />
                    </div>
                    <div className="fg">
                      <label>Notes</label>
                      <textarea
                        name="notes"
                        rows={3}
                        placeholder="Landmark, preferred time or any delivery instructions…"
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    {error && <p className="form-err">{error}</p>}

                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={sending}
                      style={{ marginTop: 6 }}
                    >
                      {sending ? 'Submitting…' : <>Submit order request <ArrowRight size={14} /></>}
                    </button>

                    <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
                      After submission you can track your order status in{' '}
                      <Link to="/account" style={{ color: 'var(--green-3)', fontWeight: 700 }}>My Account</Link>.
                    </p>
                  </form>
                </div>
              </div>
            ) : (
              <div className="checkout-signin-card">
                <div style={{ width: 52, height: 52, background: 'var(--light)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <ShoppingCart size={22} color="var(--green)" />
                </div>
                <h2 style={{ fontSize: 18, marginBottom: 8 }}>Sign in to submit</h2>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Create a free customer account or sign in. Your cart is saved — you won't lose your items.
                </p>
                <Link className="btn btn-primary btn-full" to="/account?next=/order">
                  Create account / sign in <ArrowRight size={14} />
                </Link>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
                  Already have an account?{' '}
                  <Link to="/account?next=/order" style={{ color: 'var(--green-3)', fontWeight: 700 }}>Sign in here</Link>
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
