import {
  CheckCircle2, Clock, Loader2, MessageSquare, PackageCheck,
  Truck, XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useRealtimeRefresh } from '../../lib/realtime';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice?: string;
  lineTotal?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  deliveryAddress: string;
  district: string;
  phone: string;
  deliveryMethod?: string;
  preferredDate?: string;
  notes?: string;
  staffNotes?: string;
  createdAt: string;
  customer: { firstName: string; lastName: string; email: string };
  items: OrderItem[];
}

type PendingUpdate = { orderId: string; status: string; staffNotes?: string } | null;

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
  'CANCELLED',
] as const;

const FINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

const STATUS_STEPS = [
  { key: 'PENDING',          label: 'Order received',  icon: Clock      },
  { key: 'CONFIRMED',        label: 'Confirmed',        icon: CheckCircle2 },
  { key: 'PREPARING',        label: 'Being prepared',   icon: PackageCheck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery', icon: Truck      },
  { key: 'COMPLETED',        label: 'Delivered',        icon: CheckCircle2 },
];

const STATUS_COLOUR: Record<string, { bg: string; color: string }> = {
  PENDING:          { bg: '#fdf0d5', color: '#8a5500' },
  CONFIRMED:        { bg: '#e8f5ec', color: '#176443' },
  PREPARING:        { bg: '#e8f5ec', color: '#176443' },
  OUT_FOR_DELIVERY: { bg: '#e8f0ff', color: '#2d4db8' },
  COMPLETED:        { bg: '#dcf0e5', color: '#14683a' },
  CANCELLED:        { bg: '#fdecea', color: '#b91c1c' },
};

function StatusBadge({ status }: { status: string }) {
  const col = STATUS_COLOUR[status] ?? { bg: '#eee', color: '#555' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: col.bg,
      color: col.color,
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function formatStatus(s: string) { return s.replace(/_/g, ' '); }

export default function AdminOrders() {
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate>(null);
  const [savingNote,    setSavingNote]    = useState<string | null>(null);
  const [filter,        setFilter]        = useState('ALL');

  const load = () => {
    setLoading(true);
    api<Order[]>('/admin/orders')
      .then(r => setOrders(r.data ?? []))
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useRealtimeRefresh(load);

  const applyUpdate = async (orderId: string, status: string, staffNotes?: string) => {
    setError('');
    try {
      await api(`/admin/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, ...(staffNotes == null ? {} : { staffNotes }) }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update order.');
    }
  };

  const handleStatusChange = (order: Order, newStatus: string) => {
    if (FINAL_STATUSES.has(newStatus)) {
      setPendingUpdate({ orderId: order.id, status: newStatus, staffNotes: order.staffNotes });
    } else {
      void applyUpdate(order.id, newStatus, order.staffNotes);
    }
  };

  const saveStaffNote = async (order: Order, note: string) => {
    setSavingNote(order.id);
    try {
      await api(`/admin/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: order.status, staffNotes: note }),
      });
      // optimistically update local state so UI reflects saved note
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, staffNotes: note } : o));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save note.');
    } finally {
      setSavingNote(null);
    }
  };

  const confirmUpdate = () => {
    if (!pendingUpdate) return;
    void applyUpdate(pendingUpdate.orderId, pendingUpdate.status, pendingUpdate.staffNotes);
    setPendingUpdate(null);
  };

  // Status filter options
  const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];
  const filteredOrders = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-head">
        <div>
          <h1 className="admin-pg-title">Customer orders</h1>
          <p className="admin-pg-sub">
            Manage order progress and send updates that customers can see in real time.
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', background: 'var(--light)', padding: '6px 14px', borderRadius: 20, fontWeight: 600 }}>
          {orders.length} total
        </div>
      </div>

      {error && <p className="form-err">{error}</p>}

      {/* Filter tabs */}
      <div className="jobs-tabs" style={{ marginBottom: 20 }}>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            className={`jobs-tab${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? 'All orders' : formatStatus(s).toLowerCase()}
            {s !== 'ALL' && (
              <span style={{ marginLeft: 5, fontSize: 11, color: 'var(--muted)' }}>
                ({orders.filter(o => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 size={26} className="spin" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <PackageCheck size={40} />
          <h3>{filter === 'ALL' ? 'No orders yet' : `No ${formatStatus(filter).toLowerCase()} orders`}</h3>
          <p>Orders placed by customers will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              savingNote={savingNote === order.id}
              onStatusChange={handleStatusChange}
              onSaveNote={saveStaffNote}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingUpdate !== null}
        title={pendingUpdate ? `Mark as ${formatStatus(pendingUpdate.status)}?` : ''}
        message={
          pendingUpdate?.status === 'CANCELLED'
            ? 'Cancelling cannot be undone. The customer will need to place a new request.'
            : 'Marking as completed will close this order. This cannot be reversed.'
        }
        onConfirm={confirmUpdate}
        onCancel={() => setPendingUpdate(null)}
      />
    </div>
  );
}

/* ── Order card ─────────────────────────────────────────────────── */
function OrderCard({
  order,
  savingNote,
  onStatusChange,
  onSaveNote,
}: {
  order: Order;
  savingNote: boolean;
  onStatusChange: (order: Order, status: string) => void;
  onSaveNote: (order: Order, note: string) => Promise<void>;
}) {
  const [noteValue,  setNoteValue]  = useState(order.staffNotes ?? '');
  const [noteDirty,  setNoteDirty]  = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === order.status);

  return (
    <div className="order-card-v2">
      {/* Head */}
      <div className="order-card-v2-head">
        <h3>
          <PackageCheck size={16} style={{ color: 'var(--gold)' }} />
          {order.orderNumber}
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>
            {new Date(order.createdAt).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </h3>
        <div className="order-card-v2-head-meta">
          <StatusBadge status={order.status} />
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <select
              className="table-select"
              value={order.status}
              onChange={e => onStatusChange(order, e.target.value)}
              aria-label={`Status for ${order.orderNumber}`}
            >
              {ORDER_STATUSES.map(s => (
                <option key={s} value={s}>{formatStatus(s)}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowDetail(d => !d)}
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-3)', background: 'none', border: 0, cursor: 'pointer' }}
          >
            {showDetail ? 'Collapse ▲' : 'Details ▼'}
          </button>
        </div>
      </div>

      {/* Progress timeline */}
      {order.status !== 'CANCELLED' && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: '#fafcfb' }}>
          <div style={{ display: 'flex', gap: 0, alignItems: 'center', overflow: 'hidden' }}>
            {STATUS_STEPS.map((step, idx) => {
              const done    = idx < currentIdx;
              const current = idx === currentIdx;
              const Icon    = step.icon;
              return (
                <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
                  {/* Connector line */}
                  {idx < STATUS_STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 13, left: '50%', right: '-50%', height: 2,
                      background: done ? 'var(--green)' : 'var(--border)',
                      zIndex: 0, transition: 'background .3s',
                    }} />
                  )}
                  {/* Dot */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: done ? 'var(--green)' : current ? 'var(--gold)' : '#fff',
                    border: `2px solid ${done ? 'var(--green)' : current ? 'var(--gold)' : 'var(--border)'}`,
                    display: 'grid', placeItems: 'center',
                    color: (done || current) ? '#fff' : 'var(--muted)',
                    zIndex: 1, position: 'relative', flexShrink: 0,
                    boxShadow: current ? '0 0 0 4px rgba(224,149,10,.18)' : 'none',
                    transition: 'all .3s',
                  }}>
                    <Icon size={12} />
                  </div>
                  {/* Label */}
                  <span style={{
                    fontSize: 10, fontWeight: current ? 700 : 500,
                    color: done ? 'var(--green)' : current ? 'var(--gold-text)' : 'var(--muted)',
                    textAlign: 'center', lineHeight: 1.3,
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.status === 'CANCELLED' && (
        <div style={{ padding: '12px 20px', background: '#fdecea', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>
          <XCircle size={16} /> This order was cancelled.
        </div>
      )}

      {/* Expanded detail */}
      {showDetail && (
        <div className="order-card-v2-body">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 8 }}>Customer</p>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text)' }}>
              <strong>{order.customer.firstName} {order.customer.lastName}</strong><br />
              {order.customer.email}<br />
              {order.phone}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 8 }}>Fulfilment</p>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text)' }}>
              {order.deliveryMethod === 'PICKUP' ? 'Outlet pickup' : 'Delivery'}<br />
              {order.deliveryAddress}, {order.district}
              {order.preferredDate && (
                <><br />Preferred: {new Date(order.preferredDate).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })}</>
              )}
            </div>
          </div>
          {order.items.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 8 }}>Items</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {order.items.map(item => (
                  <div key={item.id} style={{ fontSize: 13, color: 'var(--text)' }}>
                    {item.quantity} × {item.productName}
                    {item.lineTotal && (
                      <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 12 }}>
                        UGX {Number(item.lineTotal).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {order.notes && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--muted)', marginBottom: 8 }}>Customer note</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>{order.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Items strip */}
      <div className="order-card-v2-items">
        {order.items.map(item => (
          <span key={item.id} className="order-item-chip">
            {item.quantity} × {item.productName}
          </span>
        ))}
      </div>

      {/* Staff message composer — always visible */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: '#fffcf5' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>
          <MessageSquare size={13} />
          Message to customer
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>
            (visible in their account — use for price, timing or delivery updates)
          </span>
        </label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            rows={2}
            value={noteValue}
            onChange={e => { setNoteValue(e.target.value); setNoteDirty(true); }}
            placeholder="e.g. Your order is confirmed. Estimated delivery tomorrow between 10am–1pm. Total: UGX 150,000."
            style={{
              flex: 1, border: '1.5px solid var(--border)', borderRadius: 8,
              padding: '9px 12px', font: 'inherit', fontSize: 13,
              resize: 'vertical', minHeight: 60, outline: 'none',
              transition: 'border-color .13s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--green-3)'; }}
            onBlur={e  => { e.target.style.borderColor = 'var(--border)'; }}
          />
          <button
            className="btn btn-dark btn-sm"
            disabled={savingNote || !noteDirty}
            onClick={() => { void onSaveNote(order, noteValue); setNoteDirty(false); }}
            style={{ flexShrink: 0, height: 40 }}
          >
            {savingNote ? 'Saving…' : 'Send'}
          </button>
        </div>
        {noteValue && !noteDirty && (
          <p style={{ fontSize: 11, color: 'var(--green-3)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={11} /> Message saved — customer can see this.
          </p>
        )}
      </div>
    </div>
  );
}
