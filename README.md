# SRI AADHYA FROZENS — storefront

React 18 + TypeScript + Vite, running on the Dittomart backend.

## Run it

```bash
npm install
cp .env.example .env    # already filled in for the live store
npm run dev
```

## Environment

| Var | What it is |
|---|---|
| `VITE_API_BASE_URL` | API root, including the `/public/api` suffix |
| `VITE_BRAND_DOMAIN` | **bare** domain — must equal `brands.domain` in the DB (`app.sriaadhya.in`) |
| `VITE_PAYU_FORM_URL` | PayU's form host; the backend's own `gatewayUrl` wins when it sends one |
| `VITE_GOOGLE_MAPS_API_KEY` | optional — address search falls back to `/coordinate-to-address` |

`VITE_BRAND_DOMAIN` is the one that bites: it is matched against the `brands`
table, not against where the app is hosted. Get it wrong and `/brands` returns an
empty list and the app can't boot.

## Scripts

```bash
npm run dev        # vite, port 5173
npm run build      # tsc -b && vite build
npm run typecheck  # tsc -b --noEmit
```

## Layout

```
src/
├── api/
│   ├── client.ts        axios + dual-auth interceptor + assetUrl
│   ├── queries/         useInit, useCatalog, useOrders, useCoupons, useWallet, usePaymentGateways
│   └── mutations/       useAuth, useAddresses, useCheckout, usePayu
├── store/               app, auth, cart, coupon, location (zustand + persist)
├── hooks/               useOrderTotals (the one source of truth for money), useToast, useReveal
├── utils/               productPricing, placeOrderBody, storeHours, geo, fmt, sanitizeHtml, storageKeys
├── shared/              Header, BottomNav, WhatsApp, Toast, SmartImage, PolicyModal, StoreHoursModal
├── layouts/             Root, Checkout, Blank
├── pages/               17 pages, lazy-loaded
├── AppInit.tsx          resolves brand + store before anything renders
└── App.tsx              router
```

## Two things to know before changing anything

**Prices live on addons, not on items.** Every item on this store carries
`price: "0.00"`; the real money is on a SINGLE addon group. Always resolve a
price through `getDisplayPrice(product)` — reading `product.price` renders ₹0.

**`useOrderTotals()` is the only place money is computed.** The cart and the
payment screen both read it, so they cannot disagree, and the `distanceKm` it
returns is the exact `dis` value `/place-order` is given.

See [PART2_CHANGELOG.md](PART2_CHANGELOG.md) for what's wired, what isn't, and
why.
