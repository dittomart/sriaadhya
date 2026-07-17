import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket, TicketPercent } from 'lucide-react';
import { useApplyCoupon, useGetCoupons } from '@/api/queries/useCoupons';
import { useAuthStore } from '@/store/authStore';
import { useCartSubtotal } from '@/store/cartStore';
import { useCouponStore } from '@/store/couponStore';
import { useToast } from '@/hooks/useToast';
import { rupee } from '@/utils/fmt';
import { useReveal } from '@/hooks/useReveal';

export function CouponPage() {
  const navigate = useNavigate();
  const push = useToast();
  const subtotal = useCartSubtotal();
  const user = useAuthStore((s) => s.user);
  const applyToStore = useCouponStore((s) => s.apply);
  const { data: coupons, isLoading } = useGetCoupons(subtotal);
  const applyCoupon = useApplyCoupon();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  useReveal();

  /* The code goes to the backend exactly as typed — it matches case-sensitively,
     so upper-casing a customer's input turns a valid coupon into "invalid". */
  const apply = async (raw: string) => {
    setErr('');
    const value = raw.trim();
    if (!value) return;

    const res = await applyCoupon.mutateAsync({ code: value, subtotal });
    if (!res.ok || !res.coupon) {
      setErr(res.message ?? 'That coupon could not be applied.');
      return;
    }
    applyToStore(res.coupon);
    push(`${res.coupon.code} applied — you saved ${rupee(res.discount ?? 0)}`, 'ok', 'ticket');
    setTimeout(() => navigate('/cart'), 600);
  };

  return (
    <main className="pt-16 pb-24 lg:pb-10">
      <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4">
        <Link to="/cart" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to cart
        </Link>
        <h1 className="display text-2xl font-extrabold mb-1 flex items-center gap-2">
          <TicketPercent className="w-6 h-6 text-[var(--mustard)]" /> Offers &amp; Coupons
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mb-5">Tap “Apply” to use a coupon on your cart.</p>

        <div className="card p-4 mb-5">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void apply(code)}
              placeholder="Have a code?"
              className="field"
            />
            <button
              onClick={() => void apply(code)}
              disabled={!code.trim() || applyCoupon.isPending}
              className={`btn btn-dark px-4 ${!code.trim() || applyCoupon.isPending ? 'opacity-50' : ''}`}
            >
              {applyCoupon.isPending ? '…' : 'Apply'}
            </button>
          </div>
          {err && <div className="text-xs text-[var(--coral)] mt-2">{err}</div>}
        </div>

        {!user ? (
          <div className="card p-6 text-center">
            <p className="font-bold">Log in to see your offers</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">Coupons are tied to your account.</p>
            <Link to="/login?next=/coupon" className="btn btn-primary mt-4 px-6 py-3 inline-flex">
              Login / Sign up
            </Link>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : (coupons ?? []).length === 0 ? (
          <div className="card p-8 text-center">
            <Ticket className="w-10 h-10 text-[var(--ink-soft)] mx-auto" />
            <p className="font-bold mt-3">No offers right now</p>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              Check back soon — or enter a code above if you have one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(coupons ?? []).map((c) => {
              const short = subtotal < c.minSubtotal;
              return (
                <div key={c.code} className={`card p-4 flex items-center gap-4 io ${short ? 'opacity-70' : ''}`}>
                  <div className="w-14 h-14 rounded-xl brand-grad flex items-center justify-center text-white flex-none">
                    <Ticket className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-lg tracking-wide">{c.code}</div>
                    <div className="text-sm text-[var(--ink-soft)]">{c.description || c.name}</div>
                    {c.minSubtotal > 0 && (
                      <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">
                        {short ? `Add ${rupee(c.minSubtotal - subtotal)} more to use this` : `Min order ${rupee(c.minSubtotal)}`}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => void apply(c.code)}
                    disabled={short || !c.canBeApplied || applyCoupon.isPending}
                    className={`btn btn-ghost px-4 py-2 text-sm font-extrabold ${short || !c.canBeApplied ? 'opacity-50' : ''}`}
                  >
                    Apply
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
