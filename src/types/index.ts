export type FoodType = 'veg' | 'non-veg' | 'other';

export interface Brand {
  name: string;
  tagline: string;
  slogan: string;
  about: string;
  city: string;
  area: string;
  radiusKm: number;
  deliveryTime: number;
  minOrder: number;
  freeDeliveryAbove: number | null;
  deliveryNote: string;
  baseDeliveryPerKm: number;
  whatsapp: string;
  phone: string;
  rating: number;
  reviewCount: number;
  storeLat: number;
  storeLng: number;
  isDemo: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  tone: string;
  img: string;
}

export interface Variant {
  label: string;
  price: number;
}

export interface Product {
  id: string;
  catId: string;
  name: string;
  price: number;
  mrp: number;
  foodType: FoodType;
  unit: string;
  img: string;
  rating: number;
  reviews: number;
  orderedTimes: number;
  bestseller: boolean;
  trending: boolean;
  inStock: boolean;
  desc: string;
  variants: Variant[] | null;
}

export type CouponType = 'flat' | 'pct';

export interface Coupon {
  type: CouponType;
  value: number;
  min: number;
  max?: number;
  label: string;
}

export interface Testimonial {
  name: string;
  area: string;
  stars: number;
  text: string;
}

export type StoreHours = Record<string, string>;

/** A line in the cart. `key` is id or `id__variantLabel` — matches app.js addToCart. */
export interface CartLine {
  key: string;
  id: string;
  name: string;
  price: number;
  img: string;
  foodType: FoodType;
  qty: number;
  unit: string;
}

export interface UserLocation {
  area: string;
  latitude: number;
  longitude: number;
  pincode: string;
  serviceable: boolean;
  distance_from_store_km: number;
  accuracy_m?: number | null;
  source?: string;
}

export interface Address {
  id: string;
  label: string;
  receiver_name: string;
  phone: string;
  house_no: string;
  building: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  is_serviceable: boolean;
  created_at: string;
}

export interface AuthUser {
  loggedIn: boolean;
  name: string;
  phone: string;
}

export interface Bill {
  sub: number;
  disc: number;
  del: number;
  tax: number;
  total: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  img: string;
  foodType: FoodType;
  unit: string;
}

export type OrderStatus = 'Placed' | 'Accepted' | 'Packed' | 'Out for Delivery' | 'Delivered';

export interface Order {
  id: string;
  items: OrderItem[];
  bill: Bill;
  status: OrderStatus;
  placedAt: string;
  eta: number;
  address: Address | { label: string; street: string };
  payMethod: string;
}

export type PayMethod = 'upi' | 'card' | 'wallet';
