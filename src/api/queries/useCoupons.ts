import { useMutation, useQuery } from '@tanstack/react-query';
import { apiErrorMessage, client, num, truthy } from '@/api/client';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import type { Coupon, CouponType } from '@/types';

interface ApiCoupon {
  code?: string;
  name?: string;
  description?: string | null;
  display_text?: string | null;
  discount?: number | string;
  /** 'PERCENTAGE' | 'AMOUNT'; legacy deploys still say 'FIXED' for AMOUNT */
  discount_type?: string;
  min_subtotal?: number | string;
  max_discount?: number | string | null;
  can_be_applied?: boolean | number;
}

function typeOf(raw: unknown): CouponType {
  return String(raw ?? '').toUpperCase() === 'PERCENTAGE' ? 'pct' : 'flat';
}

function mapCoupon(c: ApiCoupon): Coupon {
  const maxDiscount = c.max_discount == null ? null : num(c.max_discount);
  return {
    code: String(c.code ?? ''),
    name: String(c.name ?? c.code ?? ''),
    description: String(c.display_text ?? c.description ?? ''),
    type: typeOf(c.discount_type),
    value: num(c.discount),
    minSubtotal: num(c.min_subtotal),
    maxDiscount: maxDiscount && maxDiscount > 0 ? maxDiscount : null,
    canBeApplied: c.can_be_applied == null ? true : truthy(c.can_be_applied),
  };
}

/** POST /get-cart-coupon — what this cart could use.

    The key rounds the subtotal to the nearest ₹100 so nudging the quantity by
    one doesn't refetch the same list. */
export function useGetCoupons(subtotal: number) {
  const restaurantId = useAppStore((s) => s.storeLocation?.restaurantId);
  const token = useAuthStore((s) => s.authToken);

  return useQuery<Coupon[]>({
    queryKey: ['coupons', restaurantId, Math.floor(subtotal / 100) * 100],
    enabled: !!token && !!restaurantId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await client.post<{ coupons?: ApiCoupon[] }>('/get-cart-coupon', {
        restaurant_id: restaurantId,
        subtotal,
      });
      return (data?.coupons ?? []).map(mapCoupon).filter((c) => !!c.code);
    },
  });
}

export interface ApplyCouponResult {
  ok: boolean;
  coupon?: Coupon;
  discount?: number;
  message?: string;
}

/** Both this and useOrderTotals fold the discount the same way. */
export function couponDiscount(c: Coupon, subtotal: number): number {
  const raw =
    c.type === 'flat'
      ? c.value
      : Math.min(c.maxDiscount ?? Infinity, Math.floor((subtotal * c.value) / 100));
  return Math.max(0, Math.min(raw, subtotal));
}

/** POST /apply-coupon — the body field is `coupon`, not `code`.

    The code is sent exactly as typed: the backend matches case-sensitively, so
    upper-casing a customer's input turns a valid coupon into "invalid". */
export function useApplyCoupon() {
  const restaurantId = useAppStore((s) => s.storeLocation?.restaurantId);

  return useMutation({
    mutationFn: async ({
      code,
      subtotal,
    }: {
      code: string;
      subtotal: number;
    }): Promise<ApplyCouponResult> => {
      try {
        const { data } = await client.post<ApiCoupon & { success?: boolean; message?: string }>(
          '/apply-coupon',
          { coupon: code, restaurant_id: restaurantId, subtotal },
        );

        if (data?.success === false || !data?.code) {
          return { ok: false, message: data?.message ?? 'That coupon could not be applied.' };
        }

        const coupon = mapCoupon(data);
        if (subtotal < coupon.minSubtotal) {
          return { ok: false, message: `Add items worth ₹${coupon.minSubtotal} to use this` };
        }

        return { ok: true, coupon, discount: couponDiscount(coupon, subtotal) };
      } catch (err) {
        return { ok: false, message: apiErrorMessage(err, 'That coupon could not be applied.') };
      }
    },
  });
}
