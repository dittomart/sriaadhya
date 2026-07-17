import { useQuery } from '@tanstack/react-query';
import { assetUrl, client, num, truthy } from '@/api/client';
import { useAppStore } from '@/store/appStore';
import type { AddonGroup, AddonOption, Category, FoodType, Product } from '@/types';

/* ============================================================
   /get-restaurant-items/{slug} is the master catalog. Its shape:

     { items: { "<category name>": [ item, … ] },
       recommended: [ item, … ] | null }

   and each item carries `addons` keyed by ADDON-CATEGORY NAME:

     addons: { "Weight": [ { name: "1 Kg", price: 120, … } ] }

   On this store every item row has price "0.00" and the real money lives on a
   SINGLE addon group — see getDisplayPrice.
   ============================================================ */

interface ApiAddon {
  id: number;
  name: string;
  price: number | string;
  is_active?: number | boolean;
  addon_category?: {
    id: number;
    name: string;
    type?: string | null;
    addon_limit?: number | null;
  } | null;
}

interface ApiItem {
  id: number;
  restaurant_id: number;
  item_category_id: number;
  category_name?: string;
  name: string;
  desc?: string | null;
  description?: string | null;
  price: number | string;
  old_price?: number | string | null;
  image?: string | null;
  is_recommended?: number | string | boolean;
  is_popular?: number | string | boolean;
  is_new?: number | string | boolean;
  is_veg?: number | string | boolean | null;
  addons?: Record<string, ApiAddon[]> | ApiAddon[] | null;
}

/** A "multi-select" capped at one choice IS a variant picker; an unlabelled
    group is treated as one too, because that is the shape that carries the
    price for variant-priced items. */
function normalizeAddonType(raw: unknown, limit: number): 'SINGLE' | 'MULTIPLE' {
  const t = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (t.startsWith('MULT') || t === '0' || t === 'CHECKBOX') {
    return limit === 1 ? 'SINGLE' : 'MULTIPLE';
  }
  return 'SINGLE';
}

function groupAddons(raw: ApiItem['addons']): AddonGroup[] {
  if (!raw) return [];

  const rows: ApiAddon[] = Array.isArray(raw) ? raw : Object.values(raw).flat();
  const byGroup = new Map<
    number,
    { name: string; type: unknown; limit: number; options: AddonOption[] }
  >();

  for (const a of rows) {
    if (a.is_active != null && !truthy(a.is_active)) continue;

    const cat = a.addon_category;
    const gid = num(cat?.id, 0);
    const limit = num(cat?.addon_limit, 0);

    if (!byGroup.has(gid)) {
      byGroup.set(gid, { name: String(cat?.name ?? 'Options'), type: cat?.type, limit, options: [] });
    }
    byGroup.get(gid)!.options.push({ id: num(a.id), name: String(a.name ?? ''), price: num(a.price) });
  }

  return [...byGroup.entries()]
    .filter(([, g]) => g.options.length > 0)
    .map(([id, g]) => ({
      id,
      name: g.name,
      type: normalizeAddonType(g.type, g.limit),
      limit: g.limit || g.options.length,
      options: g.options,
    }));
}

/* `desc` comes out of a rich-text editor, so it is HTML — and an item whose
   description is an empty paragraph ("<p><br></p>") has no description at all.
   The cards render it as plain text, so it is flattened here at the boundary
   rather than injected as markup into every card. */
function plainText(html: unknown): string {
  const s = String(html ?? '');
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** `is_veg` is null across this store's whole catalog — an unset flag is not a
    claim either way, so it maps to 'other' rather than asserting non-veg. */
function foodTypeOf(v: unknown): FoodType {
  if (v == null || v === '') return 'other';
  return truthy(v) ? 'veg' : 'non-veg';
}

function mapItem(it: ApiItem, fallbackCategoryName = ''): Product {
  const isRecommended = truthy(it.is_recommended);
  const isPopular = truthy(it.is_popular);

  return {
    id: String(it.id),
    catId: String(it.item_category_id ?? ''),
    categoryName: String(it.category_name ?? fallbackCategoryName),
    restaurantId: num(it.restaurant_id),
    name: String(it.name ?? ''),
    desc: plainText(it.desc ?? it.description),
    price: num(it.price),
    mrp: num(it.old_price),
    img: assetUrl(it.image),
    foodType: foodTypeOf(it.is_veg),
    isRecommended,
    isPopular,
    isNew: truthy(it.is_new),
    // the card's ribbon — the two flags the admin actually sets
    bestseller: isRecommended || isPopular,
    addonGroups: groupAddons(it.addons),
  };
}

export interface CatalogData {
  flat: Product[];
  byCategory: Record<string, Product[]>;
  recommended: Product[];
}

/** POST /get-restaurant-items/{slug} — one fetch feeds home, category and PDP. */
export function useGetCatalog() {
  const slug = useAppStore((s) => s.storeLocation?.slug);

  return useQuery<CatalogData>({
    queryKey: ['restaurant-items', slug],
    enabled: !!slug,
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { data } = await client.post<{
        items?: Record<string, ApiItem[]> | ApiItem[];
        recommended?: ApiItem[] | null;
      }>(`/get-restaurant-items/${slug}`, {});

      const flat: Product[] = [];
      const byCategory: Record<string, Product[]> = {};

      if (Array.isArray(data?.items)) {
        for (const it of data.items) {
          const p = mapItem(it);
          flat.push(p);
          (byCategory[p.categoryName] ||= []).push(p);
        }
      } else if (data?.items && typeof data.items === 'object') {
        for (const [categoryName, rows] of Object.entries(data.items)) {
          for (const it of rows ?? []) {
            const p = mapItem(it, categoryName);
            flat.push(p);
            (byCategory[categoryName] ||= []).push(p);
          }
        }
      }

      const seen = new Map(flat.map((p) => [p.id, p]));
      const recommended = (data?.recommended ?? []).map((it) => seen.get(String(it.id)) ?? mapItem(it));

      return { flat, byCategory, recommended };
    },
  });
}

interface ApiCategory {
  id: number;
  name: string;
  image?: string | null;
  meat_image?: string | null;
  is_enabled?: number | string | boolean;
  order_column?: number | null;
}

/** POST /get-meats-categories — the item categories enabled on this store. */
export function useGetCategories() {
  const restaurantId = useAppStore((s) => s.storeLocation?.restaurantId);

  return useQuery<Category[]>({
    queryKey: ['categories', restaurantId],
    enabled: !!restaurantId,
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { data } = await client.post<Record<string, ApiCategory> | ApiCategory[] | { data?: unknown }>(
        '/get-meats-categories',
        { id: restaurantId },
      );

      const envelope =
        data && !Array.isArray(data) && 'data' in data && data.data ? (data.data as unknown) : data;
      const rows: ApiCategory[] = Array.isArray(envelope)
        ? (envelope as ApiCategory[])
        : (Object.values((envelope ?? {}) as Record<string, ApiCategory>) as ApiCategory[]);

      return rows
        .filter((c) => c && c.id != null && (c.is_enabled == null || truthy(c.is_enabled)))
        .sort((a, b) => num(a.order_column) - num(b.order_column))
        .map((c) => ({
          id: String(c.id),
          name: String(c.name ?? ''),
          image: assetUrl(c.image ?? c.meat_image ?? ''),
        }));
    },
  });
}

export interface Slide {
  id: number;
  name: string;
  image: string;
  url: string;
}

/** GET /restaurant-sliders/{slug} — the storefront's own promo slides.

    A slide with no image is not a slide; an empty list means the store has not
    uploaded any, and the caller hides the rail rather than showing a hole. */
export function useGetSliders() {
  const slug = useAppStore((s) => s.storeLocation?.slug);

  return useQuery<Slide[]>({
    queryKey: ['sliders', slug],
    enabled: !!slug,
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { data } = await client.get<{
        sliders?: Array<{ slides?: Array<{ id: number; name?: string; image?: string; url?: string }> }>;
      }>(`/restaurant-sliders/${slug}`);

      return (data?.sliders ?? [])
        .flatMap((s) => s.slides ?? [])
        .filter((s) => !!s.image)
        .map((s) => ({
          id: num(s.id),
          name: String(s.name ?? ''),
          image: assetUrl(s.image),
          url: String(s.url ?? ''),
        }));
    },
  });
}

/** Every item on the menu. */
export function useGetProducts() {
  const q = useGetCatalog();
  return { ...q, data: q.data?.flat ?? [] };
}

/** One item. Served from the catalog when it is loaded, and fetched on its own
    when the PDP is the entry point (a shared link, a page refresh). */
export function useGetProduct(id: string | undefined) {
  const catalog = useGetCatalog();
  const cached = catalog.data?.flat.find((p) => p.id === id) ?? null;

  const single = useQuery<Product | null>({
    queryKey: ['single-item', id],
    enabled: !!id && !catalog.isLoading && !cached,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await client.post<ApiItem | { data?: ApiItem }>('/get-single-item', {
        id: Number(id),
      });
      const row = data && 'id' in data ? (data as ApiItem) : (data as { data?: ApiItem })?.data;
      return row ? mapItem(row) : null;
    },
  });

  if (cached) return { ...catalog, data: cached as Product | null };
  return single;
}
