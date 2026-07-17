import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, PlusCircle, ShoppingCart, Trash2, Users, XCircle, Zap } from 'lucide-react';
import { BRAND, coupons, products } from '@/api/_seed';
import { ProductCard } from '@/cards/ProductCard';
import { FoodMark } from '@/shared/FoodMark';
import { SmartImage } from '@/shared/SmartImage';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore, deliveryCharge, selectCartCount, selectCartSubtotal } from '@/store/cartStore';
import { useCouponStore } from '@/store/couponStore';
import { deliveringArea, isServiceable } from '@/store/locationStore';
import { useToast } from '@/hooks/useToast';
import { rupee } from '@/utils/fmt';
import type { Bill } from '@/types';

const QUICK_CODES = ['SAVE50', 'FRESH10', 'BLOSSOM'];

/* Ports cart.html. */
export function CartPage() {
  const navigate = useNavigate();
  const push = useToast();
  const lines = useCartStore((s) => s.lines);
  const count = useCartStore(selectCartCount);
  const sub = useCartStore(selectCartSubtotal);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const applied = useCouponStore((s) => s.applied);
  const applyCode = useCouponStore((s) => s.apply);
  const clearApplied = useCouponStore((s) => s.clearApplied);
  const consumePending = useCouponStore((s) => s.consumePending);
  const user = useAuthStore((s) => s.user);
  const setCheckout = useAppStore((s) => s.setCheckout);

  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const bill: Bill = useMemo(() => {
    let disc = 0;
    if (applied) {
      const c = coupons[applied];
      if (c && sub >= c.min) {
        disc = c.type === 'flat' ? c.value : Math.min(c.max ?? 1e9, Math.round((sub * c.value) / 100));
      }
    }
    const del = count ? deliveryCharge() : 0;
    const tax = Math.round((sub - disc) * 0.05);
    return { sub, disc, del, tax, total: Math.max(0, sub - disc) + del + tax };
  }, [sub, count, applied]);

  // A coupon chosen on /coupon is auto-applied on arrival here.
  useEffect(() => {
    const pend = consumePending();
    if (!pend) return;
    setCode(pend);
    const c = coupons[pend];
    if (c && sub >= c.min) {
      applyCode(pend);
      setMsg({ text: `${c.label} applied!`, ok: true });
      push('Coupon applied 🎉', 'ok', 'ticket');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drop a coupon that the cart no longer qualifies for.
  useEffect(() => {
    if (applied && sub < (coupons[applied]?.min ?? 0)) {
      clearApplied();
      setMsg(null);
    }
  }, [applied, sub, clearApplied]);

  const applyCoupon = (raw?: string) => {
    const value = (raw ?? code).trim().toUpperCase();
    setCode(value);
    const c = coupons[value];
    if (!c) {
      setMsg({ text: 'Invalid coupon code', ok: false });
      return;
    }
    if (sub < c.min) {
      setMsg({ text: `Add items worth ${rupee(c.min)} to use this`, ok: false });
      return;
    }
    applyCode(value);
    setMsg({ text: `${c.label} applied!`, ok: true });
    push('Coupon applied 🎉', 'ok', 'ticket');
  };

  const proceed = () => {
    if (lines.length === 0) {
      push('Cart is empty', 'err', 'x');
      return;
    }
    if (!isServiceable()) {
      push(`Your location is outside our ${BRAND.radiusKm} km delivery zone`, 'err', 'map-pin');
      setTimeout(() => navigate('/not-serviceable'), 900);
      return;
    }
    setCheckout(bill);
    navigate(user?.loggedIn ? '/address' : '/login?next=/address');
  };

  // FBT
  const fbt = useMemo(() => {
    const inCart = new Set(lines.map((i) => i.id));
    return products.filter((p) => !inCart.has(p.id) && (p.bestseller || p.trending)).slice(0, 4);
  }, [lines]);

  if (lines.length === 0) {
    return (
      <main className="pt-16 pb-28 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-4">
          <h1 className="display text-2xl font-extrabold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[var(--green-700)]" /> Your Cart
          </h1>
          <div className="text-center py-16">
            <div className="text-6xl mb-3">🛒</div>
            <p className="font-bold text-lg">Your cart is empty</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">Add some fresh essentials to get started</p>
            <Link to="/home" className="btn btn-primary mt-4 px-6 py-3 inline-flex">
              Start shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="pt-16 pb-28 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-4">
          <h1 className="display text-2xl font-extrabold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[var(--green-700)]" /> Your Cart
          </h1>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* items */}
            <div className="lg:w-2/3">
              <div className="card p-3 mb-3 flex items-center gap-2 text-sm bg-[var(--leaf-100)] border-[var(--green-500)]/30">
                <Zap className="w-4 h-4 text-[var(--green-700)]" /> <b>Delivery in 30 min</b>{' '}
                <span className="text-[var(--ink-soft)]">to {deliveringArea()}</span>
              </div>
              <div className="space-y-3">
                {lines.map((it) => (
                  <div key={it.key} className="card p-3 flex gap-3 items-center">
                    <SmartImage src={it.img} alt={it.name} className="w-16 h-16 rounded-xl object-cover flex-none" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FoodMark type={it.foodType} />
                        <span className="font-bold text-sm truncate">{it.name}</span>
                      </div>
                      <div className="text-[12px] text-[var(--ink-soft)]">
                        {it.unit} • {rupee(it.price)}
                      </div>
                      <button
                        onClick={() => remove(it.key)}
                        className="text-[11px] text-[var(--coral)] font-bold mt-1 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="stepper mb-1">
                        <button onClick={() => setQty(it.key, it.qty - 1)}>−</button>
                        <span>{it.qty}</span>
                        <button onClick={() => setQty(it.key, it.qty + 1)}>+</button>
                      </div>
                      <div className="font-extrabold text-sm">{rupee(it.price * it.qty)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FBT */}
              <h3 className="display text-lg font-extrabold mt-7 mb-3 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[var(--green-700)]" /> You might also like
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fbt.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>

            {/* summary */}
            <div className="lg:w-1/3">
              <div className="card p-5 lg:sticky lg:top-20">
                <h3 className="font-extrabold mb-3">Bill details</h3>

                {/* coupon */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Coupon code"
                      className="field uppercase"
                    />
                    <button onClick={() => applyCoupon()} className="btn btn-dark px-4">
                      Apply
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {QUICK_CODES.map((c) => (
                      <button key={c} onClick={() => applyCoupon(c)} className="chip text-[11px]">
                        {c}
                      </button>
                    ))}
                  </div>
                  <Link to="/coupon" className="text-xs font-bold text-[var(--green-700)] mt-2 inline-block">
                    View all offers →
                  </Link>
                  {msg && (
                    <div className="text-xs mt-2">
                      <span
                        className={`flex items-center gap-1 ${msg.ok ? 'text-[var(--green-700)]' : 'text-[var(--coral)]'}`}
                      >
                        {msg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {msg.text}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm border-t border-[var(--line)] pt-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">Item total</span>
                    <span>{rupee(bill.sub)}</span>
                  </div>
                  {bill.disc > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--green-700)]">Coupon discount</span>
                      <span className="text-[var(--green-700)]">− {rupee(bill.disc)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">
                      Delivery charge <span className="text-[10px]">(per km)</span>
                    </span>
                    <span>{rupee(bill.del)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">Taxes &amp; charges</span>
                    <span>{rupee(bill.tax)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-lg border-t border-[var(--line)] pt-2 mt-1">
                    <span>To Pay</span>
                    <span className="text-[var(--green-800)]">{rupee(bill.total)}</span>
                  </div>
                  {bill.disc > 0 && (
                    <div className="text-xs text-[var(--green-700)] font-bold">
                      🎉 You saved {rupee(bill.disc)} on this order
                    </div>
                  )}
                </div>

                <button onClick={proceed} className="btn btn-primary w-full mt-4 py-3.5 text-base">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-[var(--ink-soft)]">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Secure
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> 1,240+ happy customers
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* mobile sticky checkout */}
      <div className="action-bar glass border-t border-[var(--line)] px-4 py-3 lg:hidden flex items-center gap-3">
        <div>
          <div className="text-[11px] text-[var(--ink-soft)]">To Pay</div>
          <div className="font-extrabold text-lg">{rupee(bill.total)}</div>
        </div>
        <button onClick={proceed} className="btn btn-primary flex-1 py-3">
          Checkout <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
