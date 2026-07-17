import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Check, Heart, MapPin, Package } from 'lucide-react';
import { BRAND } from '@/api/_seed';
import { FoodMark } from '@/shared/FoodMark';
import { SmartImage } from '@/shared/SmartImage';
import { WhatsApp } from '@/shared/WhatsApp';
import { useAppStore, selectActiveAddress } from '@/store/appStore';
import { useCartStore, deliveryCharge, selectCartSubtotal } from '@/store/cartStore';
import { deliveringArea } from '@/store/locationStore';
import { useToast } from '@/hooks/useToast';
import { confettiBurst } from '@/utils/confetti';
import { rupee } from '@/utils/fmt';
import { makeOrderId } from '@/utils/orderId';
import type { Bill, Order } from '@/types';

/* Ports order-success.html. Converts the live cart into an order on mount,
   then clears the cart — exactly as the HTML's top-level script does. */
export function OrderSuccessPage() {
  const navigate = useNavigate();
  const push = useToast();
  const lines = useCartStore((s) => s.lines);
  const sub = useCartStore(selectCartSubtotal);
  const clearCart = useCartStore((s) => s.clear);
  const checkout = useAppStore((s) => s.checkout);
  const payMethod = useAppStore((s) => s.payMethod);
  const addr = useAppStore(selectActiveAddress);
  const placeOrder = useAppStore((s) => s.placeOrder);
  const saveFavOrder = useAppStore((s) => s.saveFavOrder);
  const activeOrder = useAppStore((s) => s.activeOrder);

  const [saved, setSaved] = useState(false);
  const [secs, setSecs] = useState(30 * 60);
  const placedRef = useRef(false);

  const ck: Bill = useMemo(() => {
    if (checkout) return checkout;
    const del = deliveryCharge();
    const tax = Math.round(sub * 0.05);
    return { sub, disc: 0, del, tax, total: sub + del + tax };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [order] = useState<Order | null>(() => {
    if (lines.length === 0) return null;
    return {
      id: makeOrderId(),
      items: lines.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        img: i.img,
        foodType: i.foodType,
        unit: i.unit,
      })),
      bill: ck,
      status: 'Placed',
      placedAt: new Date().toISOString(),
      eta: BRAND.deliveryTime,
      address: addr ?? { label: 'Home', street: deliveringArea() },
      payMethod,
    };
  });

  // Commit the order once, then empty the cart.
  useEffect(() => {
    if (!order || placedRef.current) return;
    placedRef.current = true;
    placeOrder(order);
    clearCart();
    confettiBurst(140);
  }, [order, placeOrder, clearCart]);

  // ETA countdown
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  /* Soft gate: a reload after the cart was emptied has no order to render —
     fall back to the last placed order rather than a blank screen. */
  const shown = order ?? activeOrder;
  if (!shown) {
    return (
      <main className="pt-8 pb-28 lg:pb-10">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <img src="/images/logo.png" alt="SRI AADHYA FROZENS" className="h-14 w-auto mx-auto mb-5 object-contain" />
          <h1 className="display text-2xl font-extrabold">No order to show</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">Place an order and your confirmation will appear here.</p>
          <button onClick={() => navigate('/home')} className="btn btn-primary mt-5 px-6 py-3">
            Start shopping
          </button>
        </div>
      </main>
    );
  }

  const bill = shown.bill;
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  const saveFav = () => {
    saveFavOrder(shown);
    setSaved(true);
    push('Saved to favorites ❤', 'ok', 'heart');
  };

  return (
    <>
      <main className="pt-8 pb-28 lg:pb-10">
        <div className="max-w-2xl mx-auto px-5">
          <div className="text-center" style={{ animation: 'bounceIn .7s ease' }}>
            <div className="w-24 h-24 rounded-full brand-grad flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full pulse-ring" />
              <Check className="w-12 h-12 text-white" />
            </div>
            <h1 className="display text-2xl font-extrabold">Order Confirmed! 🎉</h1>
            <p className="text-[var(--ink-soft)] text-sm mt-1">Thank you for shopping with SRI AADHYA FROZENS</p>
            <div className="inline-flex items-center gap-2 bg-[var(--leaf-100)] text-[var(--green-800)] px-4 py-2 rounded-full font-extrabold mt-3">
              <Package className="w-4 h-4" /> {shown.id}
            </div>
          </div>

          {/* ETA */}
          <div className="card p-4 mt-6 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center">
              <Bike className="w-6 h-6 text-[var(--green-700)]" />
            </div>
            <div className="flex-1">
              <div className="font-bold">Arriving in {shown.eta} minutes</div>
              <div className="text-[12px] text-[var(--ink-soft)]">
                Delivering to {(addr ? addr.label + ' • ' : '') + deliveringArea()}
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[var(--green-700)] display">
              {mm}:{ss}
            </div>
          </div>

          {/* summary */}
          <div className="card p-5 mt-4">
            <h3 className="font-extrabold mb-3">Order Summary</h3>
            <div className="space-y-2">
              {shown.items.map((i) => (
                <div key={i.id} className="flex items-center gap-2 text-sm">
                  <SmartImage src={i.img} alt={i.name} className="w-9 h-9 rounded-lg object-cover" />
                  <span className="flex items-center gap-1 flex-1">
                    <FoodMark type={i.foodType} /> {i.name} <span className="text-[var(--ink-soft)]">× {i.qty}</span>
                  </span>
                  <span className="font-bold">{rupee(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 text-sm border-t border-[var(--line)] mt-3 pt-3">
              <div className="flex justify-between">
                <span className="text-[var(--ink-soft)]">Item total</span>
                <span>{rupee(bill.sub)}</span>
              </div>
              {bill.disc > 0 && (
                <div className="flex justify-between text-[var(--green-700)]">
                  <span>Discount</span>
                  <span>− {rupee(bill.disc)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--ink-soft)]">Delivery</span>
                <span>{rupee(bill.del)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-soft)]">Taxes</span>
                <span>{rupee(bill.tax)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base border-t border-[var(--line)] pt-2">
                <span>Paid ({shown.payMethod.toUpperCase()})</span>
                <span className="text-[var(--green-800)]">{rupee(bill.total)}</span>
              </div>
            </div>
          </div>

          {/* save to favorites */}
          <div className="card p-4 mt-4 flex items-center gap-3 bg-[var(--cream-2)]">
            <Heart className="w-6 h-6 text-[var(--coral)] flex-none" />
            <div className="flex-1 text-sm">
              <b>Save this order to favorites</b>
              <div className="text-[12px] text-[var(--ink-soft)]">One-tap reorder next time</div>
            </div>
            <button onClick={saveFav} disabled={saved} className="btn btn-ghost px-3 py-2 text-sm">
              {saved ? 'Saved ✓' : 'Save'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button onClick={() => navigate('/tracking')} className="btn btn-primary flex-1 py-3.5">
              <MapPin className="w-4 h-4" /> Track Order
            </button>
            <button onClick={() => navigate('/home')} className="btn btn-ghost flex-1 py-3.5">
              Continue Shopping
            </button>
          </div>
        </div>
      </main>
      <WhatsApp />
    </>
  );
}
