import { useMutation } from '@tanstack/react-query';
import { client } from '@/api/client';

const PAYU_FORM_URL = (import.meta.env.VITE_PAYU_FORM_URL as string) || 'https://secure.payu.in/_payment';

export type PayuFields = Record<string, string | number>;

/* The gateway's own fields arrive scattered across the envelope: some at the top
   level, some under payuMoneyData, some under data. Merge in that order (later
   layers win) and drop the keys that are ours, not PayU's. */
const META_KEYS = new Set([
  'success',
  'message',
  'action_url',
  'payment_url',
  'url',
  'hash_status',
  'payuMoneyData',
  'data',
  // the host to POST to — pulled out separately below, not a form field
  'gatewayUrl',
]);

export interface PayuHandoff {
  fields: PayuFields;
  /** the exact host the backend built the hash for — POST here, NOT a
      hardcoded one, or a test-mode hash lands on the prod host and PayU
      rejects it (and vice-versa). */
  actionUrl: string;
}

function pickGatewayUrl(resp: Record<string, unknown>): string | null {
  for (const layer of [resp, resp.payuMoneyData, resp.data]) {
    if (layer && typeof layer === 'object') {
      const u = (layer as Record<string, unknown>).gatewayUrl;
      if (typeof u === 'string' && /^https?:\/\//.test(u)) return u;
    }
  }
  return null;
}

export function extractPayuHandoff(resp: unknown): PayuHandoff | null {
  if (!resp || typeof resp !== 'object') return null;

  const root = resp as Record<string, unknown>;
  const layers = [root, root.payuMoneyData, root.data];

  const fields: PayuFields = {};
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object') continue;
    for (const [k, v] of Object.entries(layer as Record<string, unknown>)) {
      if (META_KEYS.has(k)) continue;
      if (typeof v === 'string' || typeof v === 'number') fields[k] = v;
    }
  }

  // without these three PayU rejects the handoff outright
  if (!fields.key || !fields.txnid || !fields.hash) return null;

  // Prefer the backend's gatewayUrl (its test-vs-prod switch); fall back to the
  // configured host only when it didn't send one.
  return { fields, actionUrl: pickGatewayUrl(root) ?? PAYU_FORM_URL };
}

declare global {
  interface Window {
    Android?: {
      startPayuProcess?: (
        txnid: string,
        amount: string,
        firstname: string,
        email: string,
        phone: string,
      ) => void;
    };
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

/** Hand the customer to PayU.

    The order of these three branches is load-bearing: the legacy Android shell
    ALSO exposes a WebView bridge, so checking for ReactNativeWebView first would
    hijack it and the native SDK would never run. */
export function startPayuCheckout(handoff: PayuHandoff): 'web' | 'webview' {
  const { fields, actionUrl } = handoff;

  if (
    typeof window !== 'undefined' &&
    typeof window.Android?.startPayuProcess === 'function' &&
    navigator.userAgent === 'FoodomaaAndroidWebViewUA'
  ) {
    window.Android.startPayuProcess(
      String(fields.txnid),
      String(fields.amount ?? ''),
      String(fields.firstname ?? ''),
      String(fields.email ?? ''),
      String(fields.phone ?? ''),
    );
    return 'webview';
  }

  if (typeof window !== 'undefined' && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'START_PAYMENT', payload: fields }));
    return 'webview';
  }

  const form = document.createElement('form');
  form.method = 'POST';
  // the host the backend signed the hash against — never a hardcoded one
  form.action = actionUrl;
  form.style.display = 'none';

  for (const [k, v] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = k;
    input.value = String(v);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  return 'web';
}

/** POST /payment/payu/create-order */
export function useCreatePayuOrder() {
  return useMutation({
    mutationFn: async (orderId: number): Promise<PayuHandoff | null> => {
      const { data } = await client.post<unknown>('/payment/payu/create-order', {
        order_id: orderId,
      });
      return extractPayuHandoff(data);
    },
  });
}
