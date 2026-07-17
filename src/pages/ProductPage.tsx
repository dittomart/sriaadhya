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
import { useActionBarHeight } from '@/hooks/useActionBarHeight';
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
      <main className="page-bar">
        <div className="max-w-2xl mx-auto px-5 text-center py-16">
          <h1 className="display text-2xl font-extrabold">We couldn't find that item</h1>
          <p className="text-[var(--ink-soft)] text-base2 mt-2">It may have sold out or been taken off the menu.</p>
          <Link to="/category" className="btn btn-primary mt-5 px-6 inline-flex">
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
  const barRef = useActionBarHeight();

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
      <main className="page-bar">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-3">
          {/* Breadcrumb. Three segments plus a product name overflow 360px, and
              the tail — the current item — is what got pushed off. The first two
              are short and fixed; the name is the one that has to give, so it
              takes the truncation and the row never wraps or overflows. */}
          <nav aria-label="Breadcrumb" className="text-xs2 text-[var(--ink-soft)] flex items-center gap-1 mb-3 min-w-0">
            <Link to="/home" className="hover:text-[var(--green-700)] flex-none">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 flex-none" aria-hidden />
            <Link to={`/category?cat=${p.catId}`} className="hover:text-[var(--green-700)] flex-none max-w-[40%] truncate">
              {p.categoryName || 'Category'}
            </Link>
            <ChevronRight className="w-3 h-3 flex-none" aria-hidden />
            <span aria-current="page" className="text-[var(--ink)] font-semibold truncate min-w-0">
              {p.name}
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* image */}
            <div className="lg:w-1/2">
              <div className="card overflow-hidden aspect-square relative">
                <span className="absolute top-3 left-3 z-10">
                  <FoodMark type={p.foodType} />
                </span>
                {p.bestseller && (
                  <span className="absolute top-3 right-3 z-10 bg-[var(--green-700)] text-white text-micro font-bold px-2 py-1 rounded-full flex items-center gap-1">
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

              {/* The unit price changes as variants are picked — tabular-nums
                  keeps it from reflowing the badge beside it on every tap. */}
              <div className="flex items-end gap-2.5 mt-4 flex-wrap">
                {unpriced ? (
                  <span className="display text-2xl font-extrabold text-[var(--ink-soft)]">Price on request</span>
                ) : (
                  <>
                    <span className="display text-3xl font-extrabold tabular-nums">{rupee(unitPrice)}</span>
                    {oldPrice != null && (
                      <span className="text-[var(--ink-soft)] line-through tabular-nums">{rupee(oldPrice)}</span>
                    )}
                    {discountPercent != null && discountPercent > 0 && (
                      <span className="bg-[var(--coral)] text-white text-xs2 font-extrabold px-2 py-1 rounded-md tabular-nums">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs2 text-[var(--ink-soft)] mt-1">
                {unpriced ? 'Contact the store for pricing on this item.' : 'Inclusive of all taxes'}
              </p>

              {/* Variant pickers — where this store keeps its prices, so these
                  are the real buy controls and the price is not decoration.

                  `.chip` truncates at max-width:60vw with an ellipsis, and the
                  price is the tail of the label: at 360px a long option name
                  ("Boneless Chicken 500g • ₹240") ellipsed away the exact thing
                  the customer is choosing between, leaving three identical-
                  looking chips. The name truncates on its own line; the price
                  sits in its own flex-none span and can't be cut. */}
              {variants.map((g) => (
                <div key={g.id} className="mt-5">
                  <div className="text-base2 font-bold mb-2">{g.name}</div>
                  <div
                    className="flex gap-2 flex-wrap"
                    role="radiogroup"
                    aria-label={g.name}
                  >
                    {g.options.map((o) => (
                      <button
                        key={o.id}
                        role="radio"
                        aria-checked={picked[g.id] === o.id}
                        onClick={() => setPicked((prev) => ({ ...prev, [g.id]: o.id }))}
                        className={`chip !max-w-full min-w-0 ${picked[g.id] === o.id ? 'active' : ''}`}
                      >
                        <span className="truncate min-w-0">{o.name}</span>
                        <span aria-hidden className="opacity-50">•</span>
                        <span className="flex-none tabular-nums">{rupee(o.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* optional extras — same truncation trap, same fix */}
              {extras.map((g) => (
                <div key={g.id} className="mt-5">
                  <div className="text-base2 font-bold mb-2">
                    {g.name}
                    {g.limit > 0 && (
                      <span className="text-xs2 text-[var(--ink-soft)] font-normal"> · up to {g.limit}</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {g.options.map((o) => {
                      const on = checked[g.id]?.has(o.id) ?? false;
                      /* At the limit the unchecked options silently no-op —
                         they looked identical to the ones still available. */
                      const full = g.limit > 0 && !on && (checked[g.id]?.size ?? 0) >= g.limit;
                      return (
                        <button
                          key={o.id}
                          role="checkbox"
                          aria-checked={on}
                          disabled={full}
                          onClick={() => toggleExtra(g.id, o.id, g.limit)}
                          className={`chip !max-w-full min-w-0 ${on ? 'active' : ''} ${full ? 'opacity-45' : ''}`}
                        >
                          <span className="truncate min-w-0">{o.name}</span>
                          {o.price > 0 && (
                            <>
                              <span aria-hidden className="opacity-50">•</span>
                              <span className="flex-none tabular-nums">+{rupee(o.price)}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!unpriced && (
                <div className="flex items-center gap-3 mt-6">
                  <div className="text-base2 font-bold">Quantity</div>
                  <div className="stepper">
                    <button onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Decrease quantity">
                      −
                    </button>
                    <span aria-live="polite">{qty}</span>
                    <button onClick={() => setQty((n) => n + 1)} aria-label="Increase quantity">
                      +
                    </button>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs2 text-[var(--ink-soft)]">Subtotal</div>
                    <div className="font-extrabold tabular-nums">{rupee(unitPrice * qty)}</div>
                  </div>
                </div>
              )}

              {!unpriced && (
                <div className="hidden lg:flex gap-3 mt-6">
                  <button onClick={() => addToCart(false)} className="btn btn-ghost flex-1 text-base">
                    Add to Cart
                  </button>
                  <button onClick={() => addToCart(true)} className="btn btn-primary flex-1 text-base">
                    Buy Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* delivery */}
              <div className="card p-4 mt-6 flex items-center gap-3">
                <Truck className="w-6 h-6 text-[var(--green-700)] flex-none" />
                <div className="text-base2 min-w-0">
                  <b>Delivery in {store?.deliveryTime ?? 30} minutes</b>
                  <div className="text-[var(--ink-soft)] text-xs2">
                    to {area || store?.city || 'Avinashi'} • delivery charge as per km
                  </div>
                </div>
              </div>

              {/* trust icons */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="card p-3">
                  <Leaf className="w-5 h-5 text-[var(--green-700)] mx-auto" />
                  <div className="text-xs2 font-bold mt-1 leading-tight">Quality assured</div>
                </div>
                <div className="card p-3">
                  <Snowflake className="w-5 h-5 text-[var(--green-700)] mx-auto" />
                  <div className="text-xs2 font-bold mt-1 leading-tight">Cold-chain</div>
                </div>
                <div className="card p-3">
                  <BadgeCheck className="w-5 h-5 text-[var(--green-700)] mx-auto" />
                  <div className="text-xs2 font-bold mt-1 leading-tight">Hygienic pack</div>
                </div>
              </div>

              {p.desc && (
                <div className="mt-6">
                  <h3 className="font-extrabold mb-1">About this product</h3>
                  <p className="text-base2 text-[var(--ink-soft)] leading-relaxed">{p.desc}</p>
                </div>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="display text-xl font-extrabold mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--green-700)]" /> More from {p.categoryName}
              </h2>
              {/* 2 → 4 skipped a step: at the md breakpoint (768) four cards are
                  ~175px each, narrower than the same card on a 360px phone. */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {related.map((x) => (
                  <ProductCard key={x.id} product={x} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* mobile sticky add bar
          Price + two buttons on one 360px line left each button ~95px — the
          labels only just fit and neither read as the primary action. The price
          takes its own line now, and Buy Now is visibly the main one. */}
      {!unpriced && (
        <div ref={barRef} className="action-bar glass border-t border-[var(--line)] px-4 py-2.5 lg:hidden">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-micro text-[var(--ink-soft)]">Total</span>
            <span className="font-extrabold text-lg tabular-nums">{rupee(unitPrice * qty)}</span>
            {qty > 1 && <span className="text-micro text-[var(--ink-soft)]">for {qty}</span>}
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => addToCart(false)} className="btn btn-ghost flex-1 text-sm2">
              Add to Cart
            </button>
            <button onClick={() => addToCart(true)} className="btn btn-primary flex-[1.3] text-sm2">
              Buy Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
