import { Loader2, PackageCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';

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

// Statuses that are final and should require confirmation before setting.
const FINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

function formatMoney(value?: string): string {
  if (!value) return 'To confirm';
  return `UGX ${Number(value).toLocaleString('en-UG')}`;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate>(null);

  const load = () => {
    setLoading(true);
    api<Order[]>('/admin/orders')
      .then((r) => setOrders(r.data ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const applyUpdate = async (orderId: string, status: string, staffNotes?: string) => {
    setError('');
    try {
      await api(`/admin/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, staffNotes }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update order.');
    }
  };

  // Status change: ask for confirmation when moving to a final/irreversible state.
  const handleStatusChange = (order: Order, newStatus: string) => {
    if (FINAL_STATUSES.has(newStatus)) {
      setPendingUpdate({ orderId: order.id, status: newStatus, staffNotes: order.staffNotes });
    } else {
      void applyUpdate(order.id, newStatus, order.staffNotes);
    }
  };

  const confirmUpdate = () => {
    if (!pendingUpdate) return;
    void applyUpdate(pendingUpdate.orderId, pendingUpdate.status, pendingUpdate.staffNotes);
    setPendingUpdate(null);
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Customer orders</h1>
          <p className="admin-page-sub">
            Confirm fulfilment, review price snapshots and manage delivery instructions.
          </p>
        </div>
      </div>

      {error && <p className="form-err">{error}</p>}

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spin" />
        </div>
      ) : (
        <div className="admin-order-list">
          {orders.map((order) => (
            <article className="admin-card admin-card-body" key={order.id}>
              <div className="admin-card-head">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PackageCheck size={16} />
                  {order.orderNumber}
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>
                    {new Date(order.createdAt).toLocaleDateString('en-UG', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </h3>

                <select
                  className="table-select"
                  value={order.status}
                  onChange={(e) => handleStatusChange(order, e.target.value)}
                  aria-label={`Order status for ${order.orderNumber}`}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {formatStatus(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div>
                  <b>Customer</b>
                  <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.7 }}>
                    {order.customer.firstName} {order.customer.lastName}
                    <br />
                    {order.customer.email}
                    <br />
                    {order.phone}
                  </p>
                </div>

                <div>
                  <b>Fulfilment</b>
                  <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.7 }}>
                    {order.deliveryMethod === 'PICKUP' ? 'Outlet pickup' : 'Delivery'}
                    <br />
                    {order.deliveryAddress}, {order.district}
                    {order.preferredDate && (
                      <>
                        <br />
                        Preferred:{' '}
                        {new Date(order.preferredDate).toLocaleDateString('en-UG', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </>
                    )}
                  </p>
                </div>

                <div>
                  <b>Items and locked prices</b>
                  {order.items.map((item) => (
                    <p key={item.id} style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.7 }}>
                      {item.quantity} × {item.productName}
                      <br />
                      <strong>{formatMoney(item.lineTotal)}</strong>
                    </p>
                  ))}
                </div>
              </div>

              {order.notes && (
                <p style={{ fontSize: 13, marginTop: 12, color: 'var(--muted)' }}>
                  <b>Customer note:</b> {order.notes}
                </p>
              )}

              <label style={{ display: 'block', marginTop: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                  Staff notes
                </span>
                <textarea
                  defaultValue={order.staffNotes ?? ''}
                  rows={2}
                  placeholder="Confirmation, delivery timing or payment notes…"
                  onBlur={(e) => {
                    if (e.target.value !== (order.staffNotes ?? '')) {
                      void applyUpdate(order.id, order.status, e.target.value);
                    }
                  }}
                />
              </label>
            </article>
          ))}

          {orders.length === 0 && (
            <p className="media-empty">No customer orders yet.</p>
          )}
        </div>
      )}

      {/* Confirmation dialog for final/irreversible status transitions */}
      <ConfirmDialog
        open={pendingUpdate !== null}
        title={pendingUpdate ? `Mark order as ${formatStatus(pendingUpdate.status)}?` : ''}
        message={
          pendingUpdate?.status === 'CANCELLED'
            ? 'Cancelling an order cannot be undone. The customer will need to place a new request.'
            : 'Marking this order as completed will close it. This action cannot be reversed.'
        }
        onConfirm={confirmUpdate}
        onCancel={() => setPendingUpdate(null)}
      />
    </div>
  );
}
