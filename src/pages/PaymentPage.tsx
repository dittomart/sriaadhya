import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { useAppStore, selectActiveAddress } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore, deliveryCharge, selectCartCount, selectCartSubtotal } from '@/store/cartStore';
import { rupee } from '@/utils/fmt';
import type { Bill, PayMethod } from '@/types';

const METHODS: { m: PayMethod; title: string; sub: string; Icon: typeof CreditCard; tint: string; note?: string }[] = [
  { m: 'upi', title: 'UPI', sub: 'GPay, PhonePe, Paytm, BHIM', Icon: Smartphone, tint: 'bg-[var(--leaf-100)] text-[var(--green-700)]', note: '⚡Fast' },
  { m: 'card', title: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', Icon: CreditCard, tint: 'bg-[var(--cream-2)] text-[var(--green-800)]' },
  { m: 'wallet', title: 'Wallets', sub: 'Paytm, Amazon Pay, Mobikwik', Icon: Wallet, tint: 'bg-[var(--cream-2)] text-[var(--green-800)]' },
];

/* Ports payment.html. */
export function PaymentPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const method = useAppStore((s) => s.payMethod);
  const setPayMethod = useAppStore((s) => s.setPayMethod);
  const checkout = useAppStore((s) => s.checkout);
  const addr = useAppStore(selectActiveAddress);
  const count = useCartStore(selectCartCount);
  const sub = useCartStore(selectCartSubtotal);

  useEffect(() => {
    if (!user?.loggedIn) navigate('/login?next=/payment', { replace: true });
  }, [user, navigate]);

  // Falls back to a fresh calculation when the cart snapshot is missing.
  const ck: Bill = useMemo(() => {
    if (checkout) return checkout;
    const del = count ? deliveryCharge() : 0;
    const tax = Math.round(sub * 0.05);
    return { sub, disc: 0, del, tax, total: sub + del + tax };
  }, [checkout, count, sub]);

  return (
    <main className="pt-16 pb-28 lg:pb-10">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 mt-4">
        <Link to="/address" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to address
        </Link>
        <h1 className="display text-2xl font-extrabold mb-4 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-[var(--green-700)]" /> Payment
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/5">
            <p className="text-sm font-bold text-[var(--ink-soft)] mb-2">Recommended</p>
            {METHODS.map(({ m, title, sub: subtitle, Icon, tint, note }, i) => (
              <div key={m}>
                {i === 1 && <p className="text-sm font-bold text-[var(--ink-soft)] mb-2 mt-4">More options</p>}
                <label className="card p-4 flex items-center gap-3 mb-3 cursor-pointer">
                  <input
                    type="radio"
                    name="pm"
                    className="accent-[var(--green-700)] w-4 h-4"
                    checked={method === m}
                    onChange={() => setPayMethod(m)}
                  />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{title}</div>
                    <div className="text-[12px] text-[var(--ink-soft)]">{subtitle}</div>
                  </div>
                  {note && <div className="flex gap-1 text-[10px] font-bold text-[var(--ink-soft)]">{note}</div>}
                </label>
              </div>
            ))}

            <div className="card p-3 flex items-center gap-2 text-[12px] text-[var(--ink-soft)] mt-2">
              <ShieldCheck className="w-4 h-4 text-[var(--green-700)]" /> 100% secure payments. Cash on Delivery is not
              available.
            </div>
          </div>

          {/* summary */}
          <div className="lg:w-2/5">
            <div className="card p-5 lg:sticky lg:top-20">
              <h3 className="font-extrabold mb-3">Order Summary</h3>
              {addr && (
                <div className="text-[12px] text-[var(--ink-soft)] mb-3 flex gap-2">
                  <MapPin className="w-4 h-4 text-[var(--green-700)] flex-none" />
                  <span>
                    <b>{addr.label}</b> — {addr.house_no}, {addr.street}, {addr.city}
                  </span>
                </div>
              )}
              <div className="space-y-2 text-sm border-t border-[var(--line)] pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--ink-soft)]">Items ({count})</span>
                  <span>{rupee(ck.sub)}</span>
                </div>
                {ck.disc > 0 && (
                  <div className="flex justify-between text-[var(--green-700)]">
                    <span>Discount</span>
                    <span>− {rupee(ck.disc)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--ink-soft)]">Delivery</span>
                  <span>{rupee(ck.del)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-soft)]">Taxes</span>
                  <span>{rupee(ck.tax)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-lg border-t border-[var(--line)] pt-2">
                  <span>To Pay</span>
                  <span className="text-[var(--green-800)]">{rupee(ck.total)}</span>
                </div>
              </div>
              <button onClick={() => navigate('/payment-processing')} className="btn btn-primary w-full mt-4 py-3.5 text-base">
                Pay <span>{rupee(ck.total)}</span>
              </button>
              <div className="text-center text-[11px] text-[var(--ink-soft)] mt-2">
                Joined by 1,240+ happy customers in Tirupur
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
