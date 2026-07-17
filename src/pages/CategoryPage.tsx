import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { useGetCatalog, useGetCategories } from '@/api/queries/useCatalog';
import { ProductCard } from '@/cards/ProductCard';
import { SkeletonCards } from '@/ui/SkeletonCard';
import { getDisplayPrice } from '@/utils/productPricing';
import { useReveal } from '@/hooks/useReveal';

type Sort = 'pop' | 'lh' | 'hl';

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
    <main className="pt-16 pb-24 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-4">
        {/* mobile search */}
        <div className="md:hidden flex items-center bg-white border border-[var(--line)] rounded-xl px-3 h-11 mb-3">
          <Search className="w-4 h-4 text-[var(--ink-soft)]" />
          <input
            value={searchQ}
            onChange={(e) => setQuery(e.target.value.toLowerCase())}
            placeholder="Search products…"
            className="flex-1 bg-transparent outline-none text-sm px-2 min-w-0"
          />
        </div>

        {/* category chips scroller */}
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-1 -mx-1 px-1">
          <button onClick={() => setCat('all')} className={`chip ${activeCat === 'all' ? 'active' : ''}`}>
            All
          </button>
          {(categories ?? []).map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`chip ml-2 ${activeCat === c.id ? 'active' : ''}`}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <h1 className="display text-xl lg:text-2xl font-extrabold">{title}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setSheetOpen(true)} className="lg:hidden btn btn-ghost px-3 py-2 text-sm">
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field w-auto py-2 text-sm">
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
                    Max price: <span className="text-[var(--green-700)]">₹{maxPrice ?? priceCeiling}</span>
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
              {isLoading ? <SkeletonCards n={8} /> : list.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {!isLoading && list.length === 0 && (
              <div className="text-center py-16">
                <PackageSearch className="w-12 h-12 text-[var(--ink-soft)] mx-auto" />
                <p className="mt-3 font-bold">No products match your filters</p>
                <button onClick={resetFilters} className="btn btn-ghost mt-3 px-4 py-2 text-sm">
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile filter sheet */}
      {sheetOpen && (
        <div className="modal-back" onClick={(e) => e.target === e.currentTarget && setSheetOpen(false)}>
          <div className="modal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg">Filters</h3>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-lg bg-[var(--cream-2)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {priceCeiling > 0 && (
              <>
                <label className="text-sm font-bold">
                  Max price: <span className="text-[var(--green-700)]">₹{maxPrice ?? priceCeiling}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step={10}
                  value={maxPrice ?? priceCeiling}
                  onChange={(e) => setMaxPrice(+e.target.value)}
                  className="w-full accent-[var(--green-700)] mt-2 mb-4"
                />
              </>
            )}
            <button onClick={() => setSheetOpen(false)} className="btn btn-primary w-full py-3">
              Show {list.length} {list.length === 1 ? 'product' : 'products'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
