# SRIAADHYA — Hyperlocal Web Store (Prototype v1)

**Tagline:** Innovation in Everyday Essentials · *Bloom Like a Blossom*
**Location:** Avinashi, Tirupur · 10 km radius · 30-min delivery

---

## ⚠️ DEMO MODE ACTIVE
This website was built with **sample products** because no bestseller / product
details were supplied during intake. Categories used are the **real** ones the
merchant provided.

- **What's real:** Brand name, logo, colours (logo-derived), fonts, layout,
  category list, location, contact info, delivery rules.
- **What's demo:** Individual product names, prices and images.

Replace demo data via the DittoMart SaaS dashboard once onboarding is complete,
then re-run the build with `PRODUCTION_BUILD: true` to drop the DEMO badge,
footer disclaimer and this notice (theme stays identical).

---

## 🚀 Setup
1. Extract the ZIP.
2. Double-click **`index.html`** — it opens in any modern browser.
3. No build step, no server, no npm. Works 100% offline (only Tailwind / Lucide /
   Google Fonts load from their CDNs).

---

## 🎨 Design Decision

| | |
|---|---|
| **Category** | Frozen Foods / Ready-to-Cook & Fresh Grocery (multi-category food products) |
| **DNA** | Grocery / Fresh-Food — greens, earthy, citrus accents |
| **Variant influence** | G3 "Modern Mart" (Zepto-style clean) re-coloured from the logo |
| **Selection reason** | Logo extraction — the logo is dominantly forest-green + emerald, so the palette is logo-derived (brand comes first) |
| **Layout pattern** | Pattern A "Classic Carousel" hero + visual category grid |
| **Color palette** | Forest `#0B4D2C` · Green `#15803D` · Fresh `#22C55E`/`#4ADE80` · Cream `#F6F9F2` |
| **Unique accent** | Mustard `#E1AD01` (offers / savings) + Coral `#FF6B5B` (discount tags) |
| **Font pairing** | **Bricolage Grotesque** (display) + **Plus Jakarta Sans** (body) |
| **Section order** | Hero → Buy Again → Categories → Bestsellers → Testimonials |

*Rationale (3 lines):* The aesthetic is fresh, modern and trustworthy — built on
the merchant's own green logo so the brand reads instantly. Bricolage Grotesque
gives a confident, contemporary headline voice while Plus Jakarta Sans keeps body
text clean and bilingual-ready. Mustard + coral accents add appetite and urgency
without breaking the fresh-grocery DNA.

---

## 📁 Folder Structure
```
sriaadhya-website/
├── index.html               Splash → routes to location or home
├── location.html            Location gate (GPS / search, lat-lng capture) — BLOCKING
├── not-serviceable.html     Out-of-10km-area screen
├── home.html                Homepage (hero, categories, buy-again, bestsellers, testimonials)
├── category.html            Category + product list (sort, filter, food-type chips)
├── product.html             Product detail (gallery, variants, qty, FBT)
├── cart.html                Cart review + coupon + bill
├── coupon.html              All offers / coupons
├── address.html             Address list + add-new (lat/lng mandatory)
├── login.html               Phone + OTP (demo OTP 123456)
├── payment.html             UPI / Card / Wallet (no COD)
├── payment-processing.html  Gateway simulation
├── payment-failed.html      Failure / store-closed + retry
├── order-success.html       Confirmation + confetti + save-to-favorites
├── tracking.html            Live timeline + partner card + map + reorder
├── orders.html              Order history + 1-tap reorder
├── profile.html             Wallet, favorite orders, veg toggle, addresses, logout
└── assets/
    ├── css/styles.css       Design system + all animations
    ├── js/data.js           Brand config, categories, products, coupons, testimonials, store hours
    ├── js/app.js            Cart, auth, location gate, header/nav/footer, toast, helpers
    ├── js/animations.js     Confetti + product/category card renderers + skeletons
    └── images/logo.png      Brand logo (favicon + header)
```

---

## 🧭 Page Purposes (customer journey)
`index → location → home → category → product → cart → (coupon) → address →
login → payment → processing → success → tracking → orders / profile`

The **Location Gate** runs at the top of every protected page: if
`dittomart_location` has no lat/lng it redirects to `location.html`; if not
serviceable it redirects to `not-serviceable.html`. There is **no skip / browse
-without-location** option (hyperlocal requirement).

---

## 🛠 Tech Stack
- HTML5 (semantic) · Tailwind CSS (CDN) · Lucide icons (CDN) · Google Fonts
- Vanilla JavaScript only — no frameworks
- `localStorage` for cart, auth, location, addresses, orders, food-filter
- URL params for product id (`?id=`) and category (`?cat=`, `?q=`)

---

## ✅ Built-in business rules
- **No subscriptions** — repeat behaviour is via Buy Again / Reorder / Favorite Orders.
- **No COD** — UPI first (TN preference), then Card, then Wallet.
- **Lat/Lng mandatory** on every address — Save stays disabled until captured &
  serviceable. GPS detect + search only (no draggable map).
- **Store timing is backend-owned** — frontend shows a static Store Hours modal
  (footer link) and a graceful "store unavailable" error at checkout (simulated
  ~10% at processing). No status pill, no countdowns.
- **Veg / Non-Veg / Other** FSSAI marks on cards, detail, cart, summary; filter
  chips on category page; "Veg only" preference in Profile.
- **Mobile header never hides on scroll**; bottom nav (5 tabs) on mobile/tablet,
  hidden on desktop in favour of top nav.

---

## 👨‍🔧 Notes for the dev team (convert to production)
1. Replace mock geocode list in `location.html` / `address.html` with a real
   geocoding/autocomplete API (Google Places / MapMyIndia) — keep the lat/lng
   capture + serviceability (haversine vs store coords) logic.
2. Wire `data.js` to the live catalog API; remove DEMO badge / footer disclaimer.
3. Replace OTP mock (`123456`) and payment simulation with real auth + gateway.
4. Serviceability + delivery charge (currently `distance_km × ₹9`, min ₹19) should
   be confirmed by backend at checkout.
5. Swap Unsplash placeholder imagery for real product photography (cards use
   500×500, hero uses 984×504).
6. Confetti, skeleton loaders and timeline animations are pure CSS/JS — safe to keep.

---
© 2026 SRIAADHYA. All rights reserved.
