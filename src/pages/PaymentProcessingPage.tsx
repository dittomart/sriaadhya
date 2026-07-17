import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';

const STEPS = [
  'Securely contacting your bank',
  'Verifying payment details',
  'Confirming with merchant',
  'Almost done…',
];

/* Ports payment-processing.html. The demo gateway resolves after 3s:
   store-closed (10%) then payment (80% success).
   TODO[part-2]: replace the simulated outcome with the real PayU return. */
export function PaymentProcessingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((i) => (i + 1) % STEPS.length), 800);
    const done = setTimeout(() => {
      clearInterval(t);
      const storeClosed = Math.random() < 0.1;
      if (storeClosed) {
        navigate('/payment-failed?reason=store', { replace: true });
        return;
      }
      const success = Math.random() < 0.8;
      navigate(success ? '/order-success' : '/payment-failed?reason=payment', { replace: true });
    }, 3000);
    return () => {
      clearInterval(t);
      clearTimeout(done);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--cream)]">
      <div className="text-center max-w-sm">
        <div className="relative w-32 h-32 mx-auto">
          <div className="splash-ring absolute inset-0" style={{ width: '100%', height: '100%' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-[var(--green-700)]" />
          </div>
        </div>
        <h1 className="display text-xl font-extrabold mt-6">Processing your payment…</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-2">{STEPS[step]}</p>
        <div className="flex items-center justify-center gap-2 mt-5 text-[12px] text-[var(--ink-soft)]">
          <Lock className="w-3.5 h-3.5" /> Do not press back or refresh
        </div>
      </div>
    </div>
  );
}
