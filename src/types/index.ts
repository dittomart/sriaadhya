/* The shapes this app works in. Everything here is what the backend gives us,
   already mapped — the raw `Api*` interfaces live next to their query hooks. */

/** The backend ships `is_veg` as null on this store's whole catalog, so 'other'
    is what an unset flag maps to — the mark still renders, it just isn't a claim. */
export type FoodType = 'veg' | 'non-veg' | 'other';

export interface Brand {
  id: number;
  uniqueId: string;
  name: string;
  description: string;
  logo: string;
  heroImage: string;
  domain: string;
  phone: string;
  whatsapp: string;
}

export interface StoreLocation {
  id: number;
  restaurantId: number;
  name: string;
  slug: string;
  uniqueSlug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  phone: string;
  whatsapp: string;
  latitude: number;
  longitude: number;
  /** km; 0 means the store hasn't configured one — don't gate on it */
  deliveryRadius: number;
  deliveryCharge: number;
  minOrder: number;
  freeDeliveryAbove: number;
  /** minutes */
  deliveryTime: number;
  taxPercent: number;
  taxEnabled: boolean;
  /** the runtime open/closed bit — NOT an approval flag */
  isActive: boolean;
  isSchedulable: boolean;
  /** 1 = force open, 0 = force closed, null = no override */
  scheduleOverride: number | null;
  hours: Record<string, [string, string]>;
  image: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface AddonOption {
  id: number;
  name: string;
  price: number;
}

export interface AddonGroup {
  id: number;
  name: string;
  /** SINGLE groups are variant pickers and carry the item's real price */
  type: 'SINGLE' | 'MULTIPLE';
  limit: number;
  options: AddonOption[];
}

export interface Product {
  id: string;
  catId: string;
  categoryName: string;
  restaurantId: number;
  name: string;
  desc: string;
  /** the item row's own price — 0 for every variant-priced item on this store */
  price: number;
  mrp: number;
  img: string;
  foodType: FoodType;
  isRecommended: boolean;
  isPopular: boolean;
  isNew: boolean;
  /** the card's ribbon — recommended OR popular, the two flags the admin sets */
  bestseller: boolean;
  addonGroups: AddonGroup[];
}

/** One chosen addon on a cart line. */
export interface Customization {
  groupId: number;
  groupName: string;
  addonId: number;
  addonName: string;
  price: number;
}

export interface CartLine {
  /** productId + the chosen addon ids — the merge key */
  lineId: string;
  productId: string;
  name: string;
  img: string;
  foodType: FoodType;
  /** the item row's raw price — what /place-order wants in `price` */
  basePrice: number;
  /** basePrice (or the variant total) + extras — what the customer pays per unit */
  unitPrice: number;
  qty: number;
  customizations: Customization[];
}

export interface UserLocation {
  address: string;
  area: string;
  lat: number;
  lng: number;
  serviceable: boolean;
  distanceKm: number;
}

export interface Address {
  id: string;
  label: string;
  receiverName: string;
  phone: string;
  houseNo: string;
  street: string;
  landmark: string;
  city: string;
  /** the backend returns it and GST depends on it — never drop this */
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  /** the backend's own "do we deliver here" verdict (`is_operational`) — never
      a client-side distance guess */
  isDeliverable: boolean;
}

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  email?: string;
  wallet: number;
  defaultAddressId: number | null;
  avatar: string | null;
}

export type CouponType = 'flat' | 'pct';

export interface Coupon {
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  canBeApplied: boolean;
}

/** Mirrors getOrderStatusName() in the backend's helpers.php — the
    authoritative map, which differs from the one the API guide documents. */
export type OrderStatus =
  | 'placed'
  | 'awaiting-payment'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'payment-failed'
  | 'cancelled';

export interface OrderItem {
  /** the catalog item id — what a reorder puts back in the cart */
  id: string;
  /** the orderitem row's own PK; two sizes of one item share `id` and `name` */
  rowId: string;
  name: string;
  img: string;
  qty: number;
  /** basePrice + Σ addon price — a variant-priced row carries 0 in `price` alone */
  unitPrice: number;
  basePrice: number;
  customizations: Customization[];
}

export interface Order {
  /** the unique_order_id — what every route and the tracker key off */
  id: string;
  /** the numeric PK — what /payment/payu/create-order wants */
  orderId: number;
  statusId: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode: string;
  deliveryCharge: number;
  tax: number;
  total: number;
  paymentMode: string;
  address: string;
  placedAt: string;
  /** minutes, from the store's own delivery_time */
  etaMin: number;
}

export interface WalletTransaction {
  id: number;
  /** rupees — the API ships paise here */
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: string;
}

export interface PaymentGateway {
  id: number;
  /** case exactly as the backend gave it — /place-order round-trips this */
  code: string;
  name: string;
  description: string;
  logo: string;
}
