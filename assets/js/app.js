/* =====================================================================
   SRIAADHYA — Shared App Logic
   Cart • Auth • Location Gate • Header/Nav/Footer • Toast • Helpers
   ===================================================================== */

const LS = {
  loc: "dittomart_location",
  cart: "dittomart_cart",
  user: "dittomart_user",
  addr: "dittomart_addresses",
  activeAddr: "dittomart_active_address",
  orders: "dittomart_orders",
  activeOrder: "dittomart_active_order",
  foodFilter: "dittomart_food_type_filter",
};

const get = (k, d = null) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ---------- Global broken-image fallback ----------
   Catalog photos load from the Unsplash CDN; if any URL is dead/blocked we
   swap in a clean branded placeholder instead of a broken-image icon.
   Uses capture phase because <img> error events don't bubble. */
const IMG_FALLBACK = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DCFCE7"/><stop offset="1" stop-color="#EEF4E7"/></linearGradient></defs>' +
  '<rect width="500" height="500" fill="url(#g)"/>' +
  '<g transform="translate(250 210)" fill="#15803D">' +
  '<path d="M0 64 C-48 64 -88 22 -88 -26 C-32 -26 8 6 0 64 Z"/>' +
  '<path d="M0 64 C48 64 88 22 88 -26 C32 -26 -8 6 0 64 Z" opacity="0.65"/>' +
  '<rect x="-3" y="40" width="6" height="40" rx="3"/></g>' +
  '<text x="250" y="350" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="700" fill="#15803D" text-anchor="middle" letter-spacing="2">SRIAADHYA</text>' +
  '<text x="250" y="384" font-family="Arial,Helvetica,sans-serif" font-size="17" fill="#3C5446" text-anchor="middle">Image coming soon</text>' +
  '</svg>'
);
document.addEventListener("error", (e) => {
  const t = e.target;
  if (t && t.tagName === "IMG" && t.dataset.imgFallback !== "1") {
    t.dataset.imgFallback = "1";
    t.src = IMG_FALLBACK;
  }
}, true);

/* ---------- Money ---------- */
const rupee = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

/* ---------- Food mark ---------- */
function foodMark(type, size = "") {
  const cls = type === "veg" ? "fm-veg" : type === "non-veg" ? "fm-non" : "fm-other";
  return `<span class="foodmark ${cls} ${size}" title="${type}"><i></i></span>`;
}

/* =====================================================================
   LOCATION GATE — run at top of every protected page
   ===================================================================== */
function locationGate() {
  const loc = get(LS.loc);
  if (!loc || !loc.latitude || !loc.longitude) { location.href = "login.html"; return false; }
  if (loc.serviceable === false) { location.href = "not-serviceable.html"; return false; }
  return true;
}

/* ---------- distance (haversine, km) ---------- */
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* =====================================================================
   CART
   ===================================================================== */
function getCart() { return get(LS.cart, []); }
function cartCount() { return getCart().reduce((s, i) => s + i.qty, 0); }
function cartSubtotal() { return getCart().reduce((s, i) => s + i.price * i.qty, 0); }

function addToCart(productId, qty = 1, opts = {}) {
  const p = SRI.products.find((x) => x.id === productId);
  if (!p) return;
  const cart = getCart();
  const key = opts.variant ? `${p.id}__${opts.variant}` : p.id;
  const price = opts.price || p.price;
  const existing = cart.find((i) => i.key === key);
  if (existing) existing.qty += qty;
  else cart.push({ key, id: p.id, name: p.name + (opts.variant ? ` (${opts.variant})` : ""), price, img: p.img, foodType: p.foodType, qty, unit: opts.variant || p.unit });
  set(LS.cart, cart);
  syncCartBadges();
  toast(`Added to cart`, "ok", "shopping-bag");
  bumpCartIcon();
}
function setQty(key, qty) {
  let cart = getCart();
  const it = cart.find((i) => i.key === key);
  if (!it) return;
  it.qty = qty;
  if (it.qty <= 0) cart = cart.filter((i) => i.key !== key);
  set(LS.cart, cart);
  syncCartBadges();
}
function removeFromCart(key) { set(LS.cart, getCart().filter((i) => i.key !== key)); syncCartBadges(); }
function clearCart() { set(LS.cart, []); syncCartBadges(); }

function syncCartBadges() {
  const n = cartCount();
  document.querySelectorAll("[data-cart-badge]").forEach((el) => {
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}
function bumpCartIcon() {
  document.querySelectorAll("[data-cart-icon]").forEach((el) => {
    el.classList.remove("anim-pop"); void el.offsetWidth; el.classList.add("anim-pop");
  });
}

/* ---------- delivery charge (distance based) ---------- */
function deliveryCharge() {
  const loc = get(LS.loc, {});
  const dist = loc.distance_from_store_km || 3;
  return Math.max(19, Math.round(dist * SRI.BRAND.baseDeliveryPerKm));
}

/* =====================================================================
   AUTH
   ===================================================================== */
function isLoggedIn() { const u = get(LS.user); return !!(u && u.loggedIn); }

/* =====================================================================
   TOAST
   ===================================================================== */
function toast(msg, type = "", icon = "check") {
  let wrap = document.getElementById("toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.id = "toast-wrap"; document.body.appendChild(wrap); }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<i data-lucide="${icon}" style="width:16px;height:16px"></i><span>${msg}</span>`;
  wrap.appendChild(t);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => { t.style.transition = "opacity .3s,transform .3s"; t.style.opacity = "0"; t.style.transform = "translateY(8px)"; setTimeout(() => t.remove(), 300); }, 1900);
}

/* =====================================================================
   SHARED CHROME — header, bottom nav, whatsapp, footer
   ===================================================================== */
function deliveringArea() {
  const loc = get(LS.loc);
  return loc && loc.area ? loc.area : "Avinashi";
}

function renderHeader(active = "") {
  const B = SRI.BRAND;
  return `
  <header class="site-header glass" style="border-bottom:1px solid var(--line)">
    <div class="max-w-7xl mx-auto px-4 lg:px-8">
      <div class="flex items-center gap-3 h-16">
        <a href="home.html" class="flex items-center flex-none no-tap" title="${B.name}">
          <img src="assets/images/logo.png" alt="${B.name}" class="h-8 sm:h-10 w-auto object-contain"/>
        </a>

        <a href="location.html" class="flex items-center gap-1 text-left ml-1 no-tap flex-none">
          <i data-lucide="map-pin" class="w-4 h-4 text-[var(--green-700)]"></i>
          <span class="hidden xs:block text-xs">
            <span class="block text-[10px] text-[var(--ink-soft)] leading-none">Deliver to</span>
            <span class="font-bold text-[var(--ink)] leading-none flex items-center gap-.5">${deliveringArea()} <i data-lucide="chevron-down" class="w-3 h-3"></i></span>
          </span>
        </a>

        <div class="flex-1 hidden md:flex items-center bg-white border border-[var(--line)] rounded-xl px-3 h-10 mx-2">
          <i data-lucide="search" class="w-4 h-4 text-[var(--ink-soft)]"></i>
          <input id="globalSearch" placeholder="Search mushrooms, paneer, samosa…" class="flex-1 bg-transparent outline-none text-sm px-2"/>
        </div>

        <!-- desktop top nav -->
        <nav class="topnav hidden lg:flex items-center gap-5 text-sm font-semibold text-[var(--ink-soft)] ml-2">
          <a href="home.html" class="${active==='home'?'text-[var(--green-700)]':''}">Home</a>
          <a href="category.html" class="${active==='cat'?'text-[var(--green-700)]':''}">Categories</a>
          <a href="orders.html" class="${active==='orders'?'text-[var(--green-700)]':''}">Track Order</a>
        </nav>

        <a href="${isLoggedIn()?'profile.html':'login.html'}" class="ml-auto md:ml-1 w-10 h-10 rounded-xl bg-[var(--cream-2)] flex items-center justify-center flex-none no-tap" title="Profile">
          <i data-lucide="user" class="w-5 h-5 text-[var(--green-800)]"></i>
        </a>
        <a href="cart.html" data-cart-icon class="relative w-10 h-10 rounded-xl bg-[var(--green-700)] flex items-center justify-center flex-none no-tap" title="Cart">
          <i data-lucide="shopping-cart" class="w-5 h-5 text-white"></i>
          <span data-cart-badge class="absolute -top-1.5 -right-1.5 bg-[var(--mustard)] text-[#3a2e00] text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center" style="display:none">0</span>
        </a>
      </div>
    </div>
  </header>`;
}

function renderBottomNav(active = "") {
  const tab = (href, ico, label, key) =>
    `<a href="${href}" class="${active===key?'active':''}"><span class="nav-ico"><i data-lucide="${ico}" class="w-5 h-5"></i></span>${label}</a>`;
  return `
  <nav class="bnav lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--line)] flex px-1">
    ${tab("home.html","home","Home","home")}
    ${tab("category.html","layout-grid","Categories","cat")}
    ${tab("cart.html","shopping-cart","Cart","cart")}
    ${tab("orders.html","package","Orders","orders")}
    ${tab(isLoggedIn()?"profile.html":"login.html","user","Profile","profile")}
  </nav>`;
}

function renderWhatsApp() {
  return `<a class="wa-fab no-tap" target="_blank" href="https://wa.me/${SRI.BRAND.whatsapp}?text=${encodeURIComponent('Hi SRIAADHYA, I have a question about my order')}" title="Chat on WhatsApp">
    <i data-lucide="message-circle" class="w-6 h-6 text-white"></i></a>`;
}

function renderFooter() {
  // Footer removed per request — no content rendered at the bottom of any page.
  return "";
}

/* ---------- Store hours modal (static, backend handles timing) ---------- */
function openStoreHours() {
  const rows = Object.entries(SRI.storeHoursDisplay)
    .map(([d, h]) => `<div class="flex justify-between py-2 border-b border-[var(--line)] text-sm"><span class="font-semibold">${d}</span><span class="text-[var(--ink-soft)]">${h}</span></div>`)
    .join("");
  const back = document.createElement("div");
  back.className = "modal-back";
  back.onclick = (e) => { if (e.target === back) back.remove(); };
  back.innerHTML = `
    <div class="modal-card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-extrabold flex items-center gap-2"><i data-lucide="clock" class="w-5 h-5 text-[var(--green-700)]"></i> Our Store Hours</h3>
        <button onclick="this.closest('.modal-back').remove()" class="w-8 h-8 rounded-lg bg-[var(--cream-2)] flex items-center justify-center"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>
      ${rows}
      <p class="text-xs text-[var(--ink-soft)] mt-4 bg-[var(--cream)] p-3 rounded-xl">Note: Order timing is managed by our system. If unavailable at checkout, please try again later.</p>
    </div>`;
  document.body.appendChild(back);
  if (window.lucide) lucide.createIcons();
}

/* ---------- Mount shared chrome ---------- */
function mountChrome(active) {
  const h = document.getElementById("app-header");
  if (h) h.innerHTML = renderHeader(active);
  const b = document.getElementById("app-bottomnav");
  if (b) b.innerHTML = renderBottomNav(active);
  const w = document.getElementById("app-whatsapp");
  if (w) w.innerHTML = renderWhatsApp();
  const f = document.getElementById("app-footer");
  if (f) f.innerHTML = renderFooter();
  if (window.lucide) lucide.createIcons();
  syncCartBadges();

  // global search -> category page
  const gs = document.getElementById("globalSearch");
  if (gs) gs.addEventListener("keydown", (e) => { if (e.key === "Enter" && gs.value.trim()) location.href = "category.html?q=" + encodeURIComponent(gs.value.trim()); });
}

/* ---------- IntersectionObserver reveal ---------- */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".io").forEach((el) => io.observe(el));
}

/* ---------- small helpers ---------- */
function qParam(name) { return new URLSearchParams(location.search).get(name); }
function star(n) {
  let s = "";
  for (let i = 1; i <= 5; i++) s += `<i data-lucide="star" class="w-3 h-3 ${i <= Math.round(n) ? 'fill-[var(--mustard)] text-[var(--mustard)]' : 'text-gray-300'}"></i>`;
  return s;
}
function discountPct(price, mrp) { return mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : 0; }

window.addEventListener("DOMContentLoaded", () => { if (window.lucide) lucide.createIcons(); });
