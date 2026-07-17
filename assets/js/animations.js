/* =====================================================================
   SRIAADHYA — Animations & Reusable UI Renderers
   ===================================================================== */

/* ---------- Confetti burst ---------- */
function confettiBurst(count = 120) {
  const colors = ["#16A34A", "#22C55E", "#4ADE80", "#E1AD01", "#0B6E3B", "#FF6B5B"];
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
    c.style.animationDelay = Math.random() * 0.6 + "s";
    c.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    c.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4200);
  }
}

/* ---------- Product card (used on home, category, search) ---------- */
function productCard(p, opts = {}) {
  const cat = SRI.categories.find((c) => c.id === p.catId);
  const off = discountPct(p.price, p.mrp);
  const badge = p.bestseller
    ? `<span class="absolute top-2 left-2 bg-[var(--green-700)] text-white text-[10px] font-bold px-2 py-.5 rounded-full flex items-center gap-1 z-10"><i data-lucide="flame" class="w-3 h-3"></i>Bestseller</span>`
    : p.trending
    ? `<span class="absolute top-2 left-2 bg-[var(--mustard)] text-[#3a2e00] text-[10px] font-bold px-2 py-.5 rounded-full flex items-center gap-1 z-10"><i data-lucide="trending-up" class="w-3 h-3"></i>Trending</span>`
    : "";
  const ordered = p.orderedTimes > 100
    ? `<div class="text-[10px] text-[var(--green-700)] font-bold flex items-center gap-1 mt-1"><i data-lucide="flame" class="w-3 h-3"></i>Ordered ${p.orderedTimes}× this week</div>`
    : "";
  return `
  <div class="pcard card-glow flex flex-col relative no-tap">
    <div class="pcard-media">
      ${badge}
      ${off ? `<span class="absolute top-2 right-2 bg-[var(--coral)] text-white text-[10px] font-extrabold px-1.5 py-.5 rounded-md z-10 shadow">${off}% OFF</span>` : ""}
      <a href="product.html?id=${p.id}" class="pcard-img aspect-square">
        <img src="${p.img}" alt="${p.name}" loading="lazy" class="w-full h-full object-cover"/>
        ${!p.inStock ? `<span class="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-extrabold text-[var(--ink-soft)] z-10">Out of stock</span>` : ""}
      </a>
      ${p.inStock ? `<button onclick="addToCart('${p.id}')" class="pcard-add" title="Add to cart" aria-label="Add ${p.name} to cart"><i data-lucide="plus" class="w-5 h-5"></i></button>` : ""}
    </div>
    <div class="px-3.5 pt-5 pb-3.5 flex flex-col flex-1">
      <div class="flex items-center gap-1.5 mb-1">${foodMark(p.foodType)}<span class="text-[10px] text-[var(--ink-soft)] font-semibold uppercase tracking-wide truncate">${cat ? cat.name : ""}</span></div>
      <a href="product.html?id=${p.id}" class="font-bold text-[13px] leading-tight clamp-2 min-h-[34px] hover:text-[var(--green-700)] transition-colors">${p.name}</a>
      <div class="flex items-center gap-1 mt-1.5"><span class="inline-flex items-center gap-.5 bg-[var(--leaf-100)] text-[var(--green-800)] text-[10px] font-bold px-1.5 py-.5 rounded-md"><i data-lucide="star" class="w-2.5 h-2.5 fill-[var(--green-700)] text-[var(--green-700)]"></i>${p.rating.toFixed(1)}</span><span class="text-[10px] text-[var(--ink-soft)]">(${p.reviews})</span></div>
      ${ordered}
      <div class="flex items-end gap-1.5 mt-auto pt-2.5">
        <span class="font-extrabold text-[17px] text-[var(--ink)] leading-none">${rupee(p.price)}</span>
        ${p.mrp > p.price ? `<span class="text-[11px] text-[var(--ink-soft)] line-through">${rupee(p.mrp)}</span>` : ""}
        <span class="text-[10px] text-[var(--ink-soft)] ml-auto">${p.unit}</span>
      </div>
    </div>
  </div>`;
}

/* ---------- Category tile ---------- */
function categoryTile(c) {
  return `
  <a href="category.html?cat=${c.id}" class="io group flex flex-col no-tap">
    <div class="catile w-full aspect-square" style="background:${c.tone}10">
      <img src="${c.img}" alt="${c.name}" loading="lazy" class="w-full h-full object-cover"/>
      <div class="absolute inset-0" style="background:linear-gradient(180deg,transparent 55%,${c.tone}33)"></div>
      <span class="catile-emoji float-slow">${c.emoji}</span>
    </div>
    <span class="catile-name">${c.name}</span>
  </a>`;
}

/* ---------- skeleton grid ---------- */
function skeletonCards(n = 6) {
  let h = "";
  for (let i = 0; i < n; i++) h += `<div class="card overflow-hidden"><div class="skeleton aspect-square"></div><div class="p-3 space-y-2"><div class="skeleton h-3 w-3/4"></div><div class="skeleton h-3 w-1/2"></div><div class="skeleton h-6 w-full mt-2"></div></div></div>`;
  return h;
}
