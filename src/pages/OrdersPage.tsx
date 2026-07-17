import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Package, RotateCcw } from 'lucide-react';
import { SmartImage } from '@/shared/SmartImage';
import { useAppStore } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import { useReveal } from '@/hooks/useReveal';
import { rupee } from '@/utils/fmt';
import type { Order } from '@/types';

/* Ports orders.html. */
export function OrdersPage() {
  const navigate = useNavigate();
  const push = useToast();
  const orders = useAppStore((s) => s.orders);
  const setActiveOrder = useAppStore((s) => s.setActiveOrder);
  const replaceCart = useCartStore((s) => s.replace);
  useReveal();

  const track = (o: Order) => {
    setActiveOrder(o);
    navigate('/tracking');
  };

  const reorder = (o: Order) => {
    replaceCart(
      o.items.map((it) => ({
        key: it.id,
        id: it.id,
        name: it.name,
        price: it.price,
        img: it.img,
        foodType: it.foodType,
        qty: it.qty,
        unit: it.unit,
      })),
    );
    push('Cart filled — ready to reorder', 'ok', 'rotate-ccw');
    setTimeout(() => navigate('/cart'), 600);
  };

  return (
    <main className="pt-16 pb-24 lg:pb-10">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4">
        <h1 className="display text-2xl font-extrabold mb-4 flex items-center gap-2">
          <Package className="w-6 h-6 text-[var(--green-700)]" /> My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-2">🧾</div>
            <p className="font-bold text-lg">No orders yet</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">Your past orders &amp; 1-tap reorder will show here</p>
            <Link to="/home" className="btn btn-primary mt-4 px-6 py-3 inline-flex">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const d = new Date(o.placedAt);
              const statusColor =
                o.status === 'Delivered'
                  ? 'bg-[var(--leaf-100)] text-[var(--green-800)]'
                  : 'bg-yellow-100 text-yellow-800';
              return (
                <div key={o.id} className="card p-4 io">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-extrabold">{o.id}</div>
                      <div className="text-[11px] text-[var(--ink-soft)]">
                        {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} •{' '}
                        {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColor}`}>{o.status}</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto hide-scroll pb-1 mb-2">
                    {o.items.map((i) => (
                      <div key={i.id} className="flex-none text-center w-14">
                        <SmartImage src={i.img} alt={i.name} className="w-14 h-14 rounded-lg object-cover" />
                        <div className="text-[10px] mt-0.5 truncate">×{i.qty}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
                    <div className="text-sm">
                      <span className="text-[var(--ink-soft)]">Total </span>
                      <b>{rupee(o.bill.total)}</b>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => track(o)} className="btn btn-ghost px-3 py-2 text-sm">
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
        )}
      </div>
    </main>
  );
}
