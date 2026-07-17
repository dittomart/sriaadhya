import { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bike, Check, MapPin, Package } from 'lucide-react';
import { useGetOrder } from '@/api/queries/useOrders';
import { SmartImage } from '@/shared/SmartImage';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { confettiBurst } from '@/utils/confetti';
import { rupee } from '@/utils/fmt';
import { DotLoader } from '@/ui/DotLoader';

/** The order confirmation — and the canonical "view this order" screen.

    This is also PayU's return target, so it is SOFT-gated: iOS Safari can drop
    the session cookie during the gateway bounce, and redirecting to /login here
    would turn a paid order into a perceived failure. */
export function OrderSuccessPage() {
  const { uniqueOrderId } = useParams<{ uniqueOrderId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const store = useAppStore((s) => s.storeLocation);
  const clearCart = useCartStore((s) => s.clear);
  const { order, isLoading } = useGetOrder(uniqueOrderId);
  const celebrated = useRef(false);

  /* Arriving here means the basket became an order — whichever path got us here
     (wallet, COD, or a gateway bounce). */
  useEffect(() => {
    if (order) clearCart();
  }, [order, clearCart]);

  useEffect(() => {
    if (!order || celebrated.current) return;
    celebrated.current = true;
    confettiBurst(140);
  }, [order]);

  if (!user) {
    return (
      <main className="pt-8 pb-28 lg:pb-10">
        <div className="max-w-2xl mx-auto px-5 text-center py-16">
          <img src="/images/logo.png" alt="SRI AADHYA FROZENS" className="h-14 w-auto mx-auto mb-5 object-contain" />
          <h1 className="display text-2xl font-extrabold">Log in to see this order</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">
            Your order is safe — sign in with the number you used and it'll be here.
          </p>
          <Link
            to={`/login?next=${encodeURIComponent(`/view-order/${uniqueOrderId ?? ''}`)}`}
            className="btn btn-primary mt-5 px-6 py-3 inline-flex"
          >
            Login / Sign up
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading) return <DotLoader />;

  if (!order) {
    return (
      <main className="pt-8 pb-28 lg:pb-10">
        <div className="max-w-2xl mx-auto px-5 text-center py-16">
          <img src="/images/logo.png" alt="SRI AADHYA FROZENS" className="h-14 w-auto mx-auto mb-5 object-contain" />
          <h1 className="display text-2xl font-extrabold">We couldn't find that order</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">It may still be settling — check My Orders in a moment.</p>
          <button onClick={() => navigate('/my-orders')} className="btn btn-primary mt-5 px-6 py-3">
            My Orders
          </button>
        </div>
      </main>
    );
  }

  const awaitingPayment = order.status === 'awaiting-payment' || order.status === 'payment-failed';

  return (
    <main className="pt-8 pb-28 lg:pb-10">
      <div className="max-w-2xl mx-auto px-5">
        <div className="text-center" style={{ animation: 'bounceIn .7s ease' }}>
          <div className="w-24 h-24 rounded-full brand-grad flex items-center justify-center mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full pulse-ring" />
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="display text-2xl font-extrabold">
            {awaitingPayment ? 'Order placed — payment pending' : 'Order Confirmed! 🎉'}
          </h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">Thank you for shopping with SRI AADHYA FROZENS</p>
          <div className="inline-flex items-center gap-2 bg-[var(--leaf-100)] text-[var(--green-800)] px-4 py-2 rounded-full font-extrabold mt-3">
            <Package className="w-4 h-4" /> {order.id}
          </div>
        </div>

        {/* ETA */}
        <div className="card p-4 mt-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
            <Bike className="w-6 h-6 text-[var(--green-700)]" />
          </div>
          <div className="flex-1">
            <div className="font-bold">Arriving in about {order.etaMin} minutes</div>
            <div className="text-[12px] text-[var(--ink-soft)]">
              {order.address || store?.city || 'Avinashi'}
            </div>
          </div>
        </div>

        {/* summary */}
        <div className="card p-5 mt-4">
          <h3 className="font-extrabold mb-3">Order Summary</h3>
          <div className="space-y-2">
            {order.items.map((i) => (
              <div key={i.rowId} className="flex items-center gap-2 text-sm">
                <SmartImage src={i.img} alt={i.name} className="w-9 h-9 rounded-lg object-cover flex-none" />
                <span className="flex-1 min-w-0">
                  <span className="block truncate">
                    {i.name} <span className="text-[var(--ink-soft)]">× {i.qty}</span>
                  </span>
                  {i.customizations.length > 0 && (
                    <span className="block text-[11px] text-[var(--ink-soft)] truncate">
                      {i.customizations.map((c) => c.addonName).join(', ')}
                    </span>
                  )}
                </span>
                <span className="font-bold">{rupee(i.unitPrice * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm border-t border-[var(--line)] mt-3 pt-3">
            <div className="flex justify-between">
              <span className="text-[var(--ink-soft)]">Item total</span>
              <span>{rupee(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[var(--green-700)]">
                <span>Discount{order.couponCode && ` (${order.couponCode})`}</span>
                <span>− {rupee(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--ink-soft)]">Delivery</span>
              <span>{rupee(order.deliveryCharge)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--ink-soft)]">Taxes</span>
                <span>{rupee(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-base border-t border-[var(--line)] pt-2">
              <span>{awaitingPayment ? 'To pay' : 'Paid'}{order.paymentMode && ` (${order.paymentMode})`}</span>
              <span className="text-[var(--green-800)]">{rupee(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <button onClick={() => navigate(`/tracking/${order.id}`)} className="btn btn-primary flex-1 py-3.5">
            <MapPin className="w-4 h-4" /> Track Order
          </button>
          <button onClick={() => navigate('/home')} className="btn btn-ghost flex-1 py-3.5">
            Continue Shopping
          </button>
        </div>
      </div>
    </main>
  );
}
