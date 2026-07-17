# Part 1 — HTML → React conversion

SRI AADHYA FROZENS storefront, converted from the static HTML reference to
React 18 + TypeScript + Vite. Every page runs on inline stub data; **no HTTP
calls are made in this part** (Part 2 wires the backend).

The original HTML lived at the repo root and has been **removed** — it was the
specification for this build and is preserved in git history (commit `93b0f0b`
and earlier) if you ever need to diff against it.

---

## HTML inventory

| HTML file | React route | Layout | Page component |
|---|---|---|---|
| `index.html` | `/` | Blank | `SplashPage` |
| `location.html` | `/location` | Blank | `LocationPage` |
| `login.html` | `/login` | Blank | `LoginPage` |
| `home.html` | `/home` | Root | `HomePage` |
| `category.html` | `/category` | Root | `CategoryPage` |
| `product.html` | `/product/:id` | Root | `ProductPage` |
| `cart.html` | `/cart` | Root | `CartPage` |
| `coupon.html` | `/coupon` | Root | `CouponPage` |
| `orders.html` | `/my-orders` | Root | `OrdersPage` |
| `tracking.html` | `/tracking` | Root | `TrackingPage` |
| `profile.html` | `/profile` | Root | `ProfilePage` |
| `address.html` | `/address` | Checkout | `AddressPage` |
| `payment.html` | `/payment` | Checkout | `PaymentPage` |
| `payment-processing.html` | `/payment-processing` | Blank | `PaymentProcessingPage` |
| `payment-failed.html` | `/payment-failed`, `/payment-failure` | Blank | `PaymentFailedPage` |
| `order-success.html` | `/order-success`, `/view-order/:uniqueOrderId` | Blank | `OrderSuccessPage` |
| `not-serviceable.html` | `/not-serviceable` | Blank | `NotServiceablePage` |
| `assets/css/styles.css` | → `src/index.css` | — | — |
| `assets/js/data.js` | → `src/api/_seed.ts` | — | — |
| `assets/js/app.js` | → stores + `shared/` chrome + utils | — | — |
| `assets/js/animations.js` | → `cards/` + `utils/confetti.ts` | — | — |
| `assets/images/logo*.png` | → `public/images/` | — | — |

`index.html` at the repo root is the **Vite app shell** — a separate file from
the splash page it replaced. The splash page's body content lives in
`SplashPage.tsx`.

`*` → `Navigate replace /`.

---

## Notable conversion decisions

**Splash has no auto-redirect.** `index.html` gates on a "Get Started" link to
`location.html`; there is no timer in the source. `SplashPage` links to
`/location` the same way.

**No Footer.** `app.js`'s `renderFooter()` returns `""` with the comment
"Footer removed per request — no content rendered at the bottom of any page."
`RootLayout` and `CheckoutLayout` mount Header + BottomNav + WhatsApp only.

**Storage namespace moved `dittomart_` → `sriaadhya_`.** `utils/storageKeys.ts`
runs `migrateLegacyStorage()` at import time in `App.tsx`, copying legacy keys
into the new namespace only where the new key is absent, guarded by a
`sriaadhya_migrated_v1` flag. Every persisted Zustand store is `version: 2`.

**Location gate is soft everywhere.** The HTML redirected to `login.html` when
no location was set. That check is now the natural flow (Splash → Location →
Home) rather than a per-page bounce; browsing out-of-zone stays allowed, and
the delivery-radius restriction is enforced at checkout, matching the source's
`serviceableGate()` boundary.

**Hard gate on `/address` and `/payment`** (redirect to `/login?next=…`) —
these are the pages `serviceableGate()` protected.

**`Address.state` added.** The HTML's address object has no `state` field, but
the backend returns it and GST depends on it. Defaulted to `'Tamil Nadu'`.

**Icons are 1:1 with `data-lucide`.** Every `<i data-lucide="X">` became
lucide-react's `<X />`. No substitutions were made.

**Animations ported verbatim.** All `@keyframes` from `styles.css` plus every
page's inline `<style>` block are in `src/index.css`, applied to the same
elements: `fadeUp`, `pop`, `floaty`, `spinSlow`, `shimmer`, `pulseRing`,
`truckMove`, `bounceIn`, `confettiFall`, `leafSway`, `kenburns`,
`gradientShift`, `blobMove`, `shine`, `floatSlow`, `risePop`, `ringExpand`,
`leafDrift`, `leafBreeze`, `tickerScroll`, `splashLoad`, `slideUp`, `bnrIn`,
`bnrZoom`, `bnrShine`, `bnrSway`, `bnrSpin`, `bnrFloat`, `bnrBadge`, `bsSlide`,
`vanBob`, `wheelSpin`, `roadMove`, `gridDrift`, `dashMove`, `bobie`,
`glowPulse`, `popCheck`.

**`useReveal` uses a MutationObserver.** `app.js`'s `initReveal()` ran once
after DOM-ready, when everything was already in the document. In React, lazily
mounted sections and re-rendered grids appear after that pass, so a one-shot
observer left them stuck at the `.io` class's `opacity: 0`. The hook now picks
up `.io` nodes as they mount.

**`Toast` maps icons explicitly.** A namespace import (`import * as icons`) to
resolve `toast(msg, kind, 'shopping-bag')` dynamically pulled all of
lucide-react into the main chunk (994 kB). The 14 icons `app.js` actually
passes are now an explicit map — main chunk is 230 kB (gzip 74 kB).

---

## Structure

```
src/
├── api/
│   ├── client.ts            axios placeholder — Part 2 wires it
│   ├── _seed.ts             verbatim port of assets/js/data.js  ← delete after Part 2
│   └── queries/catalog.ts   stub useQuery hooks, all marked TODO[part-2]
├── store/                   appStore, authStore, cartStore, couponStore, locationStore
├── hooks/                   useToast, useReveal
├── utils/                   fmt, geo, storageKeys, normalizePhone, sanitizeHtml,
│                            placeholders, confetti, orderId
├── shared/                  Header, BottomNav, WhatsApp, Toast, StoreHoursModal,
│                            SmartImage, FoodMark, Stars, LiveLeaf, ErrorBoundary
├── layouts/                 RootLayout, CheckoutLayout, BlankLayout
├── cards/                   ProductCard, CategoryTile
├── sections/home/           BrandBanner, BrandStrip
├── ui/                      DotLoader, SkeletonCard
├── pages/                   17 pages, all lazy-loaded
├── types/                   all shared types
├── App.tsx                  Router + ErrorBoundary + migrateLegacyStorage()
└── main.tsx                 QueryClient + Toast mount
```

---

## Verified

Driven in Chromium via Playwright at 1280×900 and 320×720:

- Splash → Location (area search + capture) → Home → Category (filters) →
  Product (variant switch) → Cart (coupon apply/reject) all work
- Cart maths match the HTML: ₹700 items + ₹27 delivery (3 km × ₹9) + ₹35 tax
  (5%) = ₹762; BLOSSOM −₹105 → ₹652
- All 17 routes render
- Header fits 320px with no horizontal overflow (`scrollWidth === clientWidth`)
- Zero console errors, zero pageerrors, zero hooks-order warnings
- `tsc -b` and `npm run build` pass clean

---

## TODO[part-2]

Marked at every replaceable call site:

- `src/api/queries/catalog.ts` — all 7 hooks return seed data
- `src/pages/HomePage.tsx` — bestsellers list
- `src/pages/ProductPage.tsx` — product fetch by id
- `src/pages/PaymentProcessingPage.tsx` — the simulated gateway outcome
  (10% store-closed, then 80% success) becomes the real PayU return
- `src/pages/TrackingPage.tsx` — the 5s-per-step demo advance becomes the
  order's real `statusId`
- `src/utils/orderId.ts` — the backend issues the real unique order id
- `src/shared/ErrorBoundary.tsx` — forward to error reporting
- `src/utils/sanitizeHtml.ts` — wire into `useGetBrandPolicies`
- Delete `src/api/_seed.ts` once the endpoints are live

## Blockers / notes

- **`home-banner.png` was never in the reference.** `home.html` referenced
  `assets/images/home-banner.png` with an `onerror="this.remove()"` fallback,
  and the file did not exist. `BrandBanner` keeps the same optional overlay —
  drop the artwork at `public/images/home-banner.png` and it appears; without
  it, the CSS recreation renders, exactly as the HTML behaved.
- **`assets/images/products/` was empty.** All catalog images load from the
  Unsplash CDN via `_seed.ts`, as in the HTML. `SmartImage` falls back to the
  branded SVG placeholder (ported from `app.js`'s `IMG_FALLBACK`) on any dead
  URL.
- **React Router v6 emits `v7_startTransition` / `v7_relativeSplatPath`
  future-flag warnings.** Harmless; worth opting into the flags in Part 2.
- **`npm audit` reports 2 vulnerabilities (1 moderate, 1 high)** in the
  transitive dev tree. Not addressed here — a forced fix pulls breaking major
  bumps into the fixed stack.
