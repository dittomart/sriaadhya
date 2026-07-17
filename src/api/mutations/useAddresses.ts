import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, num, truthy } from '@/api/client';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import type { Address } from '@/types';

interface ApiAddress {
  id: number | string;
  address?: string | null;
  house?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  tag?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  landmark?: string | null;
  name?: string | null;
  phone?: string | null;
  is_default?: number | boolean | null;
  /** only present when the request carried restaurant_id — see useGetAddresses */
  is_operational?: number | boolean | null;
}

function mapAddress(a: ApiAddress): Address {
  return {
    id: String(a.id),
    label: String(a.tag ?? 'Home'),
    receiverName: String(a.name ?? ''),
    phone: String(a.phone ?? ''),
    houseNo: String(a.house ?? ''),
    street: String(a.address ?? ''),
    landmark: String(a.landmark ?? ''),
    city: String(a.city ?? ''),
    state: String(a.state ?? ''),
    pincode: String(a.pincode ?? ''),
    latitude: num(a.latitude),
    longitude: num(a.longitude),
    isDefault: truthy(a.is_default),
    /* The backend's OWN verdict on whether it delivers this far — it runs the
       same check its admin panel does (delivery areas when configured, else the
       store's radius). Absent means the question wasn't asked; treat that as
       deliverable rather than inventing a "no". */
    isDeliverable: a.is_operational == null ? true : truthy(a.is_operational),
  };
}

/** Both envelopes ship in the wild: a bare array, or one wrapped in `data`. */
function rowsOf(data: ApiAddress[] | { data?: ApiAddress[] } | undefined): ApiAddress[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** POST /get-addresses — behind jwt.auth, so guests never ask.

    Sending `restaurant_id` makes the backend stamp every row with
    `is_operational`: its own answer to "do we deliver here", run through the
    same check the admin panel uses. Asking it is better than re-deriving the
    distance on the client, where a rounding difference would let an address the
    backend rejects look deliverable. */
export function useGetAddresses() {
  const token = useAuthStore((s) => s.authToken);
  const restaurantId = useAppStore((s) => s.storeLocation?.restaurantId);

  return useQuery<Address[]>({
    queryKey: ['addresses', token, restaurantId],
    enabled: !!token,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await client.post<ApiAddress[] | { data?: ApiAddress[] }>(
        '/get-addresses',
        restaurantId ? { restaurant_id: restaurantId } : {},
      );
      return rowsOf(data).map(mapAddress);
    },
  });
}

export interface SaveAddressInput {
  /** present on an edit — the backend treats the call as an upsert */
  id?: string;
  label: string;
  receiverName: string;
  phone: string;
  houseNo: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

/** POST /save-address

    Every key goes on every call — the fork reads them positionally in places and
    a missing key is not the same as an empty one. An edit carries `id` AND
    `address_id`: different deploys read different ones. */
export function useSaveAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveAddressInput): Promise<Address | null> => {
      const body: Record<string, unknown> = {
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.street ?? '',
        house: input.houseNo ?? '',
        tag: input.label ?? 'Home',
        city: input.city ?? '',
        state: input.state ?? '',
        pincode: input.pincode ?? '',
        landmark: input.landmark ?? '',
        name: input.receiverName ?? '',
        phone: input.phone ?? '',
      };
      if (input.id) {
        body.id = input.id;
        body.address_id = input.id;
      }

      const { data } = await client.post<ApiAddress[] | { data?: ApiAddress[] }>('/save-address', body);

      /* The response is the whole list, not the saved row. The newest row is the
         one we just wrote — the caller needs its id to select it. */
      const list = rowsOf(data).map(mapAddress);
      if (input.id) return list.find((a) => a.id === input.id) ?? null;
      return list.length > 0 ? list[list.length - 1] : null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

/** POST /delete-address */
export function useDeleteAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.post('/delete-address', { id, address_id: id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

/** POST /set-default-address */
export function useSetDefaultAddress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await client.post('/set-default-address', { id, address_id: id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

/** POST /coordinate-to-address — reverse geocode. The response is a plain
    string; anything else means "no address found". */
export function useCoordinateToAddress() {
  return useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }): Promise<string> => {
      const { data } = await client.post<unknown>('/coordinate-to-address', { lat, lng });
      return typeof data === 'string' ? data : '';
    },
  });
}
