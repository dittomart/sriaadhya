import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { categories, products } from '@/api/_seed';
import { ProductCard } from '@/cards/ProductCard';
import { SkeletonCards } from '@/ui/SkeletonCard';
import { useAppStore } from '@/store/appStore';
import type { FoodFilter } from '@/store/appStore';

type Sort = 'pop' | 'lh' | 'hl' | 'rt';

const FOOD_CHIPS: { f: FoodFilter; label: string }[] = [
  { f: 'all', label: 'All' },
  { f: 'veg', label: '🟢 Veg' },
  { f: 'non-veg', label: '🔴 Non-Veg' },
  { f: 'other', label: '🟡 Other' },
];

/* Ports category.html. */
export function CategoryPage() {
  const [params, setParams] = useSearchParams();
  const foodFilter = useAppStore((s) => s.foodFilter);
  const setFoodFilter = useAppStore((s) => s.setFoodFilter);

  const [activeCat, setActiveCat] = useState(params.get('cat') || 'all');
  const [searchQ, setSearchQ] = useState((params.get('q') || '').toLowerCase());
  const [sort, setSort] = useState<Sort>('pop');
  const [maxPrice, setMaxPrice] = useState(500);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPrice, setSheetPrice] = useState(500);
  const [sheetInStock, setSheetInStock] = useState(false);
  const [loading, setLoading] = useState(true);

  // A ?cat= / ?q= arriving from the header search or a promo tile.
  useEffect(() => {
    setActiveCat(params.get('cat') || 'all');
    setSearchQ((params.get('q') || '').toLowerCase());
  }, [params]);

  const list = useMemo(() => {
    let out = products.slice();
    if (activeCat !== 'all') out = out.filter((p) => p.catId === activeCat);
    if (foodFilter !== 'all') out = out.filter((p) => p.foodType === foodFilter);
    if (searchQ) out = out.filter((p) => p.name.toLowerCase().includes(searchQ));
    out = out.filter((p) => p.price <= maxPrice);
    if (inStockOnly) out = out.filter((p) => p.inStock);
    if (sort === 'lh') out.sort((a, b) => a.price - b.price);
    else if (sort === 'hl') out.sort((a, b) => b.price - a.price);
    else if (sort === 'rt') out.sort((a, b) => b.rating - a.rating);
    else out.sort((a, b) => b.orderedTimes - a.orderedTimes);
    return out;
  }, [activeCat, foodFilter, searchQ, maxPrice, inStockOnly, sort]);

  // The HTML paints skeletons for 250ms on every re-render of the grid.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, [activeCat, foodFilter, searchQ, maxPrice, inStockOnly, sort]);

  const setCat = (cat: string) => {
    setActiveCat(cat);
    const next = new URLSearchParams(params);
    if (cat === 'all') next.delete('cat');
    else next.set('cat', cat);
    setParams(next, { replace: true });
  };

  const resetFilters = () => {
    setFoodFilter('all');
    setMaxPrice(500);
    setInStockOnly(false);
    setSearchQ('');
  };

  const applyMobileFilter = () => {
    setMaxPrice(sheetPrice);
    setInStockOnly(sheetInStock);
    setSheetOpen(false);
  };

  const activeCatObj = categories.find((c) => c.id === activeCat);
  const title = activeCatObj ? activeCatObj.name : searchQ ? `Results for “${searchQ}”` : 'All Products';

  return (
    <main className="pt-16 pb-24 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-4">
        {/* mobile search */}
        <div className="md:hidden flex items-center bg-white border border-[var(--line)] rounded-xl px-3 h-11 mb-3">
          <Search className="w-4 h-4 text-[var(--ink-soft)]" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value.toLowerCase())}
            placeholder="Search products…"
            className="flex-1 bg-transparent outline-none text-sm px-2 min-w-0"
          />
        </div>

        {/* category chips scroller */}
        <div className="flex gap-2 overflow-x-auto hide-scroll pb-1 -mx-1 px-1">
          <button onClick={() => setCat('all')} className={`chip ${activeCat === 'all' ? 'active' : ''}`}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`chip ml-2 ${activeCat === c.id ? 'active' : ''}`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <h1 className="display text-xl lg:text-2xl font-extrabold">{title}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setSheetOpen(true)} className="lg:hidden btn btn-ghost px-3 py-2 text-sm">
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="field w-auto py-2 text-sm"
            >
              <option value="pop">Popularity</option>
              <option value="lh">Price: Low → High</option>
              <option value="hl">Price: High → Low</option>
              <option value="rt">Rating</option>
            </select>
          </div>
        </div>

        {/* food filter chips */}
        <div className="flex gap-2 mt-3">
          {FOOD_CHIPS.map(({ f, label }) => (
            <button key={f} onClick={() => setFoodFilter(f)} className={`chip ${foodFilter === f ? 'active' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-6 mt-5">
          {/* desktop sidebar filter */}
          <aside className="hidden lg:block w-60 flex-none">
            <div className="card p-4 sticky top-20">
              <h3 className="font-extrabold mb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </h3>
              <div className="mb-4">
                <label className="text-sm font-bold">
                  Max price: <span className="text-[var(--green-700)]">₹{maxPrice}</span>
                </label>
                <input
                  type="range"
                  min={40}
                  max={500}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(+e.target.value)}
                  className="w-full accent-[var(--green-700)] mt-2"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-[var(--green-700)] w-4 h-4"
                />{' '}
                In-stock only
              </label>
              <div className="mt-4 pt-4 border-t border-[var(--line)]">
                <h4 className="font-bold text-sm mb-2">Categories</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setCat('all')}
                    className={`block text-sm py-1 font-semibold ${
                      activeCat === 'all' ? 'text-[var(--green-700)] font-extrabold' : ''
                    }`}
                  >
                    All products
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCat(c.id)}
                      className={`block text-sm py-1 ${
                        activeCat === c.id ? 'text-[var(--green-700)] font-extrabold' : ''
                      }`}
                    >
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {loading ? (
                <SkeletonCards n={8} />
              ) : (
                list.map((p) => <ProductCard key={p.id} product={p} />)
              )}
            </div>
            {!loading && list.length === 0 && (
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
            <label className="text-sm font-bold">
              Max price: <span className="text-[var(--green-700)]">₹{sheetPrice}</span>
            </label>
            <input
              type="range"
              min={40}
              max={500}
              value={sheetPrice}
              onChange={(e) => setSheetPrice(+e.target.value)}
              className="w-full accent-[var(--green-700)] mt-2 mb-4"
            />
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={sheetInStock}
                onChange={(e) => setSheetInStock(e.target.checked)}
                className="accent-[var(--green-700)] w-4 h-4"
              />{' '}
              In-stock only
            </label>
            <button onClick={applyMobileFilter} className="btn btn-primary w-full py-3">
              Apply filters
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
