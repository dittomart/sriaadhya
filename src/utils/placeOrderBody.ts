import { clientPlatform } from '@/api/client';
import type { Address, AuthUser, CartLine } from '@/types';

export interface PlaceOrderInput {
  lines: CartLine[];
  restaurantId: number;
  user: AuthUser;
  authToken: string;
  address: Address;
  /** the gateway code, case exactly as the backend gave it, or 'WALLET' */
  method: string;
  /** 1 = delivery, 2 = takeaway */
  deliveryType: 1 | 2;
  useWallet: boolean;
  walletCoversAll: boolean;
  walletBalance: number;
  /** km, verbatim from /get-deliverable-amount */
  distanceKm: number;
  couponCode?: string | null;
  orderComment?: string;
  /** true when an online gateway will collect payment after the order is placed
      — the backend then creates it "awaiting payment" instead of settling it.
      COD and WALLET leave this false. */
  pendingPayment?: boolean;
}

export function buildPlaceOrderBody(input: PlaceOrderInput): Record<string, unknown> {
  const {
    lines,
    restaurantId,
    user,
    authToken,
    address,
    method,
    deliveryType,
    useWallet,
    walletCoversAll,
    walletBalance,
    distanceKm,
    couponCode,
    orderComment,
    pendingPayment,
  } = input;

  /* `price` is the RAW item price, not the line's unit price: the backend adds
     the addons itself from `selectedaddons`. Sending the folded unit price here
     would charge every variant twice. */
  const order = lines.map((l) => ({
    id: Number(l.productId),
    restaurant_id: restaurantId,
    name: l.name,
    quantity: l.qty,
    price: l.basePrice,
    selectedaddons: l.customizations.map((c) => ({
      addon_id: c.addonId,
      addon_category_name: c.groupName,
      addon_name: c.addonName,
      price: c.price,
    })),
    commission_type: 'above_menu',
    excess_type: null,
    item_commission: 0,
    excess_price: 0,
    tax_percentage: 0,
  }));

  const defaultAddress = {
    house: address.houseNo ?? '',
    address: address.street ?? '',
    latitude: address.latitude,
    longitude: address.longitude,
    tag: address.label ?? 'Home',
    city: address.city ?? '',
    state: address.state ?? '',
    pincode: address.pincode ?? '',
  };

  return {
    order,
    user: {
      data: {
        id: Number(user.id),
        auth_token: authToken,
        name: user.name,
        email: user.email ?? '',
        phone: user.phone,
        default_address_id: user.defaultAddressId ?? null,
        default_address: defaultAddress,
        wallet_balance: walletBalance,
        avatar: user.avatar ?? null,
        tax_number: null,
      },
    },
    /* Both naming conventions: the fork reads lat/lng in one place and
       latitude/longitude in another. */
    location: {
      lat: address.latitude,
      lng: address.longitude,
      latitude: address.latitude,
      longitude: address.longitude,
      address: address.street ?? '',
      house: address.houseNo ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      pincode: address.pincode ?? '',
      tag: address.label ?? 'Home',
      landmark: address.landmark ?? '',
    },
    method,
    delivery_type: deliveryType,
    partial_wallet: useWallet && !walletCoversAll && walletBalance > 0,
    pending_payment: pendingPayment ?? false,
    order_comment: orderComment ?? '',
    client_platform: clientPlatform(),
    /* Where the gateway must return the customer after payment. The backend
       reads this FIRST (over Origin/Referer), and a cross-site POST strips the
       Origin header — so without it, an online order falls back to the brand's
       registered domain and lands the paid customer on whatever is (or isn't)
       hosted there. Send this app's own origin so they come back here. */
    domain: typeof window !== 'undefined' && window.location?.origin ? window.location.origin : undefined,
    /* DISTANCE in km — not a discount, whatever the name suggests. The backend
       recomputes the delivery charge from it, so it must be the same number
       /get-deliverable-amount quoted the fee against. */
    dis: distanceKm,
    tipAmount: 0,
    deliveryMethod: 'Instant',
    token: authToken,
    ...(couponCode ? { coupon: { code: couponCode } } : {}),
  };
}
