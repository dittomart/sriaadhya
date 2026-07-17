import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Package, RotateCcw } from 'lucide-react';
import { STATUS_LABEL, useGetOrders } from '@/api/queries/useOrders';
import { SmartImage } from '@/shared/SmartImage';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import { rupee } from '@/utils/fmt';
import { lineIdOf } from '@/utils/productPricing';
import { useReveal } from '@/hooks/useReveal';
import type { Order, OrderStatus } from '@/types';

const TONE: Record<OrderStatus, string> = {
  placed: 'bg-yellow-100 text-yellow-800',
  'awaiting-payment': 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-[var(--leaf-100)] text-[var(--green-800)]',
  preparing: 'bg-[var(--leaf-100)] text-[var(--green-800)]',
  ready: 'bg-[var(--leaf-100)] text-[var(--green-800)]',
  'out-for-delivery': 'bg-[var(--leaf-100)] text-[var(--green-800)]',
  delivered: 'bg-[var(--leaf-100)] text-[var(--green-800)]',
  'payment-failed': 'bg-red-50 text-[var(--coral)]',
  cancelled: 'bg-red-50 text-[var(--coral)]',
};

export function OrdersPage() {
  const navigate = useNavigate();
  const push = useToast();
  const user = useAuthStore((s) => s.user);
  const replaceCart = useCartStore((s) => s.replace);
  const { orders, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useGetOrders();
  useReveal();

  /* Rebuild the basket from the order rows. The unit price was already folded
     (item + addons) when the order was mapped, so a variant-priced item comes
     back at what it actually cost, not ₹0. */
  const reorder = (o: Order) => {
    replaceCart(
      o.items.map((i) => ({
        lineId: lineIdOf(i.id, i.customizations),
        productId: i.id,
        name: i.name,
        img: i.img,
        foodType: 'other' as const,
        basePrice: i.basePrice,
        unitPrice: i.unitPrice,
        qty: i.qty,
        customizations: i.customizations,
      })),
    );
    push('Cart filled — ready to reorder', 'ok', 'rotate-ccw');
    setTimeout(() => navigate('/cart'), 600);
  };

  if (!user) {
    return (
      <main className="pt-16 pb-24 lg:pb-10">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4 text-center py-16">
          <img src="/images/logo.png" alt="SRI AADHYA FROZENS" className="h-14 w-auto mx-auto mb-5 object-contain" />
          <h1 className="display text-2xl font-extrabold">Log in to see your orders</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">Every order you place will show up here.</p>
          <Link to="/login?next=/my-orders" className="btn btn-primary mt-5 px-6 py-3 inline-flex">
            Login / Sign up
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 pb-24 lg:pb-10">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4">
        <h1 className="display text-2xl font-extrabold mb-4 flex items-center gap-2">
          <Package className="w-6 h-6 text-[var(--green-700)]" /> My Orders
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-2">🧾</div>
            <p className="font-bold text-lg">No orders yet</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">Your past orders &amp; 1-tap reorder will show here</p>
            <Link to="/home" className="btn btn-primary mt-4 px-6 py-3 inline-flex">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((o) => {
                const d = o.placedAt ? new Date(o.placedAt) : null;
                return (
                  <div key={o.id} className="card p-4 io">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        <Link to={`/view-order/${o.id}`} className="font-extrabold hover:text-[var(--green-700)]">
                          {o.id}
                        </Link>
                        {d && !Number.isNaN(d.getTime()) && (
                          <div className="text-[11px] text-[var(--ink-soft)]">
                            {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} •{' '}
                            {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-none ${TONE[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto hide-scroll pb-1 mb-2">
                      {o.items.map((i) => (
                        <div key={i.rowId} className="flex-none text-center w-14">
                          <SmartImage src={i.img} alt={i.name} className="w-14 h-14 rounded-lg object-cover" />
                          <div className="text-[10px] mt-0.5 truncate">×{i.qty}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
                      <div className="text-sm">
                        <span className="text-[var(--ink-soft)]">Total </span>
                        <b>{rupee(o.total)}</b>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/tracking/${o.id}`)} className="btn btn-ghost px-3 py-2 text-sm">
                          <MapPin className="w-4 h-4" /> Track
                        </button>
                        <button onClick={() => reorder(o)} className="btn btn-primary px-3 py-2 text-sm">
                          <RotateCcw className="w-4 h-4" /> Reorder
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasNextPage && (
              <button
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="btn btn-ghost w-full mt-4 py-3"
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more orders'}
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}
