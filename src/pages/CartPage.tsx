import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, ShieldCheck, ShoppingCart, Ticket, Trash2, X, Zap } from 'lucide-react';
import { useGetCatalog } from '@/api/queries/useCatalog';
import { ProductCard } from '@/cards/ProductCard';
import { FoodMark } from '@/shared/FoodMark';
import { SmartImage } from '@/shared/SmartImage';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCouponStore } from '@/store/couponStore';
import { useLocationStore } from '@/store/locationStore';
import { useOrderTotals } from '@/hooks/useOrderTotals';
import { useToast } from '@/hooks/useToast';
import { IGNORE_DELIVERY_RADIUS } from '@/utils/deliveryRules';
import { rupee } from '@/utils/fmt';
import { isStoreOpenNow } from '@/utils/storeHours';

export function CartPage() {
  const navigate = useNavigate();
  const push = useToast();
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const user = useAuthStore((s) => s.user);
  const store = useAppStore((s) => s.storeLocation);
  const location = useLocationStore((s) => s.location);
  const coupon = useCouponStore((s) => s.active);
  const clearCoupon = useCouponStore((s) => s.clear);
  const { data: catalog } = useGetCatalog();

  const { subtotal, discount, deliveryFee, deliveryFeeKnown, distanceKm, tax, total, minOrder, belowMin } =
    useOrderTotals();

  /* Something else from the same aisles — never an item already in the basket. */
  const alsoLike = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.productId));
    const cats = new Set(
      lines
        .map((l) => catalog?.flat.find((p) => p.id === l.productId)?.catId)
        .filter((c): c is string => !!c),
    );
    const pool = (catalog?.flat ?? []).filter((p) => !inCart.has(p.id));
    const near = pool.filter((p) => cats.has(p.catId));
    return (near.length >= 4 ? near : pool).slice(0, 4);
  }, [catalog, lines]);

  const proceed = () => {
    if (lines.length === 0) return;
    if (!isStoreOpenNow(store)) {
      push('The store is closed right now — please try again later', 'err', 'x');
      return;
    }
    if (belowMin) {
      push(`Minimum order is ${rupee(minOrder)}`, 'err', 'x');
      return;
    }
    /* An early word based on the home-screen pin, so a customer out of range
       hears it before filling in an address. It is only a hint — the pin is
       where they ARE, not necessarily where they want it delivered. The gate
       that counts is on the saved address at /payment, which asks the backend. */
    if (!IGNORE_DELIVERY_RADIUS && location && location.serviceable === false) {
      push("You're outside our delivery area", 'err', 'map-pin');
      setTimeout(() => navigate('/not-serviceable'), 900);
      return;
    }
    navigate(user ? '/address?mode=checkout' : '/login?next=/address%3Fmode%3Dcheckout');
  };

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

  const deliveryLine = deliveryFeeKnown
    ? rupee(deliveryFee)
    : /* A guest can't be quoted — /get-deliverable-amount needs an account.
         "₹0" here would read as free delivery and then surprise them. */
      'At checkout';

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
                <Zap className="w-4 h-4 text-[var(--green-700)]" /> <b>Delivery in {store?.deliveryTime ?? 30} min</b>{' '}
                <span className="text-[var(--ink-soft)]">to {location?.area || store?.city || 'Avinashi'}</span>
              </div>
              <div className="space-y-3">
                {lines.map((it) => (
                  <div key={it.lineId} className="card p-3 flex gap-3 items-center">
                    <SmartImage src={it.img} alt={it.name} className="w-16 h-16 rounded-xl object-cover flex-none" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FoodMark type={it.foodType} />
                        <span className="font-bold text-sm truncate">{it.name}</span>
                      </div>
                      <div className="text-[12px] text-[var(--ink-soft)]">
                        {it.customizations.map((c) => c.addonName).join(', ') || rupee(it.unitPrice)}
                        {it.customizations.length > 0 && ` • ${rupee(it.unitPrice)}`}
                      </div>
                      <button
                        onClick={() => remove(it.lineId)}
                        className="text-[11px] text-[var(--coral)] font-bold mt-1 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="stepper mb-1">
                        <button onClick={() => setQty(it.lineId, it.qty - 1)}>−</button>
                        <span>{it.qty}</span>
                        <button onClick={() => setQty(it.lineId, it.qty + 1)}>+</button>
                      </div>
                      <div className="font-extrabold text-sm">{rupee(it.unitPrice * it.qty)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {alsoLike.length > 0 && (
                <>
                  <h3 className="display text-lg font-extrabold mt-7 mb-3">You might also like</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {alsoLike.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* summary */}
            <div className="lg:w-1/3">
              <div className="card p-5 lg:sticky lg:top-20">
                <h3 className="font-extrabold mb-3">Bill details</h3>

                {/* coupon */}
                <div className="mb-4">
                  {coupon ? (
                    <div className="flex items-center gap-2 bg-[var(--leaf-100)] border border-[var(--green-500)]/40 rounded-xl p-3">
                      <Ticket className="w-4 h-4 text-[var(--green-700)] flex-none" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-extrabold truncate">{coupon.code}</div>
                        <div className="text-[11px] text-[var(--ink-soft)] truncate">{coupon.description}</div>
                      </div>
                      <button
                        onClick={() => {
                          clearCoupon();
                          push('Coupon removed', '', 'x');
                        }}
                        className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-none"
                        aria-label="Remove coupon"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/coupon"
                      className="flex items-center gap-2 border border-dashed border-[var(--green-500)]/50 rounded-xl p-3 text-sm font-bold text-[var(--green-700)]"
                    >
                      <Ticket className="w-4 h-4" /> Apply a coupon
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Link>
                  )}
                </div>

                <div className="space-y-2 text-sm border-t border-[var(--line)] pt-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">Item total</span>
                    <span>{rupee(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--green-700)]">Coupon discount</span>
                      <span className="text-[var(--green-700)]">− {rupee(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">
                      Delivery{distanceKm != null && ` (${distanceKm.toFixed(1)} km)`}
                    </span>
                    <span>{deliveryLine}</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">Taxes &amp; charges</span>
                      <span>{rupee(tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-lg border-t border-[var(--line)] pt-2 mt-1">
                    <span>To Pay</span>
                    <span className="text-[var(--green-800)]">{rupee(total)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="text-xs text-[var(--green-700)] font-bold">
                      🎉 You saved {rupee(discount)} on this order
                    </div>
                  )}
                </div>

                {belowMin && (
                  <p className="text-xs text-[var(--coral)] font-semibold mt-3">
                    Add {rupee(minOrder - subtotal)} more to reach the {rupee(minOrder)} minimum order.
                  </p>
                )}

                <div className="hidden lg:block">
                  <button onClick={proceed} disabled={belowMin} className={`btn btn-primary w-full mt-4 py-3.5 text-base ${belowMin ? 'opacity-50' : ''}`}>
                    Proceed to checkout <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-[var(--ink-soft)]">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Secure
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Quality assured
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* mobile sticky checkout */}
      <div className="action-bar glass border-t border-[var(--line)] px-4 py-3 lg:hidden">
        {belowMin && (
          <p className="text-[11px] text-[var(--coral)] font-semibold mb-2">
            Add {rupee(minOrder - subtotal)} more to reach the {rupee(minOrder)} minimum.
          </p>
        )}
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[11px] text-[var(--ink-soft)]">To Pay</div>
            <div className="font-extrabold text-lg">{rupee(total)}</div>
          </div>
          <button onClick={proceed} disabled={belowMin} className={`btn btn-primary flex-1 py-3 ${belowMin ? 'opacity-50' : ''}`}>
            Checkout <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
