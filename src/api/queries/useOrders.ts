import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { assetUrl, client, num } from '@/api/client';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import type { Customization, Order, OrderItem, OrderStatus } from '@/types';

interface ApiOrderAddon {
  id?: number;
  addon_id?: number;
  addon_name?: string | null;
  addon_price?: number | string | null;
  addon_category_name?: string | null;
}

interface ApiOrderItem {
  id: number;
  item_id?: number;
  name?: string | null;
  quantity?: number | string | null;
  price?: number | string | null;
  image?: string | null;
  order_item_addons?: ApiOrderAddon[] | null;
}

interface ApiOrderRow {
  id: number;
  unique_order_id?: string | null;
  orderstatus_id?: number | string | null;
  total?: number | string | null;
  sub_total?: number | string | null;
  coupon_name?: string | null;
  coupon_amount?: number | string | null;
  tax_amount?: number | string | null;
  tax?: number | string | null;
  delivery_charge?: number | string | null;
  payment_mode?: string | null;
  address?: string | null;
  created_at?: string | null;
  orderitems?: ApiOrderItem[] | null;
}

interface ApiOrdersPage {
  current_page?: number;
  next_page_url?: string | null;
  data?: ApiOrderRow[];
}

/** The backend's orderstatus_id → UI status, per getOrderStatusName() in its
    helpers.php (the authoritative map — the API guide's differs and is wrong):
      1 Order Placed · 2 Order Accepted · 3 Delivery Assigned · 4 Picked Up
      5 Completed · 6 Canceled · 7 Ready to Pickup · 8 Awaiting Payment
      9 Payment Failed · 10 Scheduled · 11 Confirmed Scheduled */
export function statusOf(id: number): OrderStatus {
  switch (id) {
    case 8:
      return 'awaiting-payment';
    case 2:
    case 10:
    case 11:
      return 'confirmed';
    case 3:
      // "Delivery Assigned" — the kitchen is packing while a rider is booked
      return 'preparing';
    case 7:
      return 'ready';
    case 4:
      return 'out-for-delivery';
    case 5:
      return 'delivered';
    case 9:
      return 'payment-failed';
    case 6:
      return 'cancelled';
    default:
      return 'placed';
  }
}

/** No more polling once the order can't change: delivered, cancelled, or the
    payment failed for good. */
export function isTerminalStatus(id: number): boolean {
  return id === 5 || id === 6 || id === 9;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  'awaiting-payment': 'Awaiting Payment',
  confirmed: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  'out-for-delivery': 'Out for Delivery',
  delivered: 'Delivered',
  'payment-failed': 'Payment Failed',
  cancelled: 'Cancelled',
};

function mapOrderItem(it: ApiOrderItem): OrderItem {
  const basePrice = num(it.price);
  const addons = it.order_item_addons ?? [];

  /* A variant-priced item stores price 0 on the order row and puts the real
     money on its addons. Reordering off `price` alone would drop a ₹0 line into
     the cart for an item the menu sells at ₹120. */
  const addonTotal = addons.reduce((s, a) => s + num(a.addon_price), 0);

  const customizations: Customization[] = addons.map((a) => ({
    /* The orders API doesn't return the addon's group id or type. The price is
       already resolved here, and reorder lines are never re-priced, so a
       placeholder group id is enough to carry the choice back to /place-order. */
    groupId: 0,
    groupName: String(a.addon_category_name ?? ''),
    addonId: num(a.addon_id ?? a.id),
    addonName: String(a.addon_name ?? ''),
    price: num(a.addon_price),
  }));

  return {
    id: String(it.item_id ?? it.id),
    /* The orderitem row's own PK. Two lines of the same item bought in
       different sizes share item_id AND name, so only this tells them apart. */
    rowId: String(it.id),
    name: String(it.name ?? ''),
    img: assetUrl(it.image),
    // a bad row can ship quantity 0 or "2" — both would render as "0×"
    qty: Math.max(1, Math.floor(num(it.quantity, 1))),
    basePrice,
    unitPrice: basePrice + addonTotal,
    customizations,
  };
}

function mapOrder(row: ApiOrderRow, etaMin: number): Order {
  const statusId = num(row.orderstatus_id, 1);
  return {
    id: String(row.unique_order_id ?? row.id),
    orderId: num(row.id),
    statusId,
    status: statusOf(statusId),
    items: (row.orderitems ?? []).map(mapOrderItem),
    subtotal: num(row.sub_total),
    discount: num(row.coupon_amount),
    couponCode: String(row.coupon_name ?? ''),
    deliveryCharge: num(row.delivery_charge),
    tax: num(row.tax_amount ?? row.tax),
    total: num(row.total),
    paymentMode: String(row.payment_mode ?? ''),
    address: String(row.address ?? ''),
    placedAt: String(row.created_at ?? ''),
    etaMin,
  };
}

/** POST /brand/{brand_unique_id}/get-orders?page=N */
export function useGetOrdersInfinite() {
  const brandId = useAppStore((s) => s.brand?.uniqueId);
  const etaMin = useAppStore((s) => s.storeLocation?.deliveryTime ?? 30);
  const token = useAuthStore((s) => s.authToken);

  return useInfiniteQuery({
    queryKey: ['orders', brandId, token],
    enabled: !!brandId && !!token,
    staleTime: 30_000,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await client.post<ApiOrdersPage | ApiOrderRow[]>(
        `/brand/${brandId}/get-orders?page=${pageParam}`,
        {},
      );
      // some deploys answer with a bare array instead of a paginator
      const page: ApiOrdersPage = Array.isArray(data)
        ? { current_page: 1, next_page_url: null, data }
        : (data ?? {});

      return {
        orders: (page.data ?? []).map((r) => mapOrder(r, etaMin)),
        currentPage: num(page.current_page, Number(pageParam)),
        hasNext: !!page.next_page_url,
      };
    },
    getNextPageParam: (last) => (last.hasNext ? last.currentPage + 1 : undefined),
  });
}

/** Every order the customer has, flattened. */
export function useGetOrders() {
  const q = useGetOrdersInfinite();
  const orders = q.data?.pages.flatMap((p) => p.orders) ?? [];
  return { ...q, orders };
}

/** One order, by its unique_order_id. There is no endpoint for this, so it is
    resolved out of the order list the customer already has — pulling the next
    page when a deep link lands on an order we haven't fetched yet. */
export function useGetOrder(uniqueOrderId: string | undefined) {
  const { orders, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetOrders();
  const order = orders.find((o) => o.id === uniqueOrderId) ?? null;

  if (!order && hasNextPage && !isFetchingNextPage && !isLoading) void fetchNextPage();

  return { order, isLoading: isLoading || (!order && (hasNextPage ?? false)) };
}

interface ApiTrackResp {
  running_order?: {
    id?: number;
    unique_order_id?: string;
    orderstatus_id?: number | string;
    tracking_url?: string | null;
    third_party_tracking_url?: string | null;
    pickupanddrop_details?: { tracking_url?: string | null } | null;
  } | null;
  delivery_details?: {
    name?: string | null;
    phone?: string | null;
    photo?: string | null;
    rating?: number | string | null;
    tracking_url?: string | null;
  } | null;
}

export interface TrackState {
  statusId: number;
  status: OrderStatus;
  trackingUrl: string | null;
  rider: { name: string; phone: string; photo: string; rating: number } | null;
}

/** POST /update-user-info — the fork's live-tracking endpoint, misleading name
    and all. Polls every 15s and stops dead once the order is delivered or
    cancelled, so a finished order does not keep hitting the server forever. */
export function useTrackOrder(uniqueOrderId: string | undefined) {
  const token = useAuthStore((s) => s.authToken);

  return useQuery<TrackState | null>({
    queryKey: ['track-order', uniqueOrderId],
    enabled: !!uniqueOrderId && !!token,
    staleTime: 0,
    refetchIntervalInBackground: false,
    refetchInterval: (q) => {
      const s = q.state.data;
      if (s && isTerminalStatus(s.statusId)) return false;
      return 15_000;
    },
    queryFn: async () => {
      const { data } = await client.post<ApiTrackResp>('/update-user-info', {
        unique_order_id: uniqueOrderId,
      });

      const ro = data?.running_order;
      if (!ro) return null;

      const dd = data?.delivery_details;
      const statusId = num(ro.orderstatus_id, 1);

      return {
        statusId,
        status: statusOf(statusId),
        trackingUrl:
          ro.tracking_url ||
          ro.third_party_tracking_url ||
          ro.pickupanddrop_details?.tracking_url ||
          dd?.tracking_url ||
          null,
        rider: dd?.name
          ? {
              name: String(dd.name),
              phone: String(dd.phone ?? ''),
              photo: assetUrl(dd.photo ?? ''),
              rating: num(dd.rating),
            }
          : null,
      };
    },
  });
}
