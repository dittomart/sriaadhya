import { useQuery } from '@tanstack/react-query';
import { assetUrl, client, num, truthy } from '@/api/client';
import { useAppStore } from '@/store/appStore';
import { sanitizeCmsHtmlMap } from '@/utils/sanitizeHtml';
import type { Brand, StoreLocation } from '@/types';

/** The storefront's own domain. Must match `brands.domain` in the DB —
    Sri Aadhya is registered as `app.sriaadhya.in`. */
export const BRAND_DOMAIN =
  (import.meta.env.VITE_BRAND_DOMAIN as string) ||
  (typeof window !== 'undefined' ? window.location.hostname : '');

interface ApiBrand {
  id: number;
  unique_id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  hero_image?: string | null;
  domain?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}

type ApiLocation = Record<string, unknown>;

function mapBrand(b: ApiBrand): Brand {
  return {
    id: num(b.id),
    uniqueId: String(b.unique_id ?? ''),
    name: String(b.name ?? ''),
    description: String(b.description ?? ''),
    logo: assetUrl(b.logo),
    heroImage: assetUrl(b.hero_image),
    domain: String(b.domain ?? ''),
    phone: String(b.phone ?? ''),
    whatsapp: String(b.whatsapp ?? ''),
  };
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** Normalise whatever `schedule_data` happens to be on this deploy.

    The column is free-form across the fork's admin versions: a JSON string, an
    object keyed by day, an array, or null (which is what this store ships).
    Anything unreadable is left as {} — isStoreOpenNow then falls back to
    is_active rather than locking a real customer out over a parser miss. */
function parseHours(raw: unknown, row: ApiLocation): Record<string, [string, string]> {
  let data: unknown = raw;

  if (typeof data === 'string') {
    const s = data.trim();
    if (!s) data = null;
    else {
      try {
        data = JSON.parse(s);
      } catch {
        data = null;
      }
    }
  }

  const out: Record<string, [string, string]> = {};

  const pair = (v: unknown): [string, string] | null => {
    if (Array.isArray(v) && v.length >= 2) return [String(v[0]), String(v[1])];
    if (typeof v === 'string') {
      const parts = v.split(/\s*(?:-|–|to)\s*/i);
      if (parts.length >= 2) return [parts[0].trim(), parts[1].trim()];
    }
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (o.closed === true || o.is_open === false) return null;
      const open = o.open ?? o.from ?? o.start ?? o.start_time ?? o.opening_time ?? o.open_time;
      const close = o.close ?? o.to ?? o.end ?? o.end_time ?? o.closing_time ?? o.close_time;
      if (open != null && close != null) return [String(open), String(close)];
    }
    return null;
  };

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      const day = k.slice(0, 3).toLowerCase();
      if (!(DAY_KEYS as readonly string[]).includes(day)) continue;
      const p = pair(v);
      if (p) out[day] = p;
    }
  }

  /* "Manual mode": the store ships one open/close pair on the row itself and no
     schedule at all. Fold it into the same 7-day map so there is one code path. */
  if (Object.keys(out).length === 0) {
    const flat = pair({
      open: row.open ?? row.open_time ?? row.opening_time,
      close: row.close ?? row.close_time ?? row.closing_time,
    });
    if (flat) DAY_KEYS.forEach((d) => (out[d] = flat));
  }

  return out;
}

/** minutes, from "30-45 min" / "30" / 30 */
function parseEta(v: unknown, fallback = 30): number {
  if (v == null) return fallback;
  const m = String(v).match(/\d+/g);
  if (!m || m.length === 0) return fallback;
  const nums = m.map(Number).filter(Number.isFinite);
  if (nums.length === 0) return fallback;
  return Math.round(nums[nums.length - 1]);
}

/** null when the column is null — "no override", distinct from "force closed". */
function overrideOf(v: unknown): number | null {
  if (v == null || v === '') return null;
  return truthy(v) ? 1 : 0;
}

function mapLocation(l: ApiLocation): StoreLocation {
  const taxPercent = num(l.tax_percentage);
  return {
    id: num(l.id),
    restaurantId: num(l.id),
    name: String(l.name ?? ''),
    slug: String(l.slug ?? ''),
    uniqueSlug: String(l.unique_slug ?? l.slug ?? ''),
    description: String(l.description ?? ''),
    address: String(l.address ?? ''),
    city: String(l.city ?? ''),
    state: String(l.state ?? ''),
    pincode: String(l.pincode ?? ''),
    landmark: String(l.landmark ?? ''),
    phone: String(l.phone ?? ''),
    whatsapp: String(l.whatsapp ?? l.phone ?? ''),
    latitude: num(l.latitude),
    longitude: num(l.longitude),
    deliveryRadius: num(l.delivery_radius, 0),
    deliveryCharge: num(l.delivery_charges ?? l.base_delivery_charge, 0),
    minOrder: num(l.min_order_price, 0),
    freeDeliveryAbove: num(l.free_delivery_subtotal, 0),
    deliveryTime: parseEta(l.delivery_time),
    taxPercent,
    taxEnabled: (truthy(l.is_tax_for_store) || truthy(l.enable_item_tax)) && taxPercent > 0,
    isActive: truthy(l.is_active),
    isSchedulable: truthy(l.is_schedulable),
    scheduleOverride: overrideOf(l.schedule_override),
    hours: parseHours(l.schedule_data, l),
    image: assetUrl((l.image as string) ?? ''),
  };
}

/** GET /brands?domain= — resolves which storefront this build is.

    Boot is the one call with nothing to fall back on, so it fails FAST and
    LOUD: a dead API here means a blank app, and a customer staring at a spinner
    for 20 seconds cannot tell that from a slow one. */
export function useGetBrands(domain: string = BRAND_DOMAIN) {
  return useQuery<Brand | null>({
    queryKey: ['brands', domain],
    enabled: !!domain,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 0,
    queryFn: async () => {
      const { data } = await client.get<{ success?: boolean; brands?: ApiBrand[] }>('/brands', {
        params: { domain },
        timeout: 8000,
      });
      const first = data?.brands?.[0];
      return first ? mapBrand(first) : null;
    },
  });
}

/** POST /brand-locations/{unique_id} — every store under the brand.

    The store is written into zustand from inside the queryFn, not from an effect
    in AppInit: an effect lands one render later, and in that render
    `storeLocation` is still null while the query already says "done" — long
    enough for the open/closed check to flash "store unavailable". */
export function useGetLocations(uniqueId: string | undefined) {
  return useQuery<StoreLocation[]>({
    queryKey: ['brand-locations', uniqueId],
    enabled: !!uniqueId,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data } = await client.post<{ locations?: ApiLocation[] }>(
        `/brand-locations/${uniqueId}`,
        {},
      );

      const rows = Array.isArray(data?.locations) ? data.locations : [];
      const list = rows
        /* is_accepted is the admin's approval; is_active is the runtime
           open/closed bit and must NOT filter a store out of the list. */
        .filter((r) => r.is_accepted == null || truthy(r.is_accepted))
        .map(mapLocation);

      if (list[0]) useAppStore.getState().setStoreLocation(list[0]);
      return list;
    },
  });
}

export interface BrandPolicies {
  privacyPolicy: string | null;
  termsConditions: string | null;
  cancellationRefundPolicy: string | null;
  deliveryPolicy: string | null;
  returnPolicy: string | null;
  deleteAccountPolicy: string | null;
  contactUs: string | null;
  sellerTerms: string | null;
  aboutUs: string | null;
}

/** GET /brand/{domain}/policies — CMS copy, sanitised at the data boundary so
    the cache only ever holds markup that is safe to render. */
export function useGetBrandPolicies(domain: string = BRAND_DOMAIN) {
  return useQuery<BrandPolicies | null>({
    queryKey: ['brand-policies', domain],
    enabled: !!domain,
    staleTime: 6 * 60 * 60 * 1000,
    queryFn: async () => {
      const { data } = await client.get<{ data?: BrandPolicies }>(
        `/brand/${encodeURIComponent(domain)}/policies`,
      );
      return sanitizeCmsHtmlMap(data?.data ?? null);
    },
  });
}
