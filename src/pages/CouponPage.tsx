import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket, TicketPercent } from 'lucide-react';
import { coupons } from '@/api/_seed';
import { useCouponStore } from '@/store/couponStore';
import { useToast } from '@/hooks/useToast';
import { useReveal } from '@/hooks/useReveal';
import { rupee } from '@/utils/fmt';

/* Ports coupon.html. */
export function CouponPage() {
  const navigate = useNavigate();
  const push = useToast();
  const setPending = useCouponStore((s) => s.setPending);
  useReveal();

  const apply = (code: string) => {
    setPending(code);
    push(code + ' selected — applying in cart', 'ok', 'ticket');
    setTimeout(() => navigate('/cart'), 700);
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
        <div className="space-y-3">
          {Object.entries(coupons).map(([code, c]) => (
            <div key={code} className="card p-4 flex items-center gap-4 io">
              <div className="w-14 h-14 rounded-xl brand-grad flex items-center justify-center text-white flex-none">
                <Ticket className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-lg tracking-wide">{code}</div>
                <div className="text-sm text-[var(--ink-soft)]">{c.label}</div>
                <div className="text-[11px] text-[var(--ink-soft)] mt-0.5">Min order {rupee(c.min)}</div>
              </div>
              <button onClick={() => apply(code)} className="btn btn-ghost px-4 py-2 text-sm font-extrabold">
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
