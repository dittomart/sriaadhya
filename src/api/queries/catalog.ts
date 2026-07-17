import { useQuery } from '@tanstack/react-query';
import { BRAND, categories, coupons, products, storeHoursDisplay, testimonials } from '@/api/_seed';
import type { Brand, Category, Coupon, Product, StoreHours, Testimonial } from '@/types';

/* Every hook here returns inline stub data shaped to match the eventual API
   response. No HTTP happens in Part 1. */

export function useGetBrand() {
  return useQuery<Brand>({
    // TODO[part-2]: replace stub data with real GET /brands?domain= call
    queryKey: ['brand'],
    queryFn: async () => BRAND,
  });
}

export function useGetCategories() {
  return useQuery<Category[]>({
    // TODO[part-2]: replace stub data with real GET /categories call
    queryKey: ['categories'],
    queryFn: async () => categories,
  });
}

export function useGetProducts() {
  return useQuery<Product[]>({
    // TODO[part-2]: replace stub data with real GET /items call
    queryKey: ['products'],
    queryFn: async () => products,
  });
}

export function useGetProduct(id: string | undefined) {
  return useQuery<Product | null>({
    // TODO[part-2]: replace stub data with real GET /items/:id call
    queryKey: ['product', id],
    queryFn: async () => products.find((p) => p.id === id) ?? null,
    enabled: !!id,
  });
}

export function useGetCoupons() {
  return useQuery<Record<string, Coupon>>({
    // TODO[part-2]: replace stub data with real GET /coupons call
    queryKey: ['coupons'],
    queryFn: async () => coupons,
  });
}

export function useGetTestimonials() {
  return useQuery<Testimonial[]>({
    // TODO[part-2]: replace stub data with real GET /testimonials call
    queryKey: ['testimonials'],
    queryFn: async () => testimonials,
  });
}

export function useGetStoreHours() {
  return useQuery<StoreHours>({
    // TODO[part-2]: replace stub data with real GET /store-hours call
    queryKey: ['store-hours'],
    queryFn: async () => storeHoursDisplay,
  });
}
