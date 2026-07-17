import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL, client } from '@/api/client';

/** The gateway code the backend settles against is the literal string the
    gateway row carries — match it loosely here, send it back verbatim. */
export function isPhonePeGateway(code: string): boolean {
  return /phone\s*pe/i.test(code);
}

/** The backend's own bridge that initiates PhonePe: `/phonepe/pay/{orderId}`
    (a WEB route — see routes/web.php).

    Going through it matters. PhonePe checks the Referer origin against the URL
    the merchant onboarded with; a redirect fired from this storefront's origin
    gets INTERNAL_SECURITY_BLOCK_1. The bridge serves the redirect FROM the
    onboarded host, so the origin PhonePe sees is the one it expects.

    It hangs off the host's web root — the API base minus its trailing `/api`:
    https://app.dittomart.in/public/api → https://app.dittomart.in/public/phonepe/pay/123 */
export function phonePeBridgeUrl(orderId: number): string {
  const webRoot = API_BASE_URL.replace(/\/api$/, '');
  return `${webRoot}/phonepe/pay/${orderId}`;
}

/** POST /payment/phonepe/create-order — returns the hosted checkout URL
    directly. The bridge above is preferred (it fixes the origin PhonePe reads);
    this is the fallback for anywhere the bridge can't be opened. */
export function useCreatePhonePeOrder() {
  return useMutation({
    mutationFn: async (orderId: number): Promise<string> => {
      const { data } = await client.post<{ success?: boolean; url?: string; message?: string }>(
        '/payment/phonepe/create-order',
        { order_id: orderId },
      );
      if (data?.success && typeof data.url === 'string' && data.url) return data.url;
      throw new Error(data?.message || 'PhonePe did not return a payment link');
    },
  });
}
