import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client, num } from '@/api/client';

/** POST /check-ban — a pre-flight gate, not a hook: it runs once, on tap.

    Fails OPEN. If the ban service is down, a network error must not stop a
    paying customer from ordering. */
export async function checkBan(): Promise<{ banned: boolean; message?: string }> {
  try {
    const { data } = await client.post<{ success?: boolean; message?: string }>('/check-ban', {});
    if (data?.success === false) return { banned: true, message: data.message };
    return { banned: false };
  } catch {
    return { banned: false };
  }
}

export interface PlaceOrderResult {
  id: number;
  uniqueOrderId: string;
  /** what the backend says it settled as — authoritative for routing */
  paymentMode: string;
  paymentUrl?: string;
}

type Json = Record<string, unknown>;

function isOrderShape(v: unknown): v is Json {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const o = v as Json;

  const uoid = o.unique_order_id;
  if (typeof uoid === 'string' && uoid.length > 0) return true;

  const id = o.id ?? o.order_id;
  if (typeof id === 'number') return true;
  /* Laravel serialises bigint keys as strings often enough that a strict
     typeof === 'number' check rejects a perfectly good order. */
  if (typeof id === 'string' && id.trim() !== '' && Number.isFinite(Number(id))) return true;

  return false;
}

/** The order object is somewhere in the response; which envelope it is wrapped
    in depends on the payment path. Walk the tree until we find it. */
function findOrder(value: unknown, depth = 0): Json | null {
  if (depth > 6 || value == null) return null;
  if (isOrderShape(value)) return value;

  if (Array.isArray(value)) {
    for (const v of value) {
      const hit = findOrder(v, depth + 1);
      if (hit) return hit;
    }
    return null;
  }

  if (typeof value === 'object') {
    for (const v of Object.values(value as Json)) {
      const hit = findOrder(v, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

function normalize(resp: unknown): PlaceOrderResult {
  const order = findOrder(resp);
  const root = (resp ?? {}) as Json;

  if (!order) {
    if (root.success === false || root.status === false) {
      throw new Error(String(root.message ?? 'The order could not be placed.'));
    }
    throw new Error('The order went through but the response could not be read.');
  }

  return {
    id: num(order.id ?? order.order_id),
    uniqueOrderId: String(order.unique_order_id ?? ''),
    paymentMode: String(order.payment_mode ?? root.payment_mode ?? ''),
    paymentUrl: (order.payment_url as string) ?? (root.payment_url as string) ?? undefined,
  };
}

/** POST /place-order */
export function usePlaceOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: Record<string, unknown>): Promise<PlaceOrderResult> => {
      const { data } = await client.post<unknown>('/place-order', body);
      return normalize(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
