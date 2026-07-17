import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import { startPayuCheckout, useCreatePayuOrder } from '@/api/mutations/usePayu';
import { isPhonePeGateway, phonePeBridgeUrl } from '@/api/mutations/usePhonePe';
import { useToast } from '@/hooks/useToast';
import { PENDING } from '@/utils/storageKeys';

const STEPS = ['Submitting your order', 'Initializing checkout', 'Opening secure gateway'];

/* The bridge between /place-order and the gateway. The order already exists on
   the backend by the time this mounts — this only hands the customer over.

   PayU:    a signed form POST, straight to the host the backend hashed against.
   PhonePe: opens the backend's own /phonepe/pay/{id} bridge, which redirects
            from the onboarded domain — required, or PhonePe answers
            INTERNAL_SECURITY_BLOCK_1. It's a tap-to-open card rather than an
            automatic window.open, because a popup that isn't tied to a real tap
            is what browsers block. */
export function PaymentProcessingPage() {
  const navigate = useNavigate();
  const push = useToast();
  const createPayu = useCreatePayuOrder();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'web' | 'webview' | null>(null);
  const [phonePeUrl, setPhonePeUrl] = useState<string | null>(null);
  const startedRef = useRef(false);

  const orderId = sessionStorage.getItem(PENDING.orderId);
  const uniqueOrderId = sessionStorage.getItem(PENDING.uniqueOrderId);
  const method = sessionStorage.getItem(PENDING.method) ?? '';

  useEffect(() => {
    if (!orderId) {
      navigate('/home', { replace: true });
      return;
    }
    // React 18 StrictMode double-invokes effects; a second handoff would open
    // two gateway sessions for one order.
    if (startedRef.current) return;
    startedRef.current = true;

    /* Whatever happens from here, the order is already placed — never strand
       the customer on a dead screen. */
    const orderIsSafe = () =>
      navigate(uniqueOrderId ? `/view-order/${uniqueOrderId}` : '/my-orders', { replace: true });

    // PhonePe: no API call — the bridge initiates the payment itself.
    if (isPhonePeGateway(method)) {
      setPhonePeUrl(phonePeBridgeUrl(Number(orderId)));
      setStep(2);
      return;
    }

    const run = async () => {
      setStep(1);
      try {
        const handoff = await createPayu.mutateAsync(Number(orderId));
        if (!handoff) {
          push('The gateway could not be opened — your order is saved', 'err', 'x');
          setTimeout(orderIsSafe, 1200);
          return;
        }
        setStep(2);
        setMode(startPayuCheckout(handoff));
      } catch {
        push('The gateway could not be opened — your order is saved', 'err', 'x');
        setTimeout(orderIsSafe, 1200);
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The native shells settle payment themselves and post the result back — the
     browser path never fires this, it leaves the page entirely. */
  useEffect(() => {
    if (mode !== 'webview') return;

    const onMessage = (e: MessageEvent) => {
      let payload: unknown = e.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }
      const msg = payload as { type?: string; status?: string } | null;
      if (msg?.type !== 'PAYMENT_RESULT') return;

      if (msg.status === 'SUCCESS') {
        navigate(`/view-order/${uniqueOrderId}`, { replace: true });
      } else {
        push('Payment was not completed', 'err', 'x');
        navigate('/my-orders', { replace: true });
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [mode, uniqueOrderId, navigate, push]);

  // PhonePe: a tap-to-open card, so this page survives to be come back to.
  if (phonePeUrl) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 py-10 bg-[var(--cream)]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-[var(--leaf-100)] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-[var(--green-700)]" />
          </div>
          <h1 className="display text-xl font-extrabold mt-5">Your order is placed</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            Complete the payment with PhonePe to confirm it.
          </p>
          <button
            onClick={() => window.open(phonePeUrl, '_blank', 'noopener')}
            className="btn btn-primary w-full mt-6 py-3.5 text-base"
          >
            Pay with PhonePe <ExternalLink className="w-4 h-4 flex-none" />
          </button>
          <button
            onClick={() => navigate(uniqueOrderId ? `/view-order/${uniqueOrderId}` : '/my-orders', { replace: true })}
            className="btn btn-ghost w-full mt-3"
          >
            View my order
          </button>
          {/* Reassurance for someone who paid but landed back here — the one
              line that stops a duplicate payment. */}
          <p className="text-xs2 text-[var(--ink-soft)] mt-4">
            Paid already? Your order updates on its own — open it any time from My Orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-10 bg-[var(--cream)]">
      <div className="text-center max-w-sm">
        <div className="relative w-32 h-32 mx-auto">
          <div className="splash-ring absolute inset-0" style={{ width: '100%', height: '100%' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-[var(--green-700)]" />
          </div>
        </div>
        <h1 className="display text-xl font-extrabold mt-6">Processing your payment…</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-2">{STEPS[step]}</p>
        <div className="flex items-center justify-center gap-2 mt-5 text-xs2 text-[var(--ink-soft)]">
          <Lock className="w-3.5 h-3.5 flex-none" /> Do not press back or refresh
        </div>
      </div>
    </div>
  );
}
