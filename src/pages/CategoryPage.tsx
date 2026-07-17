import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { useGetCatalog, useGetCategories } from '@/api/queries/useCatalog';
import { ProductCard } from '@/cards/ProductCard';
import { SkeletonCards } from '@/ui/SkeletonCard';
import { getDisplayPrice } from '@/utils/productPricing';
import { useReveal } from '@/hooks/useReveal';

type Sort = 'pop' | 'lh' | 'hl';

/** 12 fills about six rows of the 2-column phone grid — enough that the first
    screenful is never short, small enough that the page stays a page. */
const PAGE_SIZE = 12;

/** The full menu, filtered. Prices sort by what the card actually shows —
    getDisplayPrice, not the item row's own 0. */
export function CategoryPage() {
  const [params, setParams] = useSearchParams();
  const { data: categories } = useGetCategories();
  const { data: catalog, isLoading } = useGetCatalog();

  const [sort, setSort] = useState<Sort>('pop');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCat = params.get('cat') ?? 'all';
  const searchQ = (params.get('q') ?? '').toLowerCase();

  const products = catalog?.flat ?? [];

  /* The slider's ceiling is the real top of this menu, not a guessed 500. */
  const priceCeiling = useMemo(() => {
    const prices = products.map((p) => getDisplayPrice(p).price).filter((n) => n > 0);
    return prices.length ? Math.ceil(Math.max(...prices) / 50) * 50 : 0;
  }, [products]);

  useEffect(() => {
    if (priceCeiling > 0 && maxPrice == null) setMaxPrice(priceCeiling);
  }, [priceCeiling, maxPrice]);

  const list = useMemo(() => {
    const cap = maxPrice ?? Infinity;
    const out = products
      .filter((p) => activeCat === 'all' || p.catId === activeCat)
      .filter((p) => !searchQ || p.name.toLowerCase().includes(searchQ))
      .filter((p) => getDisplayPrice(p).price <= cap);

    if (sort === 'lh') out.sort((a, b) => getDisplayPrice(a).price - getDisplayPrice(b).price);
    else if (sort === 'hl') out.sort((a, b) => getDisplayPrice(b).price - getDisplayPrice(a).price);
    return out;
  }, [products, activeCat, searchQ, maxPrice, sort]);

  /* The whole filtered catalogue used to mount at once: 94 cards and 94 images
     in the DOM, a 26,000px page on a phone, and an IntersectionObserver on every
     one of them. Nobody scrolls 47 rows — they filter or search. Show a page,
     extend on demand. */
  const [shown, setShown] = useState(PAGE_SIZE);
  const visible = useMemo(() => list.slice(0, shown), [list, shown]);
  const more = list.length - visible.length;

  /* A new filter/sort/search is a new list — start it from the top rather than
     handing back however far the previous one had been extended. */
  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [activeCat, searchQ, maxPrice, sort]);

  /* The sheet was dismissible by backdrop tap alone — a 40px strip above it on
     a phone, since the card takes the rest. Escape closes it too, and the page
     behind stops scrolling while it's up. */
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  useReveal();

  const setCat = (cat: string) => {
    const next = new URLSearchParams(params);
    if (cat === 'all') next.delete('cat');
    else next.set('cat', cat);
    setParams(next, { replace: true });
  };

  const setQuery = (value: string) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete('q');
    else next.set('q', value);
    setParams(next, { replace: true });
  };

  const resetFilters = () => {
    setMaxPrice(priceCeiling || null);
    setQuery('');
  };

  const activeCatObj = categories?.find((c) => c.id === activeCat);
  const title = activeCatObj ? activeCatObj.name : searchQ ? `Results for “${searchQ}”` : 'All Products';

  return (
    <main className="page">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-4">
        {/* mobile search */}
        <div className="md:hidden flex items-center bg-white border border-[var(--line)] rounded-xl px-3 h-11 mb-3">
          <Search className="w-4 h-4 text-[var(--ink-soft)]" />
          <input
            value={searchQ}
            onChange={(e) => setQuery(e.target.value.toLowerCase())}
            placeholder="Search products…"
            className="flex-1 h-full bg-transparent outline-none text-md2 px-2 min-w-0"
          />
        </div>

        {/* category chips scroller
            `ml-2` on each chip was doubling the container's own gap-2 — 16px
            between chips but 8px before the first. The fade tells a thumb the
            row keeps going, which hide-scroll otherwise hides completely. */}
        <div className="chip-rail flex gap-2 overflow-x-auto hide-scroll py-1 -mx-4 px-4">
          <button onClick={() => setCat('all')} className={`chip ${activeCat === 'all' ? 'active' : ''}`}>
            All
          </button>
          {(categories ?? []).map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`chip ${activeCat === c.id ? 'active' : ''}`}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Heading + Filter + sort shared one flex row with no wrap. At 360px the
            select and button ate ~225px and left the h1 about 95px, so "All
            Products" broke across two lines against them. Two rows on a phone. */}
        <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="display text-xl lg:text-2xl font-extrabold min-w-0 truncate">{title}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setSheetOpen(true)} className="lg:hidden btn btn-ghost px-3 text-sm2 flex-none">
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort products"
              className="field w-auto flex-1 lg:flex-none text-sm2 py-2"
            >
              <option value="pop">Popularity</option>
              <option value="lh">Price: Low → High</option>
              <option value="hl">Price: High → Low</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6 mt-5">
          {/* desktop sidebar filter */}
          <aside className="hidden lg:block w-60 flex-none">
            <div className="card p-4 sticky top-20">
              <h3 className="font-extrabold mb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </h3>
              {priceCeiling > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-bold">
                    Max price:{' '}
                    <span className="text-[var(--green-700)] tabular-nums">₹{maxPrice ?? priceCeiling}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={priceCeiling}
                    step={10}
                    value={maxPrice ?? priceCeiling}
                    onChange={(e) => setMaxPrice(+e.target.value)}
                    className="w-full accent-[var(--green-700)] mt-2"
                  />
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-[var(--line)]">
                <h4 className="font-bold text-sm mb-2">Categories</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setCat('all')}
                    className={`block text-sm py-1 ${activeCat === 'all' ? 'text-[var(--green-700)] font-extrabold' : 'font-semibold'}`}
                  >
                    All products
                  </button>
                  {(categories ?? []).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCat(c.id)}
                      className={`block text-sm py-1 ${activeCat === c.id ? 'text-[var(--green-700)] font-extrabold' : ''}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {isLoading ? <SkeletonCards n={8} /> : visible.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {more > 0 && (
              <div className="mt-5 text-center">
                <button onClick={() => setShown((n) => n + PAGE_SIZE)} className="btn btn-ghost px-6">
                  Show {Math.min(more, PAGE_SIZE)} more
                </button>
                <p className="text-xs2 text-[var(--ink-soft)] mt-2 tabular-nums">
                  Showing {visible.length} of {list.length}
                </p>
              </div>
            )}
            {!isLoading && list.length === 0 && (
              <div className="text-center py-16 px-4">
                <PackageSearch className="w-14 h-14 text-[var(--ink-soft)] mx-auto opacity-70" />
                <p className="mt-3 font-bold text-base2">No products match your filters</p>
                <p className="mt-1 text-xs2 text-[var(--ink-soft)]">Try a wider price range or another category.</p>
                <button onClick={resetFilters} className="btn btn-ghost mt-4 px-5 text-sm2">
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile filter sheet
          `.modal-card` carries no safe-area padding, so on a gesture-bar phone
          the confirm button sat under the home indicator — the one control the
          sheet exists to offer. Padded here rather than in the shared class,
          which every other modal also uses. */}
      {sheetOpen && (
        <div
          className="modal-back"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          onClick={(e) => e.target === e.currentTarget && setSheetOpen(false)}
        >
          <div className="modal-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg">Filters</h3>
              {/* was 32px; the sheet's only dismiss besides the backdrop */}
              <button onClick={() => setSheetOpen(false)} className="icon-btn bg-[var(--cream-2)]" aria-label="Close filters">
                <X className="w-5 h-5" />
              </button>
            </div>
            {priceCeiling > 0 && (
              <div className="mb-4">
                <label htmlFor="price-max" className="text-base2 font-bold">
                  Max price:{' '}
                  <span className="text-[var(--green-700)] tabular-nums">₹{maxPrice ?? priceCeiling}</span>
                </label>
                {/* A range input's hit box is its ~20px track, and the thumb is
                    smaller still. `h-11` gives the whole control a thumb-sized
                    body to land on without changing how the track looks. */}
                <input
                  id="price-max"
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step={10}
                  value={maxPrice ?? priceCeiling}
                  onChange={(e) => setMaxPrice(+e.target.value)}
                  className="w-full h-11 accent-[var(--green-700)] mt-1 touch-none"
                />
                <div className="flex justify-between text-xs2 text-[var(--ink-soft)] tabular-nums">
                  <span>₹0</span>
                  <span>₹{priceCeiling}</span>
                </div>
              </div>
            )}
            <button onClick={() => setSheetOpen(false)} className="btn btn-primary w-full">
              Show {list.length} {list.length === 1 ? 'product' : 'products'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
