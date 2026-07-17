import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ChevronRight, Flame, Layers, Snowflake, Leaf, Truck } from 'lucide-react';
import { useGetCatalog, useGetProduct } from '@/api/queries/useCatalog';
import { ProductCard } from '@/cards/ProductCard';
import { FoodMark } from '@/shared/FoodMark';
import { SmartImage } from '@/shared/SmartImage';
import { useAppStore } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/hooks/useToast';
import { rupee } from '@/utils/fmt';
import { computeUnitPrice, getDisplayPrice, lineIdOf, multipleGroups, singleGroups } from '@/utils/productPricing';
import { DotLoader } from '@/ui/DotLoader';
import type { Customization, Product } from '@/types';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useGetProduct(id);

  if (isLoading) return <DotLoader />;
  if (!product) {
    return (
      <main className="pt-16 pb-24 lg:pb-10">
        <div className="max-w-2xl mx-auto px-5 text-center py-16">
          <h1 className="display text-2xl font-extrabold">We couldn't find that item</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">It may have sold out or been taken off the menu.</p>
          <Link to="/category" className="btn btn-primary mt-5 px-6 py-3 inline-flex">
            Browse the menu
          </Link>
        </div>
      </main>
    );
  }

  // Remount on id change so no selection leaks between products.
  return <ProductView key={product.id} product={product} />;
}

function ProductView({ product: p }: { product: Product }) {
  const navigate = useNavigate();
  const add = useCartStore((s) => s.add);
  const push = useToast();
  const store = useAppStore((s) => s.storeLocation);
  const area = useLocationStore((s) => s.location?.area);
  const { data: catalog } = useGetCatalog();

  const variants = useMemo(() => singleGroups(p), [p]);
  const extras = useMemo(() => multipleGroups(p), [p]);

  /* Every SINGLE group starts on its cheapest option — that is the price the
     card promised, so the PDP opens showing the same number. */
  const [picked, setPicked] = useState<Record<number, number>>(() =>
    Object.fromEntries(
      variants.map((g) => [g.id, g.options.reduce((a, b) => (b.price < a.price ? b : a)).id]),
    ),
  );
  const [checked, setChecked] = useState<Record<number, Set<number>>>({});
  const [qty, setQty] = useState(1);

  const chosen: Customization[] = useMemo(() => {
    const out: Customization[] = [];
    for (const g of variants) {
      const opt = g.options.find((o) => o.id === picked[g.id]);
      if (opt) out.push({ groupId: g.id, groupName: g.name, addonId: opt.id, addonName: opt.name, price: opt.price });
    }
    for (const g of extras) {
      for (const opt of g.options) {
        if (checked[g.id]?.has(opt.id)) {
          out.push({ groupId: g.id, groupName: g.name, addonId: opt.id, addonName: opt.name, price: opt.price });
        }
      }
    }
    return out;
  }, [variants, extras, picked, checked]);

  const unitPrice = computeUnitPrice(p, chosen);
  const { oldPrice, discountPercent } = getDisplayPrice(p);
  /* The merchant hasn't priced this row — on the item or its addons. Selling it
     at ₹0 would be the store's loss, so there's nothing to add. */
  const unpriced = unitPrice <= 0;

  const related = useMemo(
    () => (catalog?.flat ?? []).filter((x) => x.id !== p.id && x.catId === p.catId).slice(0, 5),
    [catalog, p.id, p.catId],
  );

  const toggleExtra = (groupId: number, optionId: number, limit: number) => {
    setChecked((prev) => {
      const set = new Set(prev[groupId] ?? []);
      if (set.has(optionId)) set.delete(optionId);
      else {
        if (limit > 0 && set.size >= limit) return prev;
        set.add(optionId);
      }
      return { ...prev, [groupId]: set };
    });
  };

  const addToCart = (buyNow: boolean) => {
    add({
      lineId: lineIdOf(p.id, chosen),
      productId: p.id,
      name: p.name,
      img: p.img,
      foodType: p.foodType,
      basePrice: p.price,
      unitPrice,
      qty,
      customizations: chosen,
    });
    push('Added to cart', 'ok', 'shopping-bag');
    if (buyNow) setTimeout(() => navigate('/cart'), 400);
  };

  return (
    <>
      <main className="pt-16 pb-28 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-3">
          {/* breadcrumb */}
          <div className="text-xs text-[var(--ink-soft)] flex items-center gap-1 mb-3">
            <Link to="/home" className="hover:text-[var(--green-700)]">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/category?cat=${p.catId}`} className="hover:text-[var(--green-700)]">
              {p.categoryName || 'Category'}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--ink)] font-semibold">{p.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* image */}
            <div className="lg:w-1/2">
              <div className="card overflow-hidden aspect-square relative">
                <span className="absolute top-3 left-3 z-10">
                  <FoodMark type={p.foodType} />
                </span>
                {p.bestseller && (
                  <span className="absolute top-3 right-3 z-10 bg-[var(--green-700)] text-white text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    Bestseller
                  </span>
                )}
                <SmartImage src={p.img} alt={p.name} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* info */}
            <div className="lg:w-1/2">
              <h1 className="display text-2xl lg:text-3xl font-extrabold leading-tight flex items-start gap-2">
                <FoodMark type={p.foodType} /> <span>{p.name}</span>
              </h1>

              <div className="flex items-end gap-3 mt-4">
                {unpriced ? (
                  <span className="display text-2xl font-extrabold text-[var(--ink-soft)]">Price on request</span>
                ) : (
                  <>
                    <span className="display text-3xl font-extrabold">{rupee(unitPrice)}</span>
                    {oldPrice != null && <span className="text-[var(--ink-soft)] line-through">{rupee(oldPrice)}</span>}
                    {discountPercent != null && discountPercent > 0 && (
                      <span className="bg-[var(--coral)] text-white text-xs font-extrabold px-2 py-1 rounded-md">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                {unpriced ? 'Contact the store for pricing on this item.' : 'Inclusive of all taxes'}
              </p>

              {/* variant pickers — where this store keeps its prices */}
              {variants.map((g) => (
                <div key={g.id} className="mt-5">
                  <div className="text-sm font-bold mb-2">{g.name}</div>
                  <div className="flex gap-2 flex-wrap">
                    {g.options.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setPicked((prev) => ({ ...prev, [g.id]: o.id }))}
                        className={`chip ${picked[g.id] === o.id ? 'active' : ''}`}
                      >
                        {o.name} • {rupee(o.price)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* optional extras */}
              {extras.map((g) => (
                <div key={g.id} className="mt-5">
                  <div className="text-sm font-bold mb-2">
                    {g.name}
                    {g.limit > 0 && <span className="text-[11px] text-[var(--ink-soft)] font-normal"> · up to {g.limit}</span>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {g.options.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => toggleExtra(g.id, o.id, g.limit)}
                        className={`chip ${checked[g.id]?.has(o.id) ? 'active' : ''}`}
                      >
                        {o.name} {o.price > 0 && `• +${rupee(o.price)}`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!unpriced && (
                <div className="flex items-center gap-4 mt-6">
                  <div className="text-sm font-bold">Quantity</div>
                  <div className="stepper">
                    <button onClick={() => setQty((n) => Math.max(1, n - 1))}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty((n) => n + 1)}>+</button>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[11px] text-[var(--ink-soft)]">Subtotal</div>
                    <div className="font-extrabold">{rupee(unitPrice * qty)}</div>
                  </div>
                </div>
              )}

              {!unpriced && (
                <div className="hidden lg:flex gap-3 mt-6">
                  <button onClick={() => addToCart(false)} className="btn btn-ghost flex-1 py-3.5 text-base">
                    Add to Cart
                  </button>
                  <button onClick={() => addToCart(true)} className="btn btn-primary flex-1 py-3.5 text-base">
                    Buy Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* delivery */}
              <div className="card p-4 mt-6 flex items-center gap-3">
                <Truck className="w-6 h-6 text-[var(--green-700)]" />
                <div className="text-sm">
                  <b>Delivery in {store?.deliveryTime ?? 30} minutes</b>
                  <div className="text-[var(--ink-soft)] text-[12px]">
                    to {area || store?.city || 'Avinashi'} • delivery charge as per km
                  </div>
                </div>
              </div>

              {/* trust icons */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="card p-3">
                  <Leaf className="w-5 h-5 text-[var(--green-700)] mx-auto" />
                  <div className="text-[11px] font-bold mt-1">Quality assured</div>
                </div>
                <div className="card p-3">
                  <Snowflake className="w-5 h-5 text-[var(--green-700)] mx-auto" />
                  <div className="text-[11px] font-bold mt-1">Cold-chain</div>
                </div>
                <div className="card p-3">
                  <BadgeCheck className="w-5 h-5 text-[var(--green-700)] mx-auto" />
                  <div className="text-[11px] font-bold mt-1">Hygienic pack</div>
                </div>
              </div>

              {p.desc && (
                <div className="mt-6">
                  <h3 className="font-extrabold mb-1">About this product</h3>
                  <p className="text-sm text-[var(--ink-soft)] leading-relaxed">{p.desc}</p>
                </div>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="display text-xl font-extrabold mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--green-700)]" /> More from {p.categoryName}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {related.map((x) => (
                  <ProductCard key={x.id} product={x} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* mobile sticky add bar */}
      {!unpriced && (
        <div className="action-bar glass border-t border-[var(--line)] px-4 py-3 lg:hidden flex items-center gap-3">
          <div>
            <div className="text-[11px] text-[var(--ink-soft)]">Total</div>
            <div className="font-extrabold text-lg">{rupee(unitPrice * qty)}</div>
          </div>
          <button onClick={() => addToCart(false)} className="btn btn-ghost flex-1 py-3">
            Add to Cart
          </button>
          <button onClick={() => addToCart(true)} className="btn btn-primary flex-1 py-3">
            Buy Now
          </button>
        </div>
      )}
    </>
  );
}
