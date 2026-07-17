import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Mic, PhoneCall, Search, ShieldCheck, Sparkles, Star, Timer } from 'lucide-react';
import { useGetCatalog, useGetCategories } from '@/api/queries/useCatalog';
import { BrandBanner } from '@/sections/home/BrandBanner';
import { BrandStrip } from '@/sections/home/BrandStrip';
import { CategoryTile } from '@/cards/CategoryTile';
import { ProductCard } from '@/cards/ProductCard';
import { SkeletonCards } from '@/ui/SkeletonCard';
import { useAppStore } from '@/store/appStore';
import { useReveal } from '@/hooks/useReveal';

const PREVIEW_LIMIT = 10;

/** The storefront. Categories and items are the store's own — the brand banner
    and the promise strip are the brand's, and are the same for everyone. */
export function HomePage() {
  const navigate = useNavigate();
  const store = useAppStore((s) => s.storeLocation);
  const { data: categories, isLoading: catsLoading } = useGetCategories();
  const { data: catalog, isLoading: itemsLoading } = useGetCatalog();
  const [q, setQ] = useState('');

  /* What to put on the shelf. The admin's own picks win — but this store has
     tagged nothing yet, and a home page with 94 items behind it and an empty
     shelf in front of it is worse than one that just shows the menu. Fall back
     to the first items of each category so the page always has something real. */
  const featured = useMemo(() => {
    const flat = catalog?.flat ?? [];
    if (catalog?.recommended?.length) return catalog.recommended.slice(0, PREVIEW_LIMIT);

    const tagged = flat.filter((p) => p.bestseller);
    if (tagged.length) return tagged.slice(0, PREVIEW_LIMIT);

    /* One from each category first, so the shelf reads as a spread of the menu
       rather than ten variations of whatever sorts first — then fill from the
       rest. Deduped by id: a category's first item is also in `flat`, and
       listing it twice would collide on its React key. */
    const byCat = catalog?.byCategory ?? {};
    const picked = new Map<string, (typeof flat)[number]>();
    for (const items of Object.values(byCat)) {
      if (items[0]) picked.set(items[0].id, items[0]);
    }
    for (const p of flat) {
      if (picked.size >= PREVIEW_LIMIT) break;
      picked.set(p.id, p);
    }
    return [...picked.values()].slice(0, PREVIEW_LIMIT);
  }, [catalog]);

  const shelfTitle = catalog?.recommended?.length || (catalog?.flat ?? []).some((p) => p.bestseller)
    ? 'Fresh picks'
    : 'Fresh from our kitchen';

  useReveal();

  const submitSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && q.trim()) navigate('/category?q=' + encodeURIComponent(q.trim()));
  };

  const phone = store?.phone ?? '';
  const phoneDigits = phone.replace(/\D/g, '');

  return (
    <main className="pt-16 pb-24 lg:pb-10">
      {/* offer ticker */}
      <div className="aurora text-white text-xs font-bold py-2 ticker">
        <div className="ticker-track">
          {[0, 1].map((i) => (
            <span key={i}>
              <span className="px-6">⚡ {store?.deliveryTime ?? 30}-min delivery across {store?.city ?? 'Avinashi'}</span>
              <span className="px-6">🌱 100% Quality Assured</span>
              <span className="px-6">❄️ Freshness Frozen, Goodness Preserved</span>
              <span className="px-6">🚚 Delivery charge as per KM</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* mobile search */}
        <div className="md:hidden flex items-center bg-white border border-[var(--line)] rounded-2xl px-3 h-12 mt-4 shadow-sm">
          <Search className="w-4 h-4 text-[var(--green-700)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={submitSearch}
            placeholder="Search mushroom, paneer, samosa…"
            className="flex-1 bg-transparent outline-none text-sm px-2 min-w-0"
          />
          <Mic className="w-4 h-4 text-[var(--ink-soft)]" />
        </div>

        <BrandBanner />

        {/* WHY US feature strip */}
        <section className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card card-grad p-3.5 flex items-center gap-3 io">
            <div className="w-11 h-11 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center float-slow">
              <Timer className="w-5 h-5 text-[var(--green-700)]" />
            </div>
            <div>
              <div className="text-sm font-extrabold">{store?.deliveryTime ?? 30}-min</div>
              <div className="text-[11px] text-[var(--ink-soft)]">lightning delivery</div>
            </div>
          </div>
          <div className="card card-grad p-3.5 flex items-center gap-3 io">
            <div
              className="w-11 h-11 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center float-slow"
              style={{ animationDelay: '.3s' }}
            >
              <ShieldCheck className="w-5 h-5 text-[var(--green-700)]" />
            </div>
            <div>
              <div className="text-sm font-extrabold">Secure</div>
              <div className="text-[11px] text-[var(--ink-soft)]">UPI / card payments</div>
            </div>
          </div>
          <div className="card card-grad p-3.5 flex items-center gap-3 io">
            <div
              className="w-11 h-11 rounded-xl bg-[#FFF6DC] flex items-center justify-center float-slow"
              style={{ animationDelay: '.6s' }}
            >
              <Star className="w-5 h-5 text-[var(--mustard)] fill-[var(--mustard)]" />
            </div>
            <div>
              <div className="text-sm font-extrabold">Quality first</div>
              <div className="text-[11px] text-[var(--ink-soft)]">hygienically packed</div>
            </div>
          </div>
          {phoneDigits ? (
            <a href={`tel:${phone}`} className="card card-grad p-3.5 flex items-center gap-3 io">
              <div
                className="w-11 h-11 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center float-slow"
                style={{ animationDelay: '.9s' }}
              >
                <PhoneCall className="w-5 h-5 text-[var(--green-700)]" />
              </div>
              <div>
                <div className="text-sm font-extrabold">Call us</div>
                <div className="text-[11px] text-[var(--ink-soft)]">{phone}</div>
              </div>
            </a>
          ) : (
            <div className="card card-grad p-3.5 flex items-center gap-3 io">
              <div
                className="w-11 h-11 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center float-slow"
                style={{ animationDelay: '.9s' }}
              >
                <Sparkles className="w-5 h-5 text-[var(--green-700)]" />
              </div>
              <div>
                <div className="text-sm font-extrabold">Farm fresh</div>
                <div className="text-[11px] text-[var(--ink-soft)]">straight to your door</div>
              </div>
            </div>
          )}
        </section>

        {/* CATEGORIES */}
        <section className="mt-9">
          <div className="flex items-center justify-between mb-4">
            <h2 className="display text-xl lg:text-2xl font-extrabold head-accent">Shop by Category</h2>
            <Link to="/category" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 xs:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {catsLoading
              ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-[20px]" />)
              : (categories ?? []).map((c) => <CategoryTile key={c.id} category={c} />)}
          </div>
        </section>

        {/* FEATURED — the store's picks, or a spread of the menu when it has none */}
        {(itemsLoading || featured.length > 0) && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="display text-xl lg:text-2xl font-extrabold head-accent flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--mustard)]" /> {shelfTitle}
              </h2>
              <Link to="/category" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {itemsLoading ? (
                <SkeletonCards n={5} />
              ) : (
                featured.map((p) => <ProductCard key={p.id} product={p} />)
              )}
            </div>
          </section>
        )}

        <BrandStrip />
      </div>
    </main>
  );
}
