# Part 2 — API wiring

The storefront now runs on the live Dittomart backend. `_seed.ts` is gone; every
screen reads real data.

**Brand:** Sri Aadhya (id 14, `unique_id: sriaadhya`, domain `app.sriaadhya.in`)
**Store:** SRIAADHYA, Avinashi (restaurant 617, slug `sriaadhya`)
**API:** `https://app.dittomart.in/public/api`

Nothing in the backend was touched.

---

## What the live catalog actually looks like

This shaped most of the decisions below, so it's worth stating plainly:

| Fact | Consequence |
|---|---|
| **All 94 items carry `price: "0.00"`** — the real price lives on a SINGLE addon group (`Weight` → `1 Kg` → ₹120) | Reading `item.price` renders a wall of ₹0. `getDisplayPrice` resolves the cheapest variant instead. |
| **Every addon group is SINGLE, one option each** | The variant picker renders, but there's nothing to choose yet — so the card's ADD button adds directly rather than bouncing to the PDP. |
| **`is_recommended` / `is_popular` / `is_new` are `0` on every item** | The "Fresh picks" shelf would be empty. It falls back to one item per category so the home page shows the menu instead of a hole. |
| **`is_veg` is `null` on every item** | The veg/non-veg filter has no data to filter on and was dropped. The food mark still renders as 'other' — an unset flag isn't a claim either way. |
| **4 items have no price at all** (Veg Butter, Paneer, Mozzarella Diced Cheese -g, Peanut Butter Creamy) | They show "Price on request" with no ADD button. Selling them at ₹0 would be the store's loss. |
| **`schedule_data` is null, `is_schedulable: 0`** | Open/closed answers from `is_active` — the admin runs this store by hand, which is what that combination means. |
| **`delivery_radius: 20`, `min_order_price: 0`, `tax_percentage: 0`** | No minimum-order gate, no tax row, 20 km zone — all read live, none hardcoded. |

---

## Endpoints wired

| Endpoint | Hook | Notes |
|---|---|---|
| `GET /brands?domain=` | `useGetBrands` | boot; fails fast (retry 0, 8s timeout) |
| `POST /brand-locations/{id}` | `useGetLocations` | writes the store into zustand **inside the queryFn** |
| `GET /brand/{domain}/policies` | `useGetBrandPolicies` | sanitised at the data boundary |
| `POST /generate-otp-for-login` | `useGenerateOtp` | 5-way flag decision tree |
| `POST /login-with-otp` | `useVerifyOtp` | seeds the pin from `default_address` |
| `POST /delete-user-account` | `useDeleteAccount` | cleanup in `onSettled` |
| `POST /coordinate-to-address` | `useCoordinateToAddress` | plain-string response |
| `POST /get-addresses` | `useGetAddresses` | array **or** `{data}` |
| `POST /save-address` | `useSaveAddress` | sends every key; `id` + `address_id` on edit |
| `POST /delete-address` | `useDeleteAddress` | |
| `POST /get-deliverable-amount` | inside `useOrderTotals` | the pricing oracle |
| `POST /get-meats-categories` | `useGetCategories` | |
| `POST /get-restaurant-items/{slug}` | `useGetCatalog` | master catalog |
| `POST /get-single-item` | `useGetProduct` | only when the PDP is the entry point |
| `GET /restaurant-sliders/{slug}` | `useGetSliders` | |
| `POST /get-cart-coupon` | `useGetCoupons` | |
| `POST /apply-coupon` | `useApplyCoupon` | body field is `coupon`, not `code` |
| `POST /get-payment-gateways` | `useGetPaymentGateways` | code case preserved |
| `POST /check-ban` | `checkBan` | fails open |
| `POST /place-order` | `usePlaceOrder` | depth-6 response search |
| `POST /payment/payu/create-order` | `useCreatePayuOrder` | |
| `POST /brand/{slug}/get-orders` | `useGetOrdersInfinite` | paginator **or** bare array |
| `POST /update-user-info` | `useTrackOrder` | the tracker, misleading name and all |
| `POST /get-wallet-transactions` | `useGetWallet` | balance ₹, transactions paise |

---

## Decisions worth knowing

**The order-status map came from the backend, not the API guide.** The guide
documents `3 = preparing`, `8 = pending`. `getOrderStatusName()` in the backend's
`helpers.php` says `3 = Delivery Assigned`, `8 = Awaiting Payment`,
`9 = Payment Failed`. Following the guide would have shown a failed payment as
"pending". The code follows the backend.

**Token travels in the header AND the body, globally.** The legacy endpoints
(`/place-order`, `/get-orders`, `/update-user-info`) only read the body. The
request interceptor injects it into every authed POST/PUT so no endpoint has to
remember.

**`dis` on `/place-order` is DISTANCE in km**, verbatim from
`/get-deliverable-amount`. The backend recomputes the delivery charge from it —
a client-side haversine would produce a charge the customer never saw.

**A guest is never quoted ₹0 delivery.** `/get-deliverable-amount` sits behind
`jwt.auth`, so a signed-out cart cannot know the fee. It reads "At checkout"
rather than "₹0", which would look like free delivery and then surprise them.

**`storeLocation` is never persisted.** Its `is_active` bit decides whether the
store takes orders at all; a cached snapshot would keep selling for a store the
admin closed minutes ago.

**Wallet is a toggle, not a radio.** On + covers the bill → it becomes the method
and the gateway list disappears. On + doesn't cover → `partial_wallet: true` and
the gateways collect the rest. `method: 'WALLET'` with `partial_wallet: true` is
incoherent and can't be produced from the UI.

**Post-order routing trusts `payment_mode` from the response** before the local
`walletCoversAll` flag, which can flip if the balance query refetches mid-flight.

**PayU posts to the backend's `gatewayUrl`** when it sends one — its test/prod
switch. Hardcoding the prod host would send a test-mode hash to the wrong place.

**`domain` is sent on `/place-order`** — a cross-site gateway POST strips the
Origin header, and without it the backend bounces the paid customer to the
brand's registered domain rather than back here.

**Login has no demo OTP.** The only way past that screen is a real code.

**The delivery-zone gate lives in this app, because nothing else has one.**
`/place-order` does not check the radius — it only uses `dis` to price the
delivery. `checkOperation()` (the backend's own zone check) runs in exactly one
place a storefront can reach: `/get-addresses`, and only when the request
carries `restaurant_id`. So that call sends it, and every saved address comes
back stamped `is_operational` — the backend's verdict, run through the same
logic its admin panel uses (delivery areas when configured, else
`distance <= delivery_radius`). The app gates on that answer rather than
re-deriving the distance itself, where a rounding difference could let through
an address the backend would refuse.

`enable_delivery_radius: 0` on this store is **not** "radius off" — it only
applies when delivery *areas* are configured. With none set, the else branch
runs `distance <= delivery_radius` unconditionally, so the 20 km limit is live.

The haversine in `utils/geo.ts` is used only for the pin hint on /location and
/address, where there is no saved address to ask about yet. It is a preview,
never the gate.

---

## Bugs found while verifying

- **Duplicate React key on the home shelf** — my own: the "one per category"
  fallback concatenated items already in `flat`. Deduped by id.
- **Order rows collide on `key`** when the same item is bought in two sizes —
  they share `item_id` and `name`. `OrderItem` now carries `rowId` (the
  orderitem's own PK).
- **`useReveal` only observed nodes present on its first run** (carried from
  Part 1) — lazily-mounted sections stayed at `opacity: 0`. Now uses a
  MutationObserver.

---

## Verified against the live API

Driven in Chromium (Playwright) at 1280×900 and 320×720:

- Brand, logo, store phone, city, delivery time, 6 categories, 94 items — all live
- Prices resolve through the variant: Baby Corn ₹120, Okra ₹1,525, Ghee ₹600 — **no ₹0 cards**
- The 4 unpriced rows show "Price on request" with **no ADD button**
- PDP ₹120 → cart item total ₹120 → To Pay ₹120
- Guest delivery reads "At checkout", never ₹0
- Header fits 320px, no horizontal overflow
- **Zero console errors, zero failed API calls**
- `tsc --noEmit` and `npm run build` pass clean

---

## Payment — confirmed working

OTP login, order placement and the PayU handoff were tested against production
with a real account: the hash is accepted, the order is created, PayU's checkout
opens with the right amount.

**PayU's return needs the app deployed at the order's origin.** The backend saves
`redirect_base` per order (from the `domain` field this app sends, else the
brand's registered domain) and sends the customer to
`{redirect_base}/running-order/{id}` on success, `{redirect_base}/my-orders` on
cancel. An order placed from `localhost` returns to localhost; one placed from
`app.sriaadhya.in` returns there — where a **different, older app is currently
deployed**, which is why cancelling appeared to do nothing. Replacing that
deployment with this build fixes it.

`public/.htaccess` ships with the build for the same reason: those return URLs
are client-side routes, and a static host answers 404 without the SPA rewrite —
payment succeeds, customer sees a dead page.

**PhonePe** is wired through the backend's `/phonepe/pay/{id}` bridge rather than
a direct redirect: PhonePe matches the Referer origin against the merchant's
onboarding URL, and anything else gets INTERNAL_SECURITY_BLOCK_1. It renders as
a tap-to-open card — a `window.open` not tied to a real tap is what browsers
block.

## Still unproven

- **Wallet** — the test account has no balance to spend
- **Coupons** — none are configured on this store yet
- **PhonePe end-to-end** — wired to spec, not yet run against a live payment
- **Tracking poll** — needs an order to follow through to delivery

## Open items

- `/promo-slider` isn't wired — the design has no slot for it. `/restaurant-sliders`
  is wired, and the store has uploaded none.
- `useGetStoreConfig` is not implemented — no consumer needs it.
- Order details deep-links scan the order pages until they hit the id; there is
  no by-id endpoint. Fine at this store's volume.
- `npm audit` reports 2 vulnerabilities in the transitive dev tree. A forced fix
  pulls breaking majors into the fixed stack.
