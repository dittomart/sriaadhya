import { useQuery } from '@tanstack/react-query';
import { assetUrl, client, num, truthy } from '@/api/client';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import type { PaymentGateway } from '@/types';

interface ApiGateway {
  id: number;
  name?: string;
  description?: string | null;
  is_active?: number | boolean;
  logo?: string | null;
  gateway?: string | null;
  payment_method?: string | null;
  type?: string | null;
}

/** POST /get-payment-gateways — the methods this store actually accepts.

    The code is whichever of these the deploy fills in, CASE PRESERVED: it goes
    back to /place-order verbatim as `method`, and the backend compares it
    literally ('PayUMoney' is not 'payumoney'). */
export function useGetPaymentGateways() {
  const restaurantId = useAppStore((s) => s.storeLocation?.restaurantId);
  const token = useAuthStore((s) => s.authToken);

  return useQuery<PaymentGateway[]>({
    queryKey: ['payment-gateways', restaurantId],
    enabled: !!token && !!restaurantId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await client.post<ApiGateway[] | { data?: ApiGateway[] }>(
        '/get-payment-gateways',
        { restaurant_id: restaurantId },
      );

      const rows: ApiGateway[] = Array.isArray(data) ? data : (data?.data ?? []);

      return rows
        .filter((g) => truthy(g.is_active))
        .map((g) => ({
          id: num(g.id),
          code: String(g.gateway || g.name || g.payment_method || g.type || ''),
          name: String(g.name ?? ''),
          description: String(g.description ?? ''),
          logo: assetUrl(g.logo),
        }))
        .filter((g) => !!g.code);
    },
  });
}

/** COD is settled at the door — it must not route into a gateway. */
export function isCodGateway(code: string): boolean {
  const c = code.toUpperCase();
  return c === 'COD' || c.includes('CASH');
}
