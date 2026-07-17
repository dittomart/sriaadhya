---
name: verify
description: Build, launch and drive the sriaadhya storefront in a real browser to observe a change working end-to-end.
---

# Verifying sriaadhya-frontend-web

Vite + React 18 + React Router + zustand + React Query. No test runner is wired
up — verification here means driving the real app in Chromium.

## Launch

```bash
npx vite --port 5199 --strictPort     # run as a background task, not with `&`
curl -s -o /dev/null -w "%{http_code}" http://localhost:5199/   # expect 200
```

`&` from the Bash tool detaches and the task reports exit 0 immediately while
the server keeps running — use `run_in_background: true` instead, and if the
port is already in use, an earlier detached vite is probably still serving it.

## Drive

Playwright ships in `node_modules` (no `@playwright/test` config — use the
library directly). **The driver script must live in the repo root**, not the
scratchpad, or node won't resolve `playwright`. Delete it when done.

```js
import { chromium } from 'playwright';
const page = await (await (await chromium.launch()).newContext()).newPage();
```

The app talks to a live backend (`https://app.dittomart.in/public/api`, see
`src/api/client.ts`). Use `page.route()` to pin the responses a scenario needs
and let everything else through with `route.fetch()` + `route.fulfill()`.

### Getting past the guest wall

Most interesting state is behind auth. Seed localStorage, then navigate (the
zustand stores hydrate on load):

| Key | Version | Notes |
|---|---|---|
| `sriaadhya_auth` | **3** | `{state: {authToken, user}, version: 3}` |
| `sriaadhya_cart` | **3** | `{state: {lines: [...]}, version: 3}` |

Zustand's persist silently drops state whose `version` doesn't match the
store's — a wrong number shows up only as a `console.error` about migration and
the app behaving as a guest. Check the `version:` in the store file rather than
guessing.

`storeLocation` is deliberately **not** persisted (`src/store/appStore.ts`) — it
always comes from `POST /brand-locations/{uniqueId}`. Route that call to change
store config (`delivery_radius`, `min_order_price`, tax) for a scenario.

### Endpoint shapes that bite

- `POST /get-addresses` → rows come back as a **bare array or under `data`**
  (`rowsOf` in `src/api/mutations/useAddresses.ts`). An `addresses` key is
  ignored and you get a silent empty list.
- `POST /get-deliverable-amount` → `{data: {distance_km, delivery_fee}}`. Sits
  behind jwt.auth: **no token means no call**, and the cart shows
  "At checkout" instead of a fee. If this call count is 0 when you expected a
  quote, auth or address coords are the reason.
- `GET /brands`, `POST /brand-locations/{uniqueId}` — the store's own config.

## Flows worth driving

- **Cart totals / delivery radius** — `/cart`. Route `/get-deliverable-amount`
  to a chosen `distance_km`; the live store's `delivery_radius` is 20 km. Check
  both sides of the boundary — 20.0 allowed, 20.1 blocked — plus radius `0`
  (unconfigured ⇒ nothing is out of range) and an absent `distance_km`
  (unknown ⇒ must not block).
- **Checkout gate** — `/payment` blocks on the backend's `is_operational` per
  address (`canDeliverTo`), separate from the cart's distance check.
- `IGNORE_DELIVERY_RADIUS` in `src/utils/deliveryRules.ts` disables every radius
  block — make sure it's `false` when verifying one.

## Mobile / responsive changes

Drive at **360×780** (the Android floor), 390 (iPhone), 768 (tablet), with
`isMobile: true, hasTouch: true`. Don't eyeball a screenshot — measure in the
page and let the numbers say what broke:

```js
// tap targets under 44px (WCAG 2.5.5 / Apple HIG)
[...document.querySelectorAll('button,a,[role="button"],input,select,textarea')]
  .map(el => ({ el, r: el.getBoundingClientRect() }))
  .filter(({ r }) => r.width && r.height && (r.width < 44 || r.height < 44))

// text under the 12px floor
// horizontal overflow: compare el.getBoundingClientRect().right against
// document.documentElement.clientWidth — skipping anything inside an
// overflow-x:auto ancestor, which is a deliberate scroller
```

`body{overflow-x:hidden}` (`src/index.css`) **hides** horizontal overflow, so a
page can measure "no scroll" and still be broken. Measure element rects, not
`scrollWidth`.

The chrome geometry is token-driven — read it back rather than assuming:
`--header-h` (64), `--nav-h` (60), `--safe-b` (`env(safe-area-inset-bottom)`),
`--tap` (44), and `--action-bar-h`, which `useActionBarHeight` **measures and
publishes at runtime** because the cart's bar grows when an order is blocked.
Assert `getComputedStyle(document.documentElement).getPropertyValue('--nav-h')`
against the nav's real `getBoundingClientRect().height` — they drifted before
and every offset that guessed at them was wrong.

Pages use `.page` / `.page-bar` shells for the fixed-chrome offsets. A page that
hand-rolls `pt-16 pb-24` is a regression.
