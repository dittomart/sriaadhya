import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Store, XCircle } from 'lucide-react';
import { StoreHoursModal } from '@/shared/StoreHoursModal';
import { WhatsApp } from '@/shared/WhatsApp';

/* Ports payment-failed.html. ?reason=store swaps the copy to the
   store-unavailable variant and reveals the store-hours button. */
export function PaymentFailedPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [hoursOpen, setHoursOpen] = useState(false);
  const storeClosed = params.get('reason') === 'store';

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--cream)]">
        <div className="max-w-md w-full text-center" style={{ animation: 'fadeUp .5s ease' }}>
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${
              storeClosed ? 'bg-yellow-50' : 'bg-red-50'
            }`}
          >
            {storeClosed ? (
              <Store className="w-12 h-12 text-[var(--mustard)]" />
            ) : (
              <XCircle className="w-12 h-12 text-[var(--coral)]" />
            )}
          </div>
          <h1 className="display text-2xl font-extrabold">
            {storeClosed ? 'Store Currently Unavailable' : 'Payment Failed'}
          </h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">
            {storeClosed
              ? 'Our store is not accepting orders at this moment. Please try again later.'
              : "Your payment could not be completed. Don't worry — no money was deducted. Please try again."}
          </p>

          <div className="flex flex-col gap-3 mt-6">
            <button onClick={() => navigate('/payment')} className="btn btn-primary w-full py-3.5">
              <RefreshCw className="w-4 h-4" /> Retry Payment
            </button>
            <button onClick={() => navigate('/cart')} className="btn btn-ghost w-full py-3">
              Back to Cart
            </button>
            {storeClosed && (
              <button onClick={() => setHoursOpen(true)} className="btn btn-ghost w-full py-3">
                View Store Hours
              </button>
            )}
          </div>
        </div>
      </div>
      <WhatsApp />
      {hoursOpen && <StoreHoursModal onClose={() => setHoursOpen(false)} />}
    </>
  );
}
