import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, ShieldCheck, Wallet } from 'lucide-react';
import { useGetAddresses } from '@/api/mutations/useAddresses';
import { checkBan, usePlaceOrder } from '@/api/mutations/useCheckout';
import { isCodGateway, useGetPaymentGateways } from '@/api/queries/usePaymentGateways';
import { useGetWallet } from '@/api/queries/useWallet';
import { SmartImage } from '@/shared/SmartImage';
import { StoreHoursModal } from '@/shared/StoreHoursModal';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCouponStore } from '@/store/couponStore';
import { useOrderTotals } from '@/hooks/useOrderTotals';
import { useToast } from '@/hooks/useToast';
import { canDeliverTo } from '@/utils/deliveryRules';
import { rupee } from '@/utils/fmt';
import { buildPlaceOrderBody } from '@/utils/placeOrderBody';
import { PENDING } from '@/utils/storageKeys';
import { isStoreOpenNow } from '@/utils/storeHours';
import { DotLoader } from '@/ui/DotLoader';

export function PaymentPage() {
  const navigate = useNavigate();
  const push = useToast();

  const user = useAuthStore((s) => s.user);
  const authToken = useAuthStore((s) => s.authToken);
  const store = useAppStore((s) => s.storeLocation);
  const orderType = useAppStore((s) => s.orderType);
  const activeAddressId = useAppStore((s) => s.activeAddressId);
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const coupon = useCouponStore((s) => s.active);
  const clearCoupon = useCouponStore((s) => s.clear);

  const { data: addresses } = useGetAddresses();
  const { data: gateways, isLoading: gatewaysLoading } = useGetPaymentGateways();
  const { data: wallet } = useGetWallet();
  const placeOrder = usePlaceOrder();
  const { subtotal, discount, deliveryFee, distanceKm, tax, total } = useOrderTotals();

  const [selected, setSelected] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [storeClosed, setStoreClosed] = useState(false);
  const [placing, setPlacing] = useState(false);

  /* Once the order is placed the cart is cleared and we hand off to the
     gateway. That empties `lines` — which must NOT read as "arrived with an
     empty cart" and bounce to /cart, because that redirect would race the
     gateway navigation and win, and the gateway would never open. This latch
     says "a handoff is in flight". A ref, not state: it has to be true for the
     effect below on the very next render, with no re-render in between. */
  const handingOff = useRef(false);

  /* The handoff navigates away mid-await; anything that resolves after that
     must not touch state on an unmounted page. */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user || !authToken) navigate('/login?next=/payment', { replace: true });
  }, [user, authToken, navigate]);

  useEffect(() => {
    if (lines.length === 0 && !handingOff.current) navigate('/cart', { replace: true });
  }, [lines.length, navigate]);

  // Pick the first gateway once they load, so the customer isn't staring at a
  // list with nothing chosen.
  useEffect(() => {
    if (!selected && gateways?.length) setSelected(gateways[0].code);
  }, [gateways, selected]);

  const addr =
    addresses?.find((a) => a.id === activeAddressId) ??
    addresses?.find((a) => a.id === String(user?.defaultAddressId ?? '')) ??
    addresses?.[0];

  const walletBalance = wallet?.balance ?? 0;
  const hasWallet = walletBalance > 0;
  /* The wallet is a toggle, not a payment method: switch it on and it pays what
     it can. Only when it covers the whole bill does it BECOME the method — and
     then the gateway list has nothing left to collect, so it goes away. */
  const walletCoversAll = useWallet && hasWallet && walletBalance >= total;
  const effectiveMethod = walletCoversAll ? 'WALLET' : selected;
  const amountAfterWallet = useWallet ? Math.max(0, total - walletBalance) : total;
  const walletApplied = useWallet ? Math.min(walletBalance, total) : 0;
  const takeaway = orderType === 'takeaway';

  const onPay = async () => {
    if (!user || !authToken) return;
    if (!effectiveMethod) {
      push('Choose a payment method', 'err', 'x');
      return;
    }
    if (!addr) {
      push('Add a delivery address first', 'err', 'map-pin');
      navigate('/address?mode=checkout');
      return;
    }
    /* A (0,0) pin means a half-saved address row. The fee on screen was quoted
       against something else, and the order would ship coordinates that put the
       rider in the Atlantic. */
    if (!takeaway && (!Number.isFinite(addr.latitude) || (addr.latitude === 0 && addr.longitude === 0))) {
      push('This address is missing its location pin — please re-confirm it.', 'err', 'map-pin');
      navigate('/address?mode=checkout');
      return;
    }
    /* The delivery-zone gate. /place-order does NOT check the radius, so if this
       doesn't stop it nothing will: the store would be handed an order it can't
       fulfil, already paid for. Takeaway is exempt — nobody is driving. */
    if (!takeaway && !canDeliverTo(addr)) {
      push("That address is outside our delivery area — please choose another.", 'err', 'map-pin');
      navigate('/address?mode=checkout');
      return;
    }
    if (!store?.restaurantId) {
      push('Store unavailable right now', 'err', 'x');
      return;
    }
    if (!isStoreOpenNow(store)) {
      setStoreClosed(true);
      return;
    }

    setPlacing(true);
    try {
      const ban = await checkBan();
      if (ban.banned) {
        push(ban.message ?? 'This account cannot place orders', 'err', 'x');
        return;
      }

      /* Block rather than guess. A haversine fallback would desync from the fee
         the backend recomputes, and the customer would be charged a number they
         never saw. */
      if (!takeaway && distanceKm == null) {
        push('Calculating delivery fee… please try again in a moment.', 'err', 'x');
        return;
      }

      /* An online gateway (PayU / PhonePe) collects the money AFTER this call,
         so the order must be created "awaiting payment" rather than settled as
         paid. COD and a wallet-covered order settle immediately. */
      const isOnlineGateway = !walletCoversAll && effectiveMethod !== 'WALLET' && !isCodGateway(effectiveMethod);

      const body = buildPlaceOrderBody({
        lines,
        restaurantId: store.restaurantId,
        user,
        authToken,
        address: addr,
        method: effectiveMethod,
        deliveryType: takeaway ? 2 : 1,
        useWallet,
        walletCoversAll,
        walletBalance,
        distanceKm: distanceKm ?? 0,
        couponCode: coupon?.code ?? null,
        pendingPayment: isOnlineGateway,
      });

      const result = await placeOrder.mutateAsync(body);
      const uoid = result.uniqueOrderId;

      /* The order exists now. Every path from here clears the cart and leaves
         this page — latch the empty-cart guard shut before that happens. */
      handingOff.current = true;

      /* The backend is the authority on how it settled. `walletCoversAll` can
         flip between the tap and the response if the balance query refetches —
         trusting it alone would route a wallet-paid order into the gateway and
         ask the customer to pay twice. */
      const paidByWallet =
        result.paymentMode.toUpperCase() === 'WALLET' || walletCoversAll || effectiveMethod === 'WALLET';

      clearCoupon();

      if (paidByWallet || isCodGateway(effectiveMethod)) {
        clearCart();
        navigate(`/view-order/${uoid}`, { replace: true });
        return;
      }

      if (result.paymentUrl) {
        clearCart();
        window.location.href = result.paymentUrl;
        return;
      }

      /* Carry which gateway was chosen: the processing screen picks PhonePe's
         bridge vs PayU's signed form off it. The backend settles as `method`,
         so its own answer wins where it gave one. */
      sessionStorage.setItem(PENDING.orderId, String(result.id));
      sessionStorage.setItem(PENDING.uniqueOrderId, uoid);
      sessionStorage.setItem(PENDING.method, result.paymentMode || effectiveMethod);
      clearCart();
      navigate('/payment-processing', { replace: true });
    } catch (err) {
      if (!alive.current) return;
      push(err instanceof Error ? err.message : 'Could not place the order', 'err', 'x');
    } finally {
      if (alive.current) setPlacing(false);
    }
  };

  if (!user || !authToken) return <DotLoader />;

  const payLabel = walletCoversAll
    ? `Pay ${rupee(total)} with Wallet`
    : useWallet && walletApplied > 0
      ? `Pay ${rupee(amountAfterWallet)} & Use Wallet`
      : `Pay ${rupee(total)} Securely`;

  return (
    <>
      <main className="pt-16 pb-28 lg:pb-10">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 mt-4">
          <Link to="/address?mode=checkout" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1 mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to address
          </Link>
          <h1 className="display text-2xl font-extrabold mb-4 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[var(--green-700)]" /> Payment
          </h1>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-3/5">
              {/* wallet — an independent toggle, never a method radio */}
              {hasWallet && (
                <div className="card p-4 flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                    <Wallet className="w-5 h-5 text-[var(--green-700)]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">Use wallet balance</div>
                    <div className="text-[12px] text-[var(--ink-soft)]">
                      {rupee(walletBalance)} available
                      {useWallet && walletApplied > 0 && ` • ${rupee(walletApplied)} applied`}
                    </div>
                  </div>
                  <button
                    onClick={() => setUseWallet((v) => !v)}
                    aria-label="Use wallet balance"
                    className={`w-12 h-7 rounded-full relative transition flex-none ${
                      useWallet ? 'bg-[var(--green-600)]' : 'bg-[var(--line)]'
                    }`}
                  >
                    <span
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: useWallet ? '1.5rem' : '0.25rem' }}
                    />
                  </button>
                </div>
              )}

              {walletCoversAll ? (
                <div className="card p-4 flex items-center gap-2 text-sm bg-[var(--leaf-100)] border-[var(--green-500)]/30">
                  <ShieldCheck className="w-4 h-4 text-[var(--green-700)]" /> Your wallet covers this order in full.
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-[var(--ink-soft)] mb-2">
                    {useWallet && walletApplied > 0 ? `Pay the remaining ${rupee(amountAfterWallet)} with` : 'Pay with'}
                  </p>
                  {gatewaysLoading ? (
                    <div className="space-y-3">
                      {[0, 1].map((i) => (
                        <div key={i} className="skeleton h-[72px] rounded-2xl" />
                      ))}
                    </div>
                  ) : (gateways ?? []).length === 0 ? (
                    <div className="card p-4 text-sm text-[var(--ink-soft)]">
                      No payment methods are available right now. Please try again shortly.
                    </div>
                  ) : (
                    (gateways ?? []).map((g) => (
                      <label key={g.id} className="card p-4 flex items-center gap-3 mb-3 cursor-pointer">
                        <input
                          type="radio"
                          name="pm"
                          className="accent-[var(--green-700)] w-4 h-4"
                          checked={selected === g.code}
                          onChange={() => setSelected(g.code)}
                        />
                        <div className="w-10 h-10 rounded-lg bg-[var(--cream-2)] flex items-center justify-center overflow-hidden flex-none">
                          {g.logo ? (
                            <SmartImage src={g.logo} alt={g.name} className="w-full h-full object-contain" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-[var(--green-800)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold">{g.name}</div>
                          {g.description && <div className="text-[12px] text-[var(--ink-soft)]">{g.description}</div>}
                        </div>
                      </label>
                    ))
                  )}
                </>
              )}

              <div className="card p-3 flex items-center gap-2 text-[12px] text-[var(--ink-soft)] mt-2">
                <ShieldCheck className="w-4 h-4 text-[var(--green-700)]" /> 100% secure payments.
              </div>
            </div>

            {/* summary */}
            <div className="lg:w-2/5">
              <div className="card p-5 lg:sticky lg:top-20">
                <h3 className="font-extrabold mb-3">Order Summary</h3>

                {addr ? (
                  <div className="text-[12px] text-[var(--ink-soft)] mb-3">
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-[var(--green-700)] flex-none" />
                      <span className="flex-1">
                        <b className="text-[var(--ink)]">Delivering to {addr.label}</b>
                        <Link to="/address?mode=checkout" className="ml-2 font-bold text-[var(--green-700)]">
                          Change
                        </Link>
                        <span className="block">{addr.receiverName}</span>
                        <span className="block">
                          {[addr.houseNo, addr.street, addr.city, addr.pincode].filter(Boolean).join(', ')}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <Link to="/address?mode=checkout" className="text-sm font-bold text-[var(--green-700)] mb-3 block">
                    + Add a delivery address
                  </Link>
                )}

                <div className="space-y-2 text-sm border-t border-[var(--line)] pt-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">Items ({lines.length})</span>
                    <span>{rupee(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[var(--green-700)]">
                      <span>Discount</span>
                      <span>− {rupee(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-soft)]">
                      Delivery{distanceKm != null && ` (${distanceKm.toFixed(1)} km)`}
                    </span>
                    <span>{rupee(deliveryFee)}</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">Taxes</span>
                      <span>{rupee(tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-lg border-t border-[var(--line)] pt-2">
                    <span>To Pay</span>
                    <span className="text-[var(--green-800)]">{rupee(total)}</span>
                  </div>
                  {useWallet && walletApplied > 0 && !walletCoversAll && (
                    <div className="flex justify-between text-[var(--green-700)] text-xs font-bold">
                      <span>Wallet</span>
                      <span>− {rupee(walletApplied)}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => void onPay()}
                  disabled={placing || placeOrder.isPending || (!effectiveMethod && !walletCoversAll)}
                  className={`btn btn-primary w-full mt-4 py-3.5 text-base ${
                    placing || placeOrder.isPending ? 'opacity-60' : ''
                  }`}
                >
                  {placing || placeOrder.isPending ? 'Placing your order…' : payLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      {storeClosed && <StoreHoursModal onClose={() => setStoreClosed(false)} />}
    </>
  );
}
